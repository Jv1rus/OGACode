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

console.log('Firebase initialized successfully');