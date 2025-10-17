// Authentication Manager
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionTimeout = 8 * 60 * 60 * 1000; // 8 hours
        this.users = this.loadUsers();
        this.loginAttempts = 0;
        this.maxLoginAttempts = 5;
        this.lockoutTime = 15 * 60 * 1000; // 15 minutes
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkExistingSession();
        this.setupSessionTimeout();
    }

    setupEventListeners() {
        // Login form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Email/Username input validation
        const emailOrUsernameInput = document.getElementById('emailOrUsername');
        if (emailOrUsernameInput) {
            emailOrUsernameInput.addEventListener('input', (e) => {
                this.validateEmailOrUsername(e.target);
            });
        }

        // Password toggle
        const passwordToggle = document.getElementById('passwordToggle');
        if (passwordToggle) {
            passwordToggle.addEventListener('click', () => {
                this.togglePassword();
            });
        }

        // Demo login
        const demoBtn = document.getElementById('demoLogin');
        if (demoBtn) {
            demoBtn.addEventListener('click', () => {
                this.loginDemo();
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Account creation
        const createAccountBtn = document.getElementById('createAccount');
        if (createAccountBtn) {
            createAccountBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showCreateAccountModal();
            });
        }

        // Forgot password
        const forgotPasswordBtn = document.getElementById('forgotPassword');
        if (forgotPasswordBtn) {
            forgotPasswordBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showForgotPasswordModal();
            });
        }
    }

    loadUsers() {
        // Default users (in production, this would come from a secure backend)
        const defaultUsers = [
            {
                id: 'admin',
                username: 'admin',
                password: 'admin123', // In production, this would be hashed
                name: 'Administrator',
                role: 'admin',
                permissions: ['all'],
                email: 'admin@ogastock.com',
                avatar: null,
                createdAt: new Date().toISOString(),
                lastLogin: null,
                emailVerified: true
            },
            {
                id: 'manager',
                username: 'manager',
                password: 'manager123',
                name: 'Store Manager',
                role: 'manager',
                permissions: ['products', 'orders', 'sales', 'reports'],
                email: 'manager@ogastock.com',
                avatar: null,
                createdAt: new Date().toISOString(),
                lastLogin: null,
                emailVerified: true
            },
            {
                id: 'cashier',
                username: 'cashier',
                password: 'cashier123',
                name: 'Cashier',
                role: 'cashier',
                permissions: ['sales', 'products:view'],
                email: 'cashier@ogastock.com',
                avatar: null,
                createdAt: new Date().toISOString(),
                lastLogin: null,
                emailVerified: true
            },
            {
                id: 'demo',
                username: 'demo',
                password: 'demo',
                name: 'Demo User',
                role: 'demo',
                permissions: ['all'],
                email: 'demo@ogastock.com',
                avatar: null,
                createdAt: new Date().toISOString(),
                lastLogin: null,
                emailVerified: true
            }
        ];

        // Load users from localStorage, fallback to defaults
        const storedUsers = localStorage.getItem('ogastock-users');
        if (storedUsers) {
            try {
                const parsedUsers = JSON.parse(storedUsers);
                // Ensure all users have email verification status
                parsedUsers.forEach(user => {
                    if (user.emailVerified === undefined) {
                        user.emailVerified = true; // Default existing users to verified
                    }
                });
                return parsedUsers;
            } catch (e) {
                console.warn('Failed to parse stored users, using defaults');
            }
        }

        // Save default users
        this.saveUsers(defaultUsers);
        return defaultUsers;
    }

    saveUsers(users) {
        localStorage.setItem('ogastock-users', JSON.stringify(users));
    }

    checkExistingSession() {
        const sessionData = localStorage.getItem('ogastock-session');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                if (this.isSessionValid(session)) {
                    this.currentUser = session.user;
                    this.showMainApp();
                    this.updateUserDisplay();
                    return;
                }
            } catch (e) {
                console.warn('Invalid session data');
            }
        }
        
        this.showLoginScreen();
    }

    isSessionValid(session) {
        if (!session || !session.user || !session.timestamp) {
            return false;
        }

        const sessionAge = Date.now() - session.timestamp;
        return sessionAge < this.sessionTimeout;
    }

    handleLogin() {
        const emailOrUsername = document.getElementById('emailOrUsername').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        if (!emailOrUsername || !password) {
            this.showError('Please enter both email/username and password');
            return;
        }

        // Validate email format if it looks like an email
        if (this.isEmail(emailOrUsername) && !this.isValidEmail(emailOrUsername)) {
            this.showError('Please enter a valid email address');
            return;
        }

        // Check for lockout
        if (this.isLockedOut()) {
            this.showError('Too many failed attempts. Please try again later.');
            return;
        }

        const loginBtn = document.querySelector('.login-btn');
        this.setLoading(loginBtn, true);

        // Simulate API delay for better UX
        setTimeout(() => {
            const user = this.authenticateUser(emailOrUsername, password);
            
            if (user) {
                this.loginSuccess(user, rememberMe);
            } else {
                this.loginFailure();
            }
            
            this.setLoading(loginBtn, false);
        }, 1000);
    }

    isEmail(input) {
        return input.includes('@');
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validateEmailOrUsername(input) {
        const icon = document.getElementById('loginIcon');
        const inputValue = input.value.trim();
        
        // Change icon based on input type
        if (this.isEmail(inputValue)) {
            icon.className = 'fas fa-at';
            
            // Validate email format
            if (inputValue && !this.isValidEmail(inputValue)) {
                input.setCustomValidity('Please enter a valid email address');
                input.style.borderColor = '#dc3545';
            } else {
                input.setCustomValidity('');
                input.style.borderColor = '';
            }
        } else {
            icon.className = 'fas fa-user';
            input.setCustomValidity('');
            input.style.borderColor = '';
        }
    }

    authenticateUser(emailOrUsername, password) {
        const user = this.users.find(u => {
            const matchesUsername = u.username.toLowerCase() === emailOrUsername.toLowerCase();
            const matchesEmail = u.email && u.email.toLowerCase() === emailOrUsername.toLowerCase();
            const matchesPassword = u.password === password;
            
            return (matchesUsername || matchesEmail) && matchesPassword;
        });

        if (user) {
            // Update last login
            user.lastLogin = new Date().toISOString();
            this.saveUsers(this.users);
            
            // Reset login attempts on success
            this.loginAttempts = 0;
            localStorage.removeItem('ogastock-lockout');
            localStorage.removeItem('ogastock-login-attempts');
            
            return user;
        }

        return null;
    }

    loginSuccess(user, rememberMe) {
        this.currentUser = user;
        
        // Create session
        const sessionData = {
            user: user,
            timestamp: Date.now(),
            rememberMe: rememberMe
        };

        localStorage.setItem('ogastock-session', JSON.stringify(sessionData));
        
        // Show success message
        this.showSuccess(`Welcome back, ${user.name}!`);
        
        // Transition to main app
        this.showMainApp();
        this.updateUserDisplay();
        
        // Initialize other managers after login
        if (typeof window.app !== 'undefined') {
            window.app.init();
        }
    }

    loginFailure() {
        this.loginAttempts++;
        localStorage.setItem('ogastock-login-attempts', this.loginAttempts.toString());
        
        if (this.loginAttempts >= this.maxLoginAttempts) {
            localStorage.setItem('ogastock-lockout', Date.now().toString());
            this.showError(`Too many failed attempts. Account locked for 15 minutes.`);
        } else {
            const remaining = this.maxLoginAttempts - this.loginAttempts;
            this.showError(`Invalid credentials. ${remaining} attempts remaining.`);
        }
        
        // Clear password field
        document.getElementById('password').value = '';
        
        // Reset input validation styles
        const emailOrUsernameInput = document.getElementById('emailOrUsername');
        if (emailOrUsernameInput) {
            emailOrUsernameInput.style.borderColor = '#dc3545';
            setTimeout(() => {
                emailOrUsernameInput.style.borderColor = '';
            }, 3000);
        }
    }

    isLockedOut() {
        const lockoutTime = localStorage.getItem('ogastock-lockout');
        if (lockoutTime) {
            const timeSinceLockout = Date.now() - parseInt(lockoutTime);
            if (timeSinceLockout < this.lockoutTime) {
                return true;
            } else {
                // Lockout expired
                localStorage.removeItem('ogastock-lockout');
                localStorage.removeItem('ogastock-login-attempts');
                this.loginAttempts = 0;
            }
        }
        return false;
    }

    loginDemo() {
        const demoUser = this.users.find(u => u.username === 'demo');
        if (demoUser) {
            // Fill in the demo credentials in the form
            const emailOrUsernameInput = document.getElementById('emailOrUsername');
            const passwordInput = document.getElementById('password');
            
            if (emailOrUsernameInput) emailOrUsernameInput.value = 'demo';
            if (passwordInput) passwordInput.value = 'demo';
            
            this.loginSuccess(demoUser, false);
            this.showInfo('Demo mode activated! All features are available for testing.');
        } else {
            this.showError('Demo account not available');
        }
    }

    logout() {
        // Clear session
        localStorage.removeItem('ogastock-session');
        this.currentUser = null;
        
        // Show logout message
        this.showInfo('You have been logged out successfully');
        
        // Clear form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.reset();
        }
        
        // Reset input styles
        const emailOrUsernameInput = document.getElementById('emailOrUsername');
        if (emailOrUsernameInput) {
            emailOrUsernameInput.style.borderColor = '';
        }
        
        // Show login screen
        this.showLoginScreen();
    }

    showLoginScreen() {
        const loginScreen = document.getElementById('loginScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (loginScreen) loginScreen.style.display = 'flex';
        if (mainApp) mainApp.style.display = 'none';
    }

    showMainApp() {
        const loginScreen = document.getElementById('loginScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (loginScreen) {
            loginScreen.style.display = 'none';
        }
        if (mainApp) {
            mainApp.style.display = 'block';
            mainApp.classList.add('show');
        }
    }

    updateUserDisplay() {
        if (!this.currentUser) return;

        const userName = document.getElementById('userName');
        const userRole = document.getElementById('userRole');
        
        if (userName) userName.textContent = this.currentUser.name;
        if (userRole) userRole.textContent = this.getRoleDisplayName(this.currentUser.role);
    }

    getRoleDisplayName(role) {
        const roleNames = {
            'admin': 'Administrator',
            'manager': 'Store Manager',
            'cashier': 'Cashier',
            'demo': 'Demo User'
        };
        return roleNames[role] || role;
    }

    togglePassword() {
        const passwordInput = document.getElementById('password');
        const toggleBtn = document.getElementById('passwordToggle');
        const icon = toggleBtn.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            passwordInput.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    setLoading(button, loading) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    showError(message) {
        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.show(message, 'error');
        } else {
            alert(message); // Fallback for when NotificationManager is not loaded
        }
    }

    showSuccess(message) {
        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.show(message, 'success');
        } else {
            console.log('Success: ' + message);
        }
    }

    showInfo(message) {
        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.show(message, 'info');
        } else {
            console.log('Info: ' + message);
        }
    }

    setupSessionTimeout() {
        // Check session validity every minute
        setInterval(() => {
            if (this.currentUser) {
                const sessionData = localStorage.getItem('ogastock-session');
                if (sessionData) {
                    try {
                        const session = JSON.parse(sessionData);
                        if (!this.isSessionValid(session)) {
                            this.logout();
                            this.showError('Session expired. Please log in again.');
                        }
                    } catch (e) {
                        this.logout();
                    }
                }
            }
        }, 60000); // Check every minute
    }

    // Permission system
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        const userPermissions = this.currentUser.permissions || [];
        
        // Admin has all permissions
        if (userPermissions.includes('all')) return true;
        
        // Check specific permission
        return userPermissions.includes(permission);
    }

    // Role-based access control
    hasRole(role) {
        if (!this.currentUser) return false;
        return this.currentUser.role === role;
    }

    isAdmin() {
        return this.hasRole('admin');
    }

    isManager() {
        return this.hasRole('manager') || this.isAdmin();
    }

    isCashier() {
        return this.hasRole('cashier');
    }

    // User management (for admins)
    createUser(userData) {
        if (!this.isAdmin()) {
            throw new Error('Insufficient permissions');
        }

        const newUser = {
            id: `user_${Date.now()}`,
            username: userData.username,
            password: userData.password, // Should be hashed in production
            name: userData.name,
            role: userData.role,
            permissions: userData.permissions || [],
            email: userData.email,
            avatar: null,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };

        this.users.push(newUser);
        this.saveUsers(this.users);
        
        return newUser;
    }

    // Enhanced user management and password recovery
    showForgotPasswordModal() {
        const modal = this.createModal('Password Reset', `
            <form id="forgotPasswordForm">
                <div class="form-group">
                    <label for="resetEmail">Email Address</label>
                    <div class="input-group">
                        <i class="fas fa-envelope"></i>
                        <input type="email" id="resetEmail" required placeholder="Enter your email address">
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">Send Reset Link</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                </div>
            </form>
        `);

        document.body.appendChild(modal);

        // Handle form submission
        const form = modal.querySelector('#forgotPasswordForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePasswordReset(form);
        });
    }

    showCreateAccountModal() {
        const modal = this.createModal('Create Account', `
            <form id="createAccountForm">
                <div class="form-group">
                    <label for="newFullName">Full Name</label>
                    <div class="input-group">
                        <i class="fas fa-user"></i>
                        <input type="text" id="newFullName" required placeholder="Enter your full name">
                    </div>
                </div>
                <div class="form-group">
                    <label for="newEmail">Email Address</label>
                    <div class="input-group">
                        <i class="fas fa-envelope"></i>
                        <input type="email" id="newEmail" required placeholder="Enter your email address">
                    </div>
                </div>
                <div class="form-group">
                    <label for="newUsername">Username</label>
                    <div class="input-group">
                        <i class="fas fa-user-circle"></i>
                        <input type="text" id="newUsername" required placeholder="Choose a username">
                    </div>
                </div>
                <div class="form-group">
                    <label for="newPassword">Password</label>
                    <div class="input-group">
                        <i class="fas fa-lock"></i>
                        <input type="password" id="newPassword" required placeholder="Create a password">
                        <button type="button" class="password-toggle" onclick="this.previousElementSibling.type = this.previousElementSibling.type === 'password' ? 'text' : 'password'">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                    <small class="form-text">Password must be at least 6 characters long</small>
                </div>
                <div class="form-group">
                    <label for="confirmPassword">Confirm Password</label>
                    <div class="input-group">
                        <i class="fas fa-lock"></i>
                        <input type="password" id="confirmPassword" required placeholder="Confirm your password">
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">Create Account</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                </div>
            </form>
        `);

        document.body.appendChild(modal);

        // Handle form submission
        const form = modal.querySelector('#createAccountForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAccountCreation(form);
        });
    }

    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button type="button" class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        return modal;
    }

    handlePasswordReset(form) {
        const email = form.querySelector('#resetEmail').value.trim();
        
        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        const user = this.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
        
        if (user) {
            // In a real application, this would send an email
            // For demo purposes, we'll generate a temporary password
            const tempPassword = this.generateTemporaryPassword();
            user.password = tempPassword;
            user.resetRequired = true;
            this.saveUsers(this.users);
            
            this.showSuccess(`Password reset successful! Your temporary password is: ${tempPassword}\nPlease change it after logging in.`);
            form.closest('.modal').remove();
        } else {
            this.showError('No account found with that email address');
        }
    }

    handleAccountCreation(form) {
        const formData = new FormData(form);
        const name = form.querySelector('#newFullName').value.trim();
        const email = form.querySelector('#newEmail').value.trim();
        const username = form.querySelector('#newUsername').value.trim();
        const password = form.querySelector('#newPassword').value;
        const confirmPassword = form.querySelector('#confirmPassword').value;

        // Validation
        if (!name || !email || !username || !password || !confirmPassword) {
            this.showError('Please fill in all fields');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        // Check if username or email already exists
        const existingUser = this.users.find(u => 
            u.username.toLowerCase() === username.toLowerCase() || 
            (u.email && u.email.toLowerCase() === email.toLowerCase())
        );

        if (existingUser) {
            this.showError('Username or email already exists');
            return;
        }

        // Create new user
        const newUser = {
            id: `user_${Date.now()}`,
            username: username,
            password: password, // In production, this would be hashed
            name: name,
            role: 'cashier', // Default role for new accounts
            permissions: ['sales', 'products:view'],
            email: email,
            avatar: null,
            createdAt: new Date().toISOString(),
            lastLogin: null,
            emailVerified: false // In production, would require email verification
        };

        this.users.push(newUser);
        this.saveUsers(this.users);

        this.showSuccess('Account created successfully! You can now log in.');
        form.closest('.modal').remove();
    }

    generateTemporaryPassword() {
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let password = '';
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    // Get current user info
    getCurrentUser() {
        return this.currentUser;
    }

    // Update user session timestamp (call this on user activity)
    updateSessionActivity() {
        if (this.currentUser) {
            const sessionData = localStorage.getItem('ogastock-session');
            if (sessionData) {
                try {
                    const session = JSON.parse(sessionData);
                    session.timestamp = Date.now();
                    localStorage.setItem('ogastock-session', JSON.stringify(session));
                } catch (e) {
                    console.warn('Failed to update session activity');
                }
            }
        }
    }
}

// Initialize Auth Manager
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
    
    // Update session activity on user interactions
    const activityEvents = ['click', 'keypress', 'scroll', 'mousemove'];
    let lastActivity = Date.now();
    
    activityEvents.forEach(event => {
        document.addEventListener(event, () => {
            const now = Date.now();
            if (now - lastActivity > 60000) { // Update at most once per minute
                window.authManager.updateSessionActivity();
                lastActivity = now;
            }
        }, { passive: true });
    });
});