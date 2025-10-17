// Firebase Configuration
const firebaseConfig = {
    // Firebase project configuration
    // Get these values from Firebase Console > Project Settings > General > Your apps
    apiKey: "AIzaSyC5aJiXN6iWwrJU9XIdEBUvPwJAH4KpP7Y",
    authDomain: "ogastock.firebaseapp.com",
    projectId: "ogastock",
    storageBucket: "ogastock.firebasestorage.app",
    messagingSenderId: "471046818751",
    appId: "1:471046818751:web:f473f012d71a081b0e2f0a"
};

// Validate Firebase configuration
function validateFirebaseConfig(config) {
    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const missingFields = requiredFields.filter(field => !config[field]);
    
    if (missingFields.length > 0) {
        console.error('❌ Missing Firebase configuration fields:', missingFields);
        return false;
    }
    
    // Validate API key format (should start with AIza)
    if (!config.apiKey.startsWith('AIza')) {
        console.warn('⚠️ Firebase API key format may be invalid');
    }
    
    // Validate project ID format
    if (config.projectId !== config.authDomain.split('.')[0]) {
        console.warn('⚠️ Project ID and auth domain may not match');
    }
    
    console.log('✅ Firebase configuration validated successfully');
    return true;
}

// Initialize Firebase only if config is valid
if (!validateFirebaseConfig(firebaseConfig)) {
    throw new Error('Invalid Firebase configuration. Please check your credentials.');
}

try {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
} catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
}

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Configure auth settings for better user experience
auth.useDeviceLanguage(); // Use device language for Firebase Auth UI

// Make Firebase services globally available
window.firebaseAuth = auth;
window.firebaseDb = db;

// Configure Firestore settings for offline support
db.enablePersistence({
    synchronizeTabs: true
}).catch((err) => {
    if (err.code == 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code == 'unimplemented') {
        console.warn('Firestore persistence failed: Browser not supported');
    }
});

// Connection state monitoring
let isConnected = true;

// Monitor authentication state
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('User is signed in:', user.email);
    } else {
        console.log('User is signed out');
    }
});

// Monitor Firestore connection state
db.enableNetwork().then(() => {
    console.log('Firestore online');
    isConnected = true;
    updateConnectionStatus(true);
}).catch((error) => {
    console.error('Firestore connection error:', error);
    isConnected = false;
    updateConnectionStatus(false);
});

// Function to update connection status in UI
function updateConnectionStatus(online) {
    const statusElement = document.getElementById('onlineStatus');
    if (statusElement) {
        const icon = statusElement.querySelector('i');
        const text = statusElement.querySelector('span');
        
        if (online) {
            icon.className = 'fas fa-circle';
            icon.style.color = '#4caf50';
            text.textContent = 'Online';
        } else {
            icon.className = 'fas fa-circle';
            icon.style.color = '#f44336';
            text.textContent = 'Offline';
        }
    }
}

// Export for use in other modules
window.updateConnectionStatus = updateConnectionStatus;

// Test Firebase connection and credentials
async function testFirebaseConnection() {
    console.log('🧪 Testing Firebase connection...');
    
    const results = {
        initialization: false,
        authentication: false,
        firestore: false,
        network: false
    };
    
    try {
        // Test 1: Firebase initialization
        if (firebase.apps.length > 0) {
            results.initialization = true;
            console.log('✅ Firebase initialized');
        } else {
            console.error('❌ Firebase not initialized');
            return results;
        }
        
        // Test 2: Authentication service
        try {
            const authReady = auth !== null && typeof auth.signInAnonymously === 'function';
            results.authentication = authReady;
            if (authReady) {
                console.log('✅ Firebase Authentication ready');
            } else {
                console.error('❌ Firebase Authentication not available');
            }
        } catch (authError) {
            console.error('❌ Firebase Authentication error:', authError);
        }
        
        // Test 3: Firestore service
        try {
            const firestoreReady = db !== null && typeof db.collection === 'function';
            results.firestore = firestoreReady;
            if (firestoreReady) {
                console.log('✅ Firestore ready');
            } else {
                console.error('❌ Firestore not available');
            }
        } catch (dbError) {
            console.error('❌ Firestore error:', dbError);
        }
        
        // Test 4: Network connectivity
        try {
            await db.enableNetwork();
            results.network = true;
            console.log('✅ Network connection established');
        } catch (networkError) {
            console.error('❌ Network connection failed:', networkError);
        }
        
    } catch (error) {
        console.error('❌ Firebase connection test failed:', error);
    }
    
    // Summary
    const allPassed = Object.values(results).every(result => result === true);
    if (allPassed) {
        console.log('✅ All Firebase connection tests passed!');
    } else {
        console.warn('⚠️ Some Firebase connection tests failed:', results);
    }
    
    return results;
}

// Make test function available globally
window.testFirebaseConnection = testFirebaseConnection;

// Diagnostic function to check Firebase credentials
window.diagnoseFirebaseCredentials = function() {
    console.log('🔍 Firebase Credentials Diagnostic');
    console.log('=====================================');
    console.log('Project ID:', firebaseConfig.projectId);
    console.log('Auth Domain:', firebaseConfig.authDomain);
    console.log('Storage Bucket:', firebaseConfig.storageBucket);
    console.log('API Key:', firebaseConfig.apiKey ? '✅ Present (length: ' + firebaseConfig.apiKey.length + ')' : '❌ Missing');
    console.log('App ID:', firebaseConfig.appId ? '✅ Present' : '❌ Missing');
    console.log('Messaging Sender ID:', firebaseConfig.messagingSenderId ? '✅ Present' : '❌ Missing');
    console.log('=====================================');
    console.log('To verify these credentials:');
    console.log('1. Go to https://console.firebase.google.com/');
    console.log('2. Select your project: ' + firebaseConfig.projectId);
    console.log('3. Go to Project Settings > General');
    console.log('4. Scroll to "Your apps" section');
    console.log('5. Compare the values with the output above');
    console.log('=====================================');
    
    // Test current auth state
    if (window.firebaseAuth) {
        const currentUser = window.firebaseAuth.currentUser;
        console.log('Current User:', currentUser ? currentUser.email : 'Not signed in');
    }
    
    return {
        config: firebaseConfig,
        status: {
            initialized: firebase.apps.length > 0,
            auth: window.firebaseAuth !== undefined,
            firestore: window.firebaseDb !== undefined,
            currentUser: window.firebaseAuth?.currentUser?.email || null
        }
    };
};

console.log('💡 Tip: Run window.diagnoseFirebaseCredentials() in console to verify your Firebase setup');

// Auto-run connection test after initialization
setTimeout(() => {
    testFirebaseConnection().then(results => {
        if (!results.authentication || !results.firestore) {
            console.error('⚠️ Firebase services may not be fully functional. Please check your configuration.');
        }
    });
}, 2000);

console.log('Firebase initialized successfully');
console.log('🔥 Firebase Authentication ready');
console.log('📊 Firestore database ready');
console.log('🌐 Offline support enabled');