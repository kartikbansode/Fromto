document.addEventListener('DOMContentLoaded', function () {
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
    const messageDiv = document.getElementById('message');
  
    // Function to show messages
    function showMessage(message, type = 'error') {
        if (messageDiv) {
            if (window.messageTimeout) {
                clearTimeout(window.messageTimeout);
            }
            messageDiv.textContent = message;
            messageDiv.className = `message ${type}`;
            messageDiv.style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
            window.messageTimeout = setTimeout(() => {
                messageDiv.style.opacity = '0';
                setTimeout(() => {
                    messageDiv.style.display = 'none';
                    messageDiv.style.opacity = '1';
                }, 300);
            }, 3000);
        }
    }
  
    // Handle Forgot Password
    const forgotPasswordLink = document.getElementById('forgotPassword');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = emailInput.value.trim();

            if (!email) {
                showMessage('Please enter your email address');
                emailInput.focus();
                return;
            }
            
            forgotPasswordLink.style.pointerEvents = 'none';
            try {
                await firebase.auth().sendPasswordResetEmail(email, {
                    url: 'https://kartikbansode.github.io/Fromto/public/login.html' // Fixed URL
                });
                showMessage('If an account exists, we have sent password reset instructions.', 'success');
            } catch (error) {
                console.error('Password reset error:', error);
                switch (error.code) {
                    case 'auth/user-not-found':
                        showMessage('No account found with this email address');
                        break;
                    case 'auth/invalid-email':
                        showMessage('Please enter a valid email address');
                        break;
                    case 'auth/too-many-requests':
                        showMessage('Too many attempts. Please try again later');
                        break;
                    default:
                        showMessage('Error sending reset email. Please try again.');
                }
            } finally {
                forgotPasswordLink.style.pointerEvents = 'auto';
            }
        });
    }
  
    // Handle Google Sign In
    if (googleButton) {
        googleButton.addEventListener('click', async () => {
            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                const result = await firebase.auth().signInWithPopup(provider);
                showMessage('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'https://kartikbansode.github.io/Fromto/public/chat.html';
                }, 1500);
            } catch (error) {
                console.error('Google sign-in error:', error);
                switch (error.code) {
                    case 'auth/popup-blocked':
                        showMessage('Please allow popups for this website');
                        break;
                    case 'auth/popup-closed-by-user':
                        showMessage('Login cancelled. Please try again');
                        break;
                    default:
                        showMessage('Google sign-in failed. Please try again');
                }
            }
        });
    }
  
    // Check if user is already signed in
    firebase.auth().onAuthStateChanged((user) => {
        if (user && user.emailVerified) {
            window.location.href = 'https://kartikbansode.github.io/Fromto/public/chat.html';
        }
    });
});
