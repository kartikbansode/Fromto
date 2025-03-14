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
    // Updated to match the HTML element id "googleLogin"
    const googleButton = document.getElementById('googleLogin');
    const messageDiv = document.getElementById('message');
  
    // Function to show messages
    function showMessage(message, type = 'error') {
      const messageDiv = document.getElementById('message');
      if (messageDiv) {
        // Clear any existing timeout
        if (window.messageTimeout) {
          clearTimeout(window.messageTimeout);
        }
  
        // Show message
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
  
        // Scroll to top
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
  
        // Auto hide after 3 seconds
        window.messageTimeout = setTimeout(() => {
          messageDiv.style.opacity = '0';
          setTimeout(() => {
            messageDiv.style.display = 'none';
            messageDiv.style.opacity = '1';
          }, 300);
        }, 3000);
      }
    }
  
    // Function to set loading state
    function setLoading(button, isLoading) {
      if (!button) return; // Guard clause
      button.disabled = isLoading;
      button.innerHTML = isLoading ? 'Please wait...' : button.dataset.originalText || 'Login';
    }
  
    // Save original button text
    if (loginButton) loginButton.dataset.originalText = loginButton.innerHTML;
    if (googleButton) googleButton.dataset.originalText = googleButton.innerHTML;
  
    // Handle Email/Password Login
    if (loginForm) {
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
          const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
          const user = userCredential.user;
  
          if (!user.emailVerified) {
            setLoading(loginButton, false);
            showMessage('Please verify your email before logging in. Check your inbox.');
  
            // Create resend verification button
            const resendButton = document.createElement('button');
            resendButton.textContent = 'Resend verification email';
            resendButton.className = 'resend-button';
            resendButton.onclick = async () => {
              try {
                await user.sendEmailVerification();
                showMessage('Verification email resent!', 'success');
              } catch (error) {
                showMessage('Error sending verification email');
              }
            };
            messageDiv.appendChild(resendButton);
  
            await firebase.auth().signOut();
            return;
          }
  
          showMessage('Login successful! Redirecting...', 'success');
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
              showMessage('Login failed. Please try again');
          }
        }
      });
    }
  
    // Handle Google Sign In
    if (googleButton) {
      googleButton.addEventListener('click', async () => {
        try {
          setLoading(googleButton, true);
          const provider = new firebase.auth.GoogleAuthProvider();
          const result = await firebase.auth().signInWithPopup(provider);
          const user = result.user;
  
          showMessage('Login successful! Redirecting...', 'success');
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
              showMessage('Google sign-in failed. Please try again');
          }
        }
      });
    }
  
    // Handle Forgot Password
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

        // Disable the button to prevent multiple clicks
        forgotPasswordLink.style.pointerEvents = 'none';

        try {
            // Try to send the reset email directly
            await firebase.auth().sendPasswordResetEmail(email, {
                url: window.location.origin + 'https://kartikbansode.github.io/Fromto/public/login.html'
            });
            
            // If we get here, the email exists and reset email was sent
            showMessage('If an account exists for the email address you entered, we have sent password reset instructions. Please check your inbox.', 'success');
        } catch (error) {
            console.error('Password reset error:', error);
            
            // Handle specific error cases
            if (error.code === 'auth/user-not-found') {
                showMessage('No account found with this email address');
            } else if (error.code === 'auth/invalid-email') {
                showMessage('Please enter a valid email address');
            } else if (error.code === 'auth/too-many-requests') {
                showMessage('Too many attempts. Please try again later');
            } else {
                showMessage('Error sending reset email. Please try again.');
            }
        } finally {
            // Re-enable the button
            forgotPasswordLink.style.pointerEvents = 'auto';
        }
    });
}

// Update showMessage function to be more reliable
function showMessage(message, type = 'error') {
    const messageDiv = document.getElementById('message');
    if (!messageDiv) return;

    // Clear any existing timeout
    if (window.messageTimeout) {
        clearTimeout(window.messageTimeout);
    }

    // Update message
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    messageDiv.style.opacity = '1';

    // Auto hide after 3 seconds
    window.messageTimeout = setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 300);
    }, 3000);
}

  
    const backButton = document.querySelector('.back-button');
    backButton.addEventListener('click', function () {
      window.location.href = 'https://kartikbansode.github.io/Fromto/public/index.html';
    });
  
    // Check if user is already signed in
    firebase.auth().onAuthStateChanged((user) => {
      if (user && user.emailVerified) {
        window.location.href = 'https://kartikbansode.github.io/Fromto/public/chat.html';
      }
    });
  });
  