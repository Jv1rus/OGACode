// Firebase Authentication Manager
class FirebaseAuthManager {
    constructor() {
        this.currentUser = null;
        this.auth = null;
        this.db = null;
        
        // Wait for Firebase to initialize
        this.waitForFirebase().then(() => {
            this.init();
        });
    }

    async waitForFirebase() {
        // Show loading screen
        this.showFirebaseLoading();
        
        let attempts = 0;
        const maxAttempts = 30; // 3 seconds maximum wait
        
        // Wait for Firebase to be available
        while (!window.firebaseAuth || !window.firebaseDb) {
            if (attempts >= maxAttempts) {
                this.hideFirebaseLoading();
                this.showError('Failed to connect to Firebase. Please check your internet connection and refresh the page.');
                console.error('❌ Firebase initialization timeout');
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        this.auth = window.firebaseAuth;
        this.db = window.firebaseDb;
        
        // Verify Firebase services are working
        try {
            // Test authentication service
            if (!this.auth || typeof this.auth.signInWithEmailAndPassword !== 'function') {
                throw new Error('Firebase Authentication service not available');
            }
            
            // Test Firestore service
            if (!this.db || typeof this.db.collection !== 'function') {
                throw new Error('Firestore service not available');
            }
            
            console.log('✅ Firebase services connected and verified');
            
        } catch (error) {
            console.error('❌ Firebase service verification failed:', error);
            this.hideFirebaseLoading();
            this.showError('Firebase services not available. Please refresh the page.');
            return;
        }
        
        // Hide loading screen
        this.hideFirebaseLoading();
        console.log('Firebase services connected');
    }

    showFirebaseLoading() {
        const loadingScreen = document.getElementById('firebaseLoading');
        const loginContainer = document.getElementById('loginContainer');
        
        if (loadingScreen) loadingScreen.style.display = 'flex';
        if (loginContainer) loginContainer.style.display = 'none';
    }

    hideFirebaseLoading() {
        const loadingScreen = document.getElementById('firebaseLoading');
        const loginContainer = document.getElementById('loginContainer');
        
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (loginContainer) loginContainer.style.display = 'block';
    }

    init() {
        this.setupEventListeners();
        this.setupAuthStateListener();
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
        // Auth Tab Switching
        const signInTab = document.getElementById('signInTab');
        const signUpTab = document.getElementById('signUpTab');
        const loginForm = document.getElementById('loginForm');
        const signUpForm = document.getElementById('signUpForm');

        if (signInTab && signUpTab) {
            signInTab.addEventListener('click', () => {
                signInTab.classList.add('active');
                signUpTab.classList.remove('active');
                loginForm.classList.add('active');
                signUpForm.classList.remove('active');
            });

            signUpTab.addEventListener('click', () => {
                signUpTab.classList.add('active');
                signInTab.classList.remove('active');
                signUpForm.classList.add('active');
                loginForm.classList.remove('active');
            });
        }

        // Login form submission
        const loginFormEl = document.getElementById('loginForm');
        if (loginFormEl) {
            loginFormEl.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Sign Up form submission
        const signUpFormEl = document.getElementById('signUpForm');
        if (signUpFormEl) {
            signUpFormEl.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSignUp();
            });
        }

        // Password matching validation for signup
        const signupPassword = document.getElementById('signupPassword');
        const signupConfirmPassword = document.getElementById('signupConfirmPassword');
        const passwordMatchError = document.getElementById('passwordMatchError');

        if (signupPassword && signupConfirmPassword && passwordMatchError) {
            const validatePasswordMatch = () => {
                if (signupConfirmPassword.value && signupPassword.value !== signupConfirmPassword.value) {
                    passwordMatchError.style.display = 'block';
                    signupConfirmPassword.setCustomValidity('Passwords do not match');
                } else {
                    passwordMatchError.style.display = 'none';
                    signupConfirmPassword.setCustomValidity('');
                }
            };

            signupPassword.addEventListener('input', validatePasswordMatch);
            signupConfirmPassword.addEventListener('input', validatePasswordMatch);
        }

        // Sign up password toggles
        const signupPasswordToggle = document.getElementById('signupPasswordToggle');
        if (signupPasswordToggle) {
            signupPasswordToggle.addEventListener('click', () => {
                this.togglePasswordField('signupPassword', signupPasswordToggle);
            });
        }

        const signupConfirmPasswordToggle = document.getElementById('signupConfirmPasswordToggle');
        if (signupConfirmPasswordToggle) {
            signupConfirmPasswordToggle.addEventListener('click', () => {
                this.togglePasswordField('signupConfirmPassword', signupConfirmPasswordToggle);
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

        // Google Sign-In (login form)
        const googleBtn = document.getElementById('googleLogin');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => {
                this.signInWithGoogle();
            });
        }

        // Google Sign-Up (signup form)
        const googleSignUpBtn = document.getElementById('googleSignUp');
        if (googleSignUpBtn) {
            googleSignUpBtn.addEventListener('click', () => {
                this.signInWithGoogle();
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
        const rememberMe = document.getElementById('rememberMe').checked;

        if (!emailOrUsername || !password) {
            this.showError('Please enter both email and password');
            return;
        }

        // Validate email format
        if (!this.isValidEmail(emailOrUsername)) {
            this.showError('Please enter a valid email address');
            return;
        }

        // Set Firebase Auth persistence based on remember me
        const persistence = rememberMe ? 
            firebase.auth.Auth.Persistence.LOCAL : 
            firebase.auth.Auth.Persistence.SESSION;
        
        try {
            await this.auth.setPersistence(persistence);
        } catch (error) {
            console.warn('Could not set auth persistence:', error);
        }

        const loginBtn = document.querySelector('.login-btn');
        this.setLoading(loginBtn, true);

        try {
            // Sign in with Firebase Auth
            const userCredential = await this.auth.signInWithEmailAndPassword(emailOrUsername, password);
            const user = userCredential.user;
            
            // Check if email is verified
            if (!user.emailVerified) {
                this.showEmailVerificationPrompt(user);
                return;
            }
            
            // Update last login in Firestore
            if (this.currentUser) {
                await this.db.collection('users').doc(this.currentUser.uid).update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            this.showSuccess('Login successful! Welcome back.');
            
        } catch (error) {
            this.handleLoginError(error);
        } finally {
            this.setLoading(loginBtn, false);
        }
    }

    showEmailVerificationPrompt(user) {
        const modal = this.createModal('Email Verification Required', `
            <div class="verification-prompt">
                <div class="verification-icon">
                    <i class="fas fa-envelope-open-text"></i>
                </div>
                <p>Your email address <strong>${user.email}</strong> needs to be verified before you can access your account.</p>
                <p>Please check your email and click the verification link, or request a new verification email.</p>
                <div class="modal-actions">
                    <button type="button" class="btn btn-primary" id="resendVerification">
                        <i class="fas fa-paper-plane"></i> Resend Verification Email
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        `);

        document.body.appendChild(modal);

        // Handle resend verification
        const resendBtn = modal.querySelector('#resendVerification');
        resendBtn.addEventListener('click', async () => {
            try {
                this.setLoading(resendBtn, true);
                await user.sendEmailVerification();
                this.showSuccess('Verification email sent! Please check your inbox.');
                modal.remove();
            } catch (error) {
                console.error('Error sending verification email:', error);
                this.showError('Failed to send verification email. Please try again.');
            } finally {
                this.setLoading(resendBtn, false);
            }
        });

        // Sign out the unverified user
        this.auth.signOut();
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
        
        this.showError(errorMessage);
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

    togglePasswordField(fieldId, toggleBtn) {
        const passwordInput = document.getElementById(fieldId);
        const icon = toggleBtn.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            passwordInput.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    async handleSignUp() {
        const fullName = document.getElementById('signupFullName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;

        // Validation
        if (!fullName || !email || !password || !confirmPassword) {
            this.showError('Please fill in all fields');
            return;
        }

        if (!agreeTerms) {
            this.showError('You must agree to the Terms of Service and Privacy Policy');
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

        const submitBtn = document.querySelector('#signUpForm button[type="submit"]');
        this.setLoading(submitBtn, true);

        try {
            // Create user account with Firebase Auth
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Update user profile
            await user.updateProfile({
                displayName: fullName
            });

            // Send email verification
            await user.sendEmailVerification();

            // Create user profile in Firestore
            await this.db.collection('users').doc(user.uid).set({
                name: fullName,
                email: email,
                role: 'cashier', // Default role for new accounts
                permissions: ['sales', 'products:view'],
                avatar: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                emailVerified: false
            });

            this.showSuccess('Account created successfully! Please check your email to verify your account before logging in.');
            
            // Switch to sign in tab
            const signInTab = document.getElementById('signInTab');
            const signUpTab = document.getElementById('signUpTab');
            const loginForm = document.getElementById('loginForm');
            const signUpForm = document.getElementById('signUpForm');
            
            if (signInTab && signUpTab && loginForm && signUpForm) {
                signInTab.classList.add('active');
                signUpTab.classList.remove('active');
                loginForm.classList.add('active');
                signUpForm.classList.remove('active');
            }
            
            // Fill the login form with the new email
            const loginEmailInput = document.getElementById('emailOrUsername');
            if (loginEmailInput) {
                loginEmailInput.value = email;
            }

            // Clear signup form
            document.getElementById('signUpForm').reset();
            
        } catch (error) {
            console.error('Sign up error:', error);
            
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
        console.log('Showing Create Account modal');
        
        // Check if Firebase is initialized
        if (!this.auth || !this.db) {
            this.showError('Authentication system is still initializing. Please wait a moment and try again.');
            return;
        }
        
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
                        <input type="password" id="newPassword" required placeholder="Create a password" minlength="6">
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
                        <input type="password" id="confirmPassword" required placeholder="Confirm your password" minlength="6">
                        <button type="button" class="password-toggle" onclick="this.previousElementSibling.type = this.previousElementSibling.type === 'password' ? 'text' : 'password'">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                    <small class="form-text" id="passwordMatch" style="color: #dc3545; display: none;">Passwords do not match</small>
                </div>
                <div class="form-group">
                    <label class="checkbox-container">
                        <input type="checkbox" id="agreeTerms" required>
                        <span class="checkmark"></span>
                        I agree to the Terms of Service and Privacy Policy
                    </label>
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
        
        // Add real-time password validation
        const newPassword = form.querySelector('#newPassword');
        const confirmPassword = form.querySelector('#confirmPassword');
        const passwordMatch = form.querySelector('#passwordMatch');
        
        const validatePasswords = () => {
            if (confirmPassword.value && newPassword.value !== confirmPassword.value) {
                passwordMatch.style.display = 'block';
                confirmPassword.setCustomValidity('Passwords do not match');
            } else {
                passwordMatch.style.display = 'none';
                confirmPassword.setCustomValidity('');
            }
        };
        
        newPassword.addEventListener('input', validatePasswords);
        confirmPassword.addEventListener('input', validatePasswords);
        
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
        const agreeTerms = form.querySelector('#agreeTerms').checked;

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            this.showError('Please fill in all fields');
            return;
        }

        if (!agreeTerms) {
            this.showError('You must agree to the Terms of Service and Privacy Policy');
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

            this.showSuccess('Account created successfully! Please check your email to verify your account before logging in.');
            form.closest('.modal').remove();
            
            // Optionally fill the login form with the new email
            const loginEmailInput = document.getElementById('emailOrUsername');
            if (loginEmailInput) {
                loginEmailInput.value = email;
            }
            
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

    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');
            
            const result = await this.auth.signInWithPopup(provider);
            const user = result.user;
            
            // Check if this is a new user
            const userDoc = await this.db.collection('users').doc(user.uid).get();
            
            if (!userDoc.exists) {
                // Create user profile for new Google user
                await this.db.collection('users').doc(user.uid).set({
                    name: user.displayName,
                    email: user.email,
                    role: 'cashier', // Default role
                    permissions: ['sales', 'products:view'],
                    avatar: user.photoURL,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                    emailVerified: user.emailVerified,
                    provider: 'google'
                });
                
                this.showSuccess('Google account linked successfully! Welcome to OgaStock.');
            } else {
                // Update last login for existing user
                await this.db.collection('users').doc(user.uid).update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                this.showSuccess('Welcome back! Signed in with Google.');
            }
            
        } catch (error) {
            console.error('Google Sign-In error:', error);
            
            let errorMessage = 'Google Sign-In failed. Please try again.';
            
            switch (error.code) {
                case 'auth/popup-closed-by-user':
                    errorMessage = 'Sign-in was cancelled.';
                    break;
                case 'auth/popup-blocked':
                    errorMessage = 'Popup was blocked by browser. Please allow popups and try again.';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Network error. Please check your internet connection.';
                    break;
                default:
                    errorMessage = error.message || 'Google Sign-In failed. Please try again.';
            }
            
            this.showError(errorMessage);
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
        const demoBtn = document.getElementById('demoLogin');
        
        try {
            // Show loading state
            if (demoBtn) {
                this.setLoading(demoBtn, true);
            }
            
            this.showInfo('Connecting to demo account...');
            
            // Demo login credentials
            const demoEmail = 'demo@ogastock.com';
            const demoPassword = 'Demo@123456'; // More secure password
            
            // Fill in the demo credentials in the form for transparency
            const emailOrUsernameInput = document.getElementById('emailOrUsername');
            const passwordInput = document.getElementById('password');
            
            if (emailOrUsernameInput) emailOrUsernameInput.value = demoEmail;
            if (passwordInput) passwordInput.value = '••••••••';
            
            // Check if Firebase is initialized
            if (!this.auth || !this.db) {
                throw new Error('Firebase services not initialized');
            }
            
            // Try to sign in with demo account
            try {
                const userCredential = await this.auth.signInWithEmailAndPassword(demoEmail, demoPassword);
                
                // Update last login
                await this.db.collection('users').doc(userCredential.user.uid).update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(err => console.warn('Could not update last login:', err));
                
                this.showSuccess('Demo mode activated! Explore all features with full access.');
                
            } catch (signInError) {
                // If user not found, create the demo account
                if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/wrong-password') {
                    console.log('Creating demo account...');
                    await this.createDemoAccount(demoEmail, demoPassword);
                } else {
                    throw signInError;
                }
            }
            
        } catch (error) {
            console.error('Demo login error:', error);
            
            let errorMessage = 'Demo login failed. ';
            
            switch (error.code) {
                case 'auth/network-request-failed':
                    errorMessage += 'Please check your internet connection.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage += 'Too many attempts. Please try again later.';
                    break;
                case 'auth/api-key-not-valid':
                    errorMessage += 'Firebase configuration error. Please contact support.';
                    break;
                default:
                    errorMessage += error.message || 'Please try again or contact support.';
            }
            
            this.showError(errorMessage);
            
            // Clear the form on error
            const emailOrUsernameInput = document.getElementById('emailOrUsername');
            const passwordInput = document.getElementById('password');
            if (emailOrUsernameInput) emailOrUsernameInput.value = '';
            if (passwordInput) passwordInput.value = '';
            
        } finally {
            // Remove loading state
            if (demoBtn) {
                this.setLoading(demoBtn, false);
            }
        }
    }

    async createDemoAccount(email, password) {
        try {
            this.showInfo('Setting up demo account for first use...');
            
            // Create the demo user account
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Update user profile
            await user.updateProfile({
                displayName: 'Demo User',
                photoURL: null
            });
            
            // Mark email as verified (skip verification for demo)
            // Note: This won't actually verify in Firebase, but we'll set it in our DB
            
            // Create comprehensive demo user profile in Firestore
            await this.db.collection('users').doc(user.uid).set({
                name: 'Demo User',
                email: email,
                role: 'demo',
                permissions: ['all'], // Full permissions for demo
                avatar: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                emailVerified: true, // Mark as verified in our system
                accountType: 'demo',
                bio: 'Demo account for exploring OgaStock features',
                phone: null,
                address: null
            });
            
            this.showSuccess('Demo account created successfully! Welcome to OgaStock.');
            
        } catch (createError) {
            console.error('Demo account creation error:', createError);
            
            let errorMessage = 'Failed to create demo account. ';
            
            switch (createError.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Demo account exists but login failed. Please try again.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Demo account password configuration error.';
                    break;
                case 'auth/network-request-failed':
                    errorMessage += 'Network error. Please check your connection.';
                    break;
                default:
                    errorMessage += createError.message || 'Please contact support.';
            }
            
            throw new Error(errorMessage);
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
        if (!icon) return; // Guard against missing element
        
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

    // Firebase handles rate limiting and account lockouts automatically

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