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

        // Account creation (placeholder)
        const createAccountBtn = document.getElementById('createAccount');
        if (createAccountBtn) {
            createAccountBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showCreateAccount();
            });
        }

        // Forgot password (placeholder)
        const forgotPasswordBtn = document.getElementById('forgotPassword');
        if (forgotPasswordBtn) {
            forgotPasswordBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showForgotPassword();
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
                lastLogin: null
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
                lastLogin: null
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
                lastLogin: null
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
                lastLogin: null
            }
        ];

        // Load users from localStorage, fallback to defaults
        const storedUsers = localStorage.getItem('ogastock-users');
        if (storedUsers) {
            try {
                return JSON.parse(storedUsers);
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
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        if (!username || !password) {
            this.showError('Please enter both username and password');
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
            const user = this.authenticateUser(username, password);
            
            if (user) {
                this.loginSuccess(user, rememberMe);
            } else {
                this.loginFailure();
            }
            
            this.setLoading(loginBtn, false);
        }, 1000);
    }

    authenticateUser(username, password) {
        const user = this.users.find(u => 
            u.username.toLowerCase() === username.toLowerCase() && 
            u.password === password
        );

        if (user) {
            // Update last login
            user.lastLogin = new Date().toISOString();
            this.saveUsers(this.users);
            
            // Reset login attempts on success
            this.loginAttempts = 0;
            localStorage.removeItem('ogastock-lockout');
            
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
            this.loginSuccess(demoUser, false);
            this.showInfo('Demo mode activated! All features are available for testing.');
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

    // Placeholder methods for future features
    showCreateAccount() {
        this.showInfo('Account creation feature coming soon! Please contact your administrator.');
    }

    showForgotPassword() {
        this.showInfo('Password reset feature coming soon! Please contact your administrator.');
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