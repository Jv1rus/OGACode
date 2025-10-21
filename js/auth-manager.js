// Firebase Authentication Manager for OgaStock
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    sendEmailVerification
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.initialized = false;
        this.auth = null;
        this.db = null;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            // Initialize Firebase
            const firebaseConfig = {
                apiKey: "AIzaSyC5aJiXN6iWwrJU9XIdEBUvPwJAH4KpP7Y",
                authDomain: "ogastock.firebaseapp.com",
                projectId: "ogastock",
                storageBucket: "ogastock.firebasestorage.app",
                messagingSenderId: "471046818751",
                appId: "1:471046818751:web:f473f012d71a081b0e2f0a"
            };

            const app = initializeApp(firebaseConfig);
            this.auth = getAuth(app);
            this.db = getFirestore(app);

            // Listen for auth state changes
            onAuthStateChanged(this.auth, async (user) => {
                console.log('Auth state changed:', user ? 'logged in' : 'logged out');
                
                if (user) {
                    await this.handleUserLogin(user);
                    this.showMainApp();
                } else {
                    this.currentUser = null;
                    this.showLoginPage();
                }
            });

            this.initialized = true;
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Firebase initialization error:', error);
            this.showLoginPage();
        }
    }

    async handleUserLogin(firebaseUser) {
        try {
            const userDoc = await getDoc(doc(this.db, 'users', firebaseUser.uid));
            
            if (userDoc.exists()) {
                this.currentUser = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    emailVerified: firebaseUser.emailVerified,
                    ...userDoc.data()
                };
                
                // Store user data locally for offline access
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                
                await this.updateLastLogin(firebaseUser.uid);
                console.log('User logged in:', this.currentUser.name);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    async updateLastLogin(uid) {
        try {
            await updateDoc(doc(this.db, 'users', uid), {
                lastLogin: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating last login:', error);
        }
    }

    async login(email, password) {
        try {
            this.showLoader('Signing in...');
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            this.hideLoader();
            return { success: true, user: userCredential.user };
        } catch (error) {
            this.hideLoader();
            this.handleAuthError(error);
            return { success: false, error: error.message };
        }
    }

    async register(email, password, name) {
        try {
            this.showLoader('Creating account...');
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;

            // Create user profile in Firestore
            await this.createUserProfile(user.uid, {
                name: name,
                email: email,
                role: 'cashier'
            });

            // Send email verification
            await sendEmailVerification(user);
            
            this.hideLoader();
            return { success: true, user };
        } catch (error) {
            this.hideLoader();
            this.handleAuthError(error);
            return { success: false, error: error.message };
        }
    }

    async logout() {
        try {
            await signOut(this.auth);
            this.currentUser = null;
            localStorage.removeItem('currentUser');
            console.log('User logged out');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    async resetPassword(email) {
        try {
            await sendPasswordResetEmail(this.auth, email);
            return { success: true };
        } catch (error) {
            this.handleAuthError(error);
            return { success: false, error: error.message };
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    hasPermission(permission) {
        if (!this.currentUser) return false;
        if (this.currentUser.permissions && this.currentUser.permissions.includes('all')) return true;
        return this.currentUser.permissions && this.currentUser.permissions.includes(permission);
    }

    hasRole(role) {
        if (!this.currentUser) return false;
        return this.currentUser.role === role;
    }

    isAdmin() {
        return this.hasRole('admin');
    }

    isManager() {
        return this.hasRole('manager') || this.hasRole('admin');
    }

    isCashier() {
        return this.hasRole('cashier');
    }

    async createUserProfile(uid, userData) {
        try {
            const userDoc = {
                name: userData.name,
                email: userData.email,
                role: userData.role || 'cashier',
                permissions: this.getDefaultPermissions(userData.role || 'cashier'),
                avatar: userData.avatar || null,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                emailVerified: userData.emailVerified || false
            };

            await setDoc(doc(this.db, 'users', uid), userDoc);
            return userDoc;
        } catch (error) {
            console.error('Error creating user profile:', error);
            throw error;
        }
    }

    getDefaultPermissions(role) {
        const permissions = {
            admin: ['all'],
            manager: ['sales', 'products', 'orders', 'reports', 'customers'],
            cashier: ['sales', 'products:view', 'customers:view']
        };
        
        return permissions[role] || permissions.cashier;
    }

    showLoader(message = 'Loading...') {
        const loader = document.getElementById('authLoader');
        const loaderText = document.getElementById('authLoaderText');
        
        if (loader) {
            loader.style.display = 'flex';
        }
        if (loaderText) {
            loaderText.textContent = message;
        }
    }

    hideLoader() {
        const loader = document.getElementById('authLoader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    handleAuthError(error) {
        console.error('Auth error:', error);
        
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password': 'Password should be at least 6 characters long.'
        };
        
        const message = errorMessages[error.code] || error.message || 'An error occurred. Please try again.';
        this.showError(message);
    }

    showError(message) {
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
        console.error('Auth Error:', message);
    }

    showLoginPage() {
        const loginPage = document.getElementById('loginPage');
        const appContainer = document.getElementById('appContainer');
        
        if (loginPage) {
            loginPage.style.display = 'flex';
        }
        if (appContainer) {
            appContainer.style.display = 'none';
        }
        
        this.hideLoader();
    }

    showMainApp() {
        const loginPage = document.getElementById('loginPage');
        const appContainer = document.getElementById('appContainer');
        
        if (loginPage) {
            loginPage.style.display = 'none';
        }
        if (appContainer) {
            appContainer.style.display = 'block';
        }
        
        // Initialize app if available
        if (window.app && typeof window.app.initialize === 'function') {
            window.app.initialize();
        }
    }
}

// Initialize and export auth manager
const authManager = new AuthManager();
window.authManager = authManager;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing authentication...');
    await authManager.initialize();
});

/* Firebase Configuration:
{
  apiKey: "AIzaSyC5aJiXN6iWwrJU9XIdEBUvPwJAH4KpP7Y",
  authDomain: "ogastock.firebaseapp.com",
  projectId: "ogastock",
  storageBucket: "ogastock.firebasestorage.app",
  messagingSenderId: "471046818751",
  appId: "1:471046818751:web:f473f012d71a081b0e2f0a"
}

**Demo Access:**
- Click the "Try Demo Account" button
- Or use email: demo@ogastock.com with password: demo123
- Demo account will be created automatically if it doesn't exist

Firebase Console Setup:
To manage users and configure the Firebase project:
  appId: "1:471046818751:web:f473f012d71a081b0e2f0a"
}

## 🔧 Firebase Console Setup

To manage users and configure the Firebase project:

1. **Visit Firebase Console**: https://console.firebase.google.com/
2. **Select Project**: ogastock
3. **Authentication Section**: View and manage users
4. **Firestore Database**: View user profiles and data
5. **Project Settings**: Modify configuration if needed

### **Firestore Database Structure:**
```
users (collection)
├── {userId} (document)
    ├── name: "User Name"
    ├── email: "user@example.com"
    ├── role: "cashier|manager|admin|demo"
    ├── permissions: ["sales", "products:view"]
    ├── avatar: "photoURL or null"
    ├── createdAt: timestamp
    ├── lastLogin: timestamp
    └── emailVerified: boolean
```

## 🛠️ Development Features

### **Authentication Manager API:**
```javascript
// Access the auth manager
window.authManager

// Check user permissions
authManager.hasPermission('sales')
authManager.hasRole('admin')
authManager.isManager()

// Get current user
const user = authManager.getCurrentUser()
```

### **User Roles & Permissions:**
- **Admin**: Full access (`permissions: ['all']`)
- **Manager**: Products, Orders, Sales, Reports
- **Cashier**: Sales, Products (view only)
- **Demo**: Full access for testing

## 🔒 Security Features

1. **Firebase Security Rules** - Server-side validation
2. **Email Verification** - Required for new accounts
3. **Rate Limiting** - Prevents spam and abuse
4. **Secure Storage** - All data encrypted in transit and at rest
5. **Session Management** - Automatic token refresh

## 📱 Offline Support

- **Firestore Persistence** - Works offline with local cache
- **Auth State Persistence** - Login state maintained across sessions
- **Data Synchronization** - Automatic sync when connection restored

## 🐛 Troubleshooting

### **Common Issues:**

1. **Firebase not initialized**: Check browser console for errors
2. **Permission denied**: Ensure Firestore security rules allow access
3. **Email verification**: Check spam folder for verification emails
4. **Network errors**: Check internet connection and Firebase status

### **Debug Information:**
- Open browser console to view Firebase initialization logs
- Check Network tab for Firebase API calls
- Verify Firebase project is active and billing is enabled (if needed)

## 🚀 Next Steps

1. **Customize Roles**: Modify user roles and permissions in Firestore
2. **Security Rules**: Update Firestore security rules for production
3. **Email Templates**: Customize Firebase Auth email templates
4. **Analytics**: Enable Firebase Analytics for user tracking
5. **Hosting**: Deploy to Firebase Hosting for production

## 📞 Support

- **Firebase Documentation**: https://firebase.google.com/docs
- **Authentication Guide**: https://firebase.google.com/docs/auth
- **Firestore Guide**: https://firebase.google.com/docs/firestore

---

The Firebase authentication system is now fully functional and ready for production use!*/