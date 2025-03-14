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
  const modal = document.getElementById('forgotPasswordModal');
  const forgotPasswordLink = document.getElementById('forgotPassword');
  const closeButton = document.querySelector('.close-button');
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  const resetEmailInput = document.getElementById('resetEmail');
  const backButton = document.querySelector('.back-button');

  // Function to show messages
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

      // Scroll to top
      window.scrollTo({
          top: 0,
          behavior: 'smooth'
      });

      // Auto hide after 5 seconds
      window.messageTimeout = setTimeout(() => {
          messageDiv.style.opacity = '0';
          setTimeout(() => {
              messageDiv.style.display = 'none';
              messageDiv.style.opacity = '1';
          }, 300);
      }, 5000);
  }

  // Function to set loading state
  function setLoading(button, isLoading) {
      if (!button) return;
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
                  window.location.href = 'chat.html';
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

  // Handle Forgot Password Modal
  if (forgotPasswordLink && modal && closeButton) {
      forgotPasswordLink.addEventListener('click', (e) => {
          e.preventDefault();
          modal.style.display = 'block';
          if (emailInput.value.trim()) {
              resetEmailInput.value = emailInput.value.trim();
          }
      });

      closeButton.addEventListener('click', () => {
          modal.style.display = 'none';
      });

      window.addEventListener('click', (e) => {
          if (e.target === modal) {
              modal.style.display = 'none';
          }
      });
  }

  // Handle Forgot Password Form
  if (forgotPasswordForm) {
      forgotPasswordForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const email = resetEmailInput.value.trim();
          const submitButton = forgotPasswordForm.querySelector('button[type="submit"]');
          
          if (!email) {
              showMessage('Please enter your email address');
              return;
          }

          try {
              submitButton.disabled = true;
              submitButton.textContent = 'Sending...';

              await firebase.auth().sendPasswordResetEmail(email);
              
              showMessage('Password reset email sent! Please check your inbox.', 'success');
              setTimeout(() => {
                  modal.style.display = 'none';
              }, 2000);

          } catch (error) {
              console.error('Password reset error:', error);
              
              let errorMessage;
              switch (error.code) {
                  case 'auth/user-not-found':
                      errorMessage = 'No account found with this email address';
                      break;
                  case 'auth/invalid-email':
                      errorMessage = 'Please enter a valid email address';
                      break;
                  case 'auth/too-many-requests':
                      errorMessage = 'Too many attempts. Please try again later';
                      break;
                  default:
                      errorMessage = 'Error sending reset email. Please try again';
              }
              showMessage(errorMessage);
          } finally {
              submitButton.disabled = false;
              submitButton.textContent = 'Send Reset Link';
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
                  window.location.href = 'chat.html';
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

  // Handle Back Button
  if (backButton) {
      backButton.addEventListener('click', () => {
          window.location.href = 'index.html';
      });
  }

  // Check if user is already signed in
  firebase.auth().onAuthStateChanged((user) => {
      if (user && user.emailVerified) {
          window.location.href = 'chat.html';
      }
  });
});
