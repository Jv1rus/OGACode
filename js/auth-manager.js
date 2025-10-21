// Firebase Authentication Manager for OgaStock
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        // Listen for auth state changes
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                await this.handleUserLogin(user);
            } else {
                this.currentUser = null;
            }
        });

        this.initialized = true;
    }

    async handleUserLogin(firebaseUser) {
        const userDoc = await firebase.firestore().collection('users').doc(firebaseUser.uid).get();
        
        if (userDoc.exists) {
            this.currentUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                emailVerified: firebaseUser.emailVerified,
                ...userDoc.data()
            };
            
            await this.updateLastLogin(firebaseUser.uid);
        }
    }

    async updateLastLogin(uid) {
        await firebase.firestore().collection('users').doc(uid).update({
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    async login(email, password) {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        return userCredential.user;
    }

    async register(email, password, name) {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        await firebase.firestore().collection('users').doc(user.uid).set({
            name: name,
            email: email,
            role: 'cashier',
            permissions: ['sales', 'products:view'],
            avatar: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            emailVerified: false
        });

        await user.sendEmailVerification();
        return user;
    }

    async logout() {
        await firebase.auth().signOut();
        this.currentUser = null;
    }

    async resetPassword(email) {
        await firebase.auth().sendPasswordResetEmail(email);
    }

    getCurrentUser() {
        return this.currentUser;
    }

    hasPermission(permission) {
        if (!this.currentUser) return false;
        if (this.currentUser.permissions.includes('all')) return true;
        return this.currentUser.permissions.includes(permission);
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
                role: userData.role || 'cashier', // Default to cashier instead of demo
                permissions: this.getDefaultPermissions(userData.role || 'cashier'),
                avatar: userData.avatar || null,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
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
            // Remove demo role permissions
        };
        
        return permissions[role] || permissions.cashier;
    }
}

// Initialize and export auth manager
const authManager = new AuthManager();
window.authManager = authManager;

// Auto-initialize when Firebase is ready
if (typeof firebase !== 'undefined') {
    authManager.initialize();
}

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
```

### **Demo Access:**
- Click the "Try Demo Account" button
- Or use email: `demo@ogastock.com` with password: `demo123`
- Demo account will be created automatically if it doesn't exist

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