// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyChYiTejtDAXaLTH0nCjKuJwR6_PvW6xMc",
    authDomain: "fromto-72f98.firebaseapp.com",
    databaseURL: "https://fromto-72f98-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "fromto-72f98",
    storageBucket: "fromto-72f98.appspot.com",
    messagingSenderId: "907173125159",
    appId: "1:907173125159:web:f35416f73900eaa8078202",
    measurementId: "G-5KDN1MN44H"
};

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Create global references to Firebase services
const auth = firebase.auth();
const database = firebase.database();

// Helper function to generate a user code
function generateUserCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Debug logging for authentication state
console.log("Firebase initialized with database URL:", firebaseConfig.databaseURL);
auth.onAuthStateChanged(user => {
    console.log("Auth state changed:", user ? "User logged in" : "User logged out");
});

// Add this after Firebase initialization
const dbRef = firebase.database().ref();
dbRef.child("test").set({
    timestamp: Date.now()
})
.then(() => {
    console.log("Database connection successful");
})
.catch((error) => {
    console.error("Database connection failed:", error);
});