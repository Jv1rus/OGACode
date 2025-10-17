// Firebase Authentication Manager
class FirebaseAuthManager {
    constructor() {
        this.currentUser = null;
        this.auth = null;
        this.db = null;
        this.loginAttempts = 0;
        this.maxLoginAttempts = 5;
        this.lockoutTime = 15 * 60 * 1000; // 15 minutes
        
        // Wait for Firebase to initialize
        this.waitForFirebase().then(() => {
            this.init();
        });
    }

    async waitForFirebase() {
        // Wait for Firebase to be available
        while (!window.firebaseAuth || !window.firebaseDb) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        this.auth = window.firebaseAuth;
        this.db = window.firebaseDb;
        console.log('Firebase services connected');
    }

    init() {
        this.setupEventListeners();
        this.setupAuthStateListener();
        this.checkExistingSession();
    }

    setupAuthStateListener() {
        // Listen for authentication state changes
        this.auth.onAuthStateChanged((user) => {
            if (user) {
                // User is signed in
                this.handleAuthStateChange(user);
            } else {
                // User is signed out
                this.currentUser = null;
                this.showLoginScreen();
            }
        });
    }

    async handleAuthStateChange(firebaseUser) {
        try {
            // Get user profile from Firestore
            const userDoc = await this.db.collection('users').doc(firebaseUser.uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                this.currentUser = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    emailVerified: firebaseUser.emailVerified,
                    ...userData
                };
                
                this.showMainApp();
                this.updateUserDisplay();
                
                // Initialize other managers after login
                if (typeof window.app !== 'undefined') {
                    window.app.init();
                }
            } else {
                // User document doesn't exist, create default profile
                await this.createUserProfile(firebaseUser);
            }
        } catch (error) {
            console.error('Error handling auth state change:', error);
            this.showError('Error loading user profile');
        }
    }

    async createUserProfile(firebaseUser) {
        try {
            const userProfile = {
                name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                email: firebaseUser.email,
                role: 'cashier', // Default role
                permissions: ['sales', 'products:view'],
                avatar: firebaseUser.photoURL || null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            };

            await this.db.collection('users').doc(firebaseUser.uid).set(userProfile);
            
            this.currentUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                emailVerified: firebaseUser.emailVerified,
                ...userProfile
            };

            this.showMainApp();
            this.updateUserDisplay();
            this.showSuccess('Welcome! Your account has been set up.');
        } catch (error) {
            console.error('Error creating user profile:', error);
            this.showError('Error setting up user profile');
        }
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

    async handleLogin() {
        const emailOrUsername = document.getElementById('emailOrUsername').value.trim();
        const password = document.getElementById('password').value;

        if (!emailOrUsername || !password) {
            this.showError('Please enter both email and password');
            return;
        }

        // Validate email format
        if (!this.isValidEmail(emailOrUsername)) {
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

        try {
            // Sign in with Firebase Auth
            await this.auth.signInWithEmailAndPassword(emailOrUsername, password);
            
            // Update last login in Firestore
            if (this.currentUser) {
                await this.db.collection('users').doc(this.currentUser.uid).update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            // Reset login attempts on success
            this.loginAttempts = 0;
            localStorage.removeItem('ogastock-lockout');
            localStorage.removeItem('ogastock-login-attempts');
            
            this.showSuccess('Login successful!');
            
        } catch (error) {
            this.handleLoginError(error);
        } finally {
            this.setLoading(loginBtn, false);
        }
    }

    handleLoginError(error) {
        console.error('Login error:', error);
        
        let errorMessage = 'Login failed. Please try again.';
        
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address format';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled';
                break;
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email address';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your connection.';
                break;
            default:
                errorMessage = error.message || 'Login failed. Please try again.';
        }
        
        this.loginFailure(errorMessage);
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

    async showForgotPasswordModal() {
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

    async showCreateAccountModal() {
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

    async handlePasswordReset(form) {
        const email = form.querySelector('#resetEmail').value.trim();
        
        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        this.setLoading(submitBtn, true);

        try {
            await this.auth.sendPasswordResetEmail(email);
            this.showSuccess('Password reset email sent! Check your inbox for instructions.');
            form.closest('.modal').remove();
        } catch (error) {
            console.error('Password reset error:', error);
            
            let errorMessage = 'Failed to send reset email';
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No account found with that email address';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many requests. Please try again later.';
                    break;
                default:
                    errorMessage = error.message || 'Failed to send reset email';
            }
            
            this.showError(errorMessage);
        } finally {
            this.setLoading(submitBtn, false);
        }
    }

    async handleAccountCreation(form) {
        const name = form.querySelector('#newFullName').value.trim();
        const email = form.querySelector('#newEmail').value.trim();
        const password = form.querySelector('#newPassword').value;
        const confirmPassword = form.querySelector('#confirmPassword').value;

        // Validation
        if (!name || !email || !password || !confirmPassword) {
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

        const submitBtn = form.querySelector('button[type="submit"]');
        this.setLoading(submitBtn, true);

        try {
            // Create user account with Firebase Auth
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Update user profile
            await user.updateProfile({
                displayName: name
            });

            // Send email verification
            await user.sendEmailVerification();

            // Create user profile in Firestore
            await this.db.collection('users').doc(user.uid).set({
                name: name,
                email: email,
                role: 'cashier', // Default role for new accounts
                permissions: ['sales', 'products:view'],
                avatar: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                emailVerified: false
            });

            this.showSuccess('Account created successfully! Please check your email to verify your account.');
            form.closest('.modal').remove();
            
        } catch (error) {
            console.error('Account creation error:', error);
            
            let errorMessage = 'Failed to create account';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'An account with this email already exists';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak. Please choose a stronger password.';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = 'Account creation is currently disabled';
                    break;
                default:
                    errorMessage = error.message || 'Failed to create account';
            }
            
            this.showError(errorMessage);
        } finally {
            this.setLoading(submitBtn, false);
        }
    }

    async logout() {
        try {
            await this.auth.signOut();
            this.currentUser = null;
            
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
            
            this.showInfo('You have been logged out successfully');
            this.showLoginScreen();
            
        } catch (error) {
            console.error('Logout error:', error);
            this.showError('Error logging out');
        }
    }

    async loginDemo() {
        try {
            // Demo login with predefined demo account
            const demoEmail = 'demo@ogastock.com';
            const demoPassword = 'demo123';
            
            // Fill in the demo credentials in the form
            const emailOrUsernameInput = document.getElementById('emailOrUsername');
            const passwordInput = document.getElementById('password');
            
            if (emailOrUsernameInput) emailOrUsernameInput.value = demoEmail;
            if (passwordInput) passwordInput.value = demoPassword;
            
            // Try to sign in with demo account
            await this.auth.signInWithEmailAndPassword(demoEmail, demoPassword);
            this.showInfo('Demo mode activated! All features are available for testing.');
            
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                // Create demo account if it doesn't exist
                try {
                    const userCredential = await this.auth.createUserWithEmailAndPassword(demoEmail, 'demo123');
                    const user = userCredential.user;
                    
                    await user.updateProfile({
                        displayName: 'Demo User'
                    });
                    
                    // Create demo user profile in Firestore
                    await this.db.collection('users').doc(user.uid).set({
                        name: 'Demo User',
                        email: demoEmail,
                        role: 'demo',
                        permissions: ['all'],
                        avatar: null,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                        emailVerified: true
                    });
                    
                    this.showInfo('Demo account created and activated! All features are available for testing.');
                } catch (createError) {
                    console.error('Demo account creation error:', createError);
                    this.showError('Unable to create demo account');
                }
            } else {
                console.error('Demo login error:', error);
                this.showError('Demo login failed');
            }
        }
    }

    checkExistingSession() {
        // Firebase handles auth state automatically
        // This method is kept for compatibility but isn't needed
        console.log('Firebase auth state will be handled automatically');
    }

    // Utility methods
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

    loginFailure(errorMessage) {
        this.loginAttempts++;
        localStorage.setItem('ogastock-login-attempts', this.loginAttempts.toString());
        
        if (this.loginAttempts >= this.maxLoginAttempts) {
            localStorage.setItem('ogastock-lockout', Date.now().toString());
            this.showError(`Too many failed attempts. Account locked for 15 minutes.`);
        } else {
            const remaining = this.maxLoginAttempts - this.loginAttempts;
            this.showError(`${errorMessage} ${remaining} attempts remaining.`);
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
        
        if (userName) userName.textContent = this.currentUser.name || this.currentUser.email;
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

    // Get current user info
    getCurrentUser() {
        return this.currentUser;
    }

    // Legacy placeholder methods (keeping for compatibility)
    showCreateAccount() {
        this.showCreateAccountModal();
    }

    showForgotPassword() {
        this.showForgotPasswordModal();
    }
}

// Initialize Firebase Auth Manager
document.addEventListener('DOMContentLoaded', () => {
    // Use Firebase Auth Manager instead of the old AuthManager
    window.authManager = new FirebaseAuthManager();
    console.log('Firebase Authentication Manager initialized');
});