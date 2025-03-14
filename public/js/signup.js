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

    const signupForm = document.getElementById('signupForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const signupButton = document.getElementById('signupButton');
    const googleSignupBtn = document.getElementById('googleSignup');
    const messageDiv = document.getElementById('message');
    const backButton = document.querySelector('.back-button');

    // Back button handler
    backButton.addEventListener('click', () => {
        window.location.href = 'https://kartikbansode.github.io/Fromto/public/index.html';
    });

    // Function to show message
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

    // Handle signup form submission
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Basic validation
        if (!email || !password || !confirmPassword) {
            showMessage('Please fill in all fields');
            return;
        }

        // Password validation
        if (password !== confirmPassword) {
            showMessage('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            showMessage('Password should be at least 6 characters long');
            return;
        }

        try {
            setLoading(signupButton, true);
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            
            showMessage('Account created successfully! Redirecting...', false);
            
            setTimeout(() => {
                window.location.href = 'https://kartikbansode.github.io/Fromto/public/chat.html';
            }, 1500);

        } catch (error) {
            console.error('Signup error:', error);
            setLoading(signupButton, false);

            switch (error.code) {
                case 'auth/email-already-in-use':
                    showMessage('Email already in use');
                    break;
                case 'auth/invalid-email':
                    showMessage('Invalid email address');
                    break;
                case 'auth/operation-not-allowed':
                    showMessage('Email/password accounts are not enabled');
                    break;
                case 'auth/weak-password':
                    showMessage('Password is too weak');
                    break;
                default:
                    showMessage('Error creating account');
            }
        }
    });

    // Google Sign up
    googleSignupBtn.addEventListener('click', async () => {
        try {
            setLoading(googleSignupBtn, true);
            const provider = new firebase.auth.GoogleAuthProvider();
            await firebase.auth().signInWithPopup(provider);
            
            showMessage('Account created successfully! Redirecting...', false);
            setTimeout(() => {
                window.location.href = 'https://kartikbansode.github.io/Fromto/public/chat.html';
            }, 1500);

        } catch (error) {
            console.error('Google sign-up error:', error);
            setLoading(googleSignupBtn, false);

            switch (error.code) {
                case 'auth/popup-blocked':
                    showMessage('Please allow popups for this website');
                    break;
                case 'auth/popup-closed-by-user':
                    showMessage('Sign up cancelled. Please try again');
                    break;
                default:
                    showMessage('Signing up with Google is currently not available, Sign in manually');
            }
        }
    });

    // Check if user is already signed in
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            window.location.href = 'https://kartikbansode.github.io/Fromto/public/chat.html';
        }
    });
});
