// Firebase Configuration
const firebaseConfig = {
    // Replace these with your actual Firebase project configuration
    // Get these values from your Firebase Console > Project Settings > General > Your apps
    apiKey: "AIzaSyC5aJiXN6iWwrJU9XIdEBUvPwJAH4KpP7Y",
    authDomain: "ogastock.firebaseapp.com",
    projectId: "ogastock",
    storageBucket: "ogastock.firebasestorage.app",
    messagingSenderId: "471046818751",
    appId: "1:471046818751:web:f473f012d71a081b0e2f0a"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

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

console.log('Firebase initialized successfully');
console.log('🔥 Firebase Authentication ready');
console.log('📊 Firestore database ready');
console.log('🌐 Offline support enabled');