// login.js
document.addEventListener('DOMContentLoaded', function() {
    // Firebase configuration
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

    // Get DOM elements
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('loginButton');
    const googleButton = document.getElementById('googleLogin');
    const forgotPasswordLink = document.getElementById('forgotPassword');
    const messageDiv = document.getElementById('message');

    // Show message function
    function showMessage(message, isError = true) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${isError ? 'error' : 'success'}`;
        messageDiv.style.display = 'block';
        
        // Hide message after 5 seconds
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }

    // Set loading state
    function setLoading(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.originalText = button.innerHTML;
            button.innerHTML = `
                <div class="spinner"></div>
                Loading...
            `;
        } else {
            button.disabled = false;
            button.innerHTML = button.originalText;
        }
    }

    // Handle Email/Password Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showMessage('Please fill in all fields');
            return;
        }

        try {
            setLoading(loginButton, true);
            await firebase.auth().signInWithEmailAndPassword(email, password);
            showMessage('Login successful! Redirecting...', false);
            
            setTimeout(() => {
                window.location.href = 'https://kartikbansode.github.io/Fromto/public/chat.html';
            }, 1500);

        } catch (error) {
            console.error('Login error:', error);
            setLoading(loginButton, false);

            switch (error.code) {
                case 'auth/user-not-found':
                    showMessage('No account found with this email');
                    break;
                case 'auth/wrong-password':
                    showMessage('Incorrect password');
                    break;
                case 'auth/invalid-email':
                    showMessage('Invalid email address');
                    break;
                case 'auth/too-many-requests':
                    showMessage('Too many attempts. Please try again later');
                    break;
                default:
                    showMessage('Invalid Details. Please try again');
            }
        }
    });

    // Handle Google Sign In
    googleButton.addEventListener('click', async () => {
        try {
            setLoading(googleButton, true);
            const provider = new firebase.auth.GoogleAuthProvider();
            await firebase.auth().signInWithPopup(provider);
            
            showMessage('Login successful! Redirecting...', false);
            setTimeout(() => {
                window.location.href = 'https://kartikbansode.github.io/Fromto/public/chat.html';
            }, 1500);

        } catch (error) {
            console.error('Google sign-in error:', error);
            setLoading(googleButton, false);

            switch (error.code) {
                case 'auth/popup-blocked':
                    showMessage('Please allow popups for this website');
                    break;
                case 'auth/popup-closed-by-user':
                    showMessage('Login cancelled. Please try again');
                    break;
                default:
                    showMessage('Signing in with Google is currently not available, Sign in manually');
            }
        }
    });

    // Handle Forgot Password
    forgotPasswordLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();

        if (!email) {
            showMessage('Please enter your email address');
            emailInput.focus();
            return;
        }

        try {
            await firebase.auth().sendPasswordResetEmail(email);
            showMessage('Password reset email sent!', false);
        } catch (error) {
            console.error('Password reset error:', error);
            showMessage('Failed to send reset email. Please try again');
        }
    });

    // Check if user is already signed in
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            window.location.href = 'https://kartikbansode.github.io/Fromto/public/chat.html';
        }
    });
});



document.addEventListener('DOMContentLoaded', function() {

    const backButton = document.querySelector('.back-button');
    backButton.addEventListener('click', function() {
         window.location.href = 'https://kartikbansode.github.io/Fromto/public/index.html';
    });
});


