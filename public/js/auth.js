// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyChYiTejtDAXaLTH0nCjKuJwR6_PvW6xMc",
    authDomain: "fromto-72f98.firebaseapp.com",
    projectId: "fromto-72f98",
    storageBucket: "fromto-72f98.firebasestorage.app",
    messagingSenderId: "907173125159",
    appId: "1:907173125159:web:f35416f73900eaa8078202"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const database = firebase.database();

// Get current page
const currentPage = window.location.pathname.split('/').pop() || 'https://kartikbansode.github.io/Fromto/public/index.html';

// Handle authentication state changes
auth.onAuthStateChanged(user => {
    // Prevent the auth state change handler from running multiple times
    if (window.handlingAuthChange) return;
    window.handlingAuthChange = true;
    
    setTimeout(() => {
        window.handlingAuthChange = false;
    }, 1000); // Prevent multiple redirects within 1 second
    
    console.log("Auth state changed. User:", user ? user.email : "signed out");
    console.log("Current page:", currentPage);
    
    if (user) {
        // User is signed in
        if (currentPage === 'login.html' || currentPage === 'https://kartikbansode.github.io/Fromto/public/index.html' || currentPage === '') {
            console.log("Redirecting to chat.html");
            window.location.replace('https://kartikbansode.github.io/Fromto/public/chat.html');
        }
    } else {
        // User is signed out
        if (currentPage === '/public/chat.html') {
            console.log("Redirecting to login.html");
            window.location.replace('https://kartikbansode.github.io/Fromto/public/login.html');
        }
    }
});

// Only run the login page code if we're actually on the login page
if (currentPage === 'https://kartikbansode.github.io/Fromto/public/login.html') {
    const authForm = document.getElementById('auth-form');
    const authTitle = document.getElementById('auth-title');
    const toggleLink = document.getElementById('toggle-link');
    const toggleText = document.getElementById('toggle-auth');
    const googleAuthBtn = document.getElementById('google-auth');
    const authError = document.getElementById('auth-error');
    
    // Check if we're in signup mode from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    let isSignup = urlParams.get('signup') === 'true';
    
    // Update UI based on mode
    function updateAuthUI() {
        if (isSignup) {
            authTitle.textContent = 'Sign Up';
            toggleLink.textContent = 'Login';
            toggleText.innerHTML = 'Already have an account? <a href="#" id="toggle-link">Login</a>';
        } else {
            authTitle.textContent = 'Login';
            toggleLink.textContent = 'Sign up';
            toggleText.innerHTML = 'Don\'t have an account? <a href="#" id="toggle-link">Sign up</a>';
        }
        // Re-attach event listener to the new toggle link
        document.getElementById('toggle-link').addEventListener('click', toggleAuthMode);
    }
    
    // Toggle between login and signup
    function toggleAuthMode(e) {
        e.preventDefault();
        isSignup = !isSignup;
        updateAuthUI();
    }
    
    // Initialize UI
    updateAuthUI();
    
    // Handle form submission
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            if (isSignup) {
                // Create user
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                // Generate a unique code for the user
                const userId = userCredential.user.uid;
                const userCode = generateUserCode();
                
                // Save user data to database
                await database.ref('users/' + userId).set({
                    email: email,
                    userCode: userCode,
                    createdAt: Date.now()
                });
                
                // No need to redirect here - onAuthStateChanged will handle it
            } else {
                // Login user
                await auth.signInWithEmailAndPassword(email, password);
                // No need to redirect here - onAuthStateChanged will handle it
            }
        } catch (error) {
            authError.textContent = error.message;
        }
    });
    
    // Google Authentication
    googleAuthBtn.addEventListener('click', async () => {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await auth.signInWithPopup(provider);
            
            // Check if this is a new user
            const isNewUser = result.additionalUserInfo.isNewUser;
            
            if (isNewUser) {
                // Generate a unique code for the user
                const userId = result.user.uid;
                const userCode = generateUserCode();
                
                // Save user data to database
                await database.ref('users/' + userId).set({
                    email: result.user.email,
                    userCode: userCode,
                    createdAt: Date.now()
                });
            }
            
            // No need to redirect here - onAuthStateChanged will handle it
        } catch (error) {
            authError.textContent = error.message;
        }
    });
}

// Generate a random 6-character code for the user
function generateUserCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
} 