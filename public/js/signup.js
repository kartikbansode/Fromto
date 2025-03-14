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
    const signupForm = document.getElementById('signupForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const signupButton = document.getElementById('signupButton');
    const messageDiv = document.getElementById('message');
    const verificationDiv = document.getElementById('verificationMessage');

    // Check auth state on page load
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            if (user.emailVerified) {
                cleanupVerificationTimer();
                const verificationDiv = document.querySelector('.verify-email-container');
                if (verificationDiv) {
                    showVerificationSuccess();
                } else {
                    safeRedirect('https://kartikbansode.github.io/Fromto/public/chat.html');
                }
            } else {
                showVerificationStatus(user.email);
                // Start verification check if not verified
                startVerificationCheck(user);
            }
        }
    });
    
    

    const timerManager = {
        timers: {},
        add(name, timer) {
            this.clear(name); // Clear existing timer first
            this.timers[name] = timer;
        },
        clear(name) {
            if (this.timers[name]) {
                clearInterval(this.timers[name]);
                clearTimeout(this.timers[name]);
                delete this.timers[name];
            }
        },
        clearAll() {
            Object.keys(this.timers).forEach(name => this.clear(name));
        }
    };

    function checkVerificationStatus() {
        const isVerified = sessionStorage.getItem('emailVerified') === 'true';
        const userEmail = sessionStorage.getItem('userEmail');
        
        if (isVerified) {
            showVerificationSuccess();
        } else if (userEmail) {
            showVerificationStatus(userEmail);
        }
    }

    checkVerificationStatus();

    function showVerificationSuccess() {
        const verificationDiv = document.getElementById('verificationMessage');
        if (!verificationDiv) return;
    
        // Clean up everything first
        cleanupVerificationTimer();
        
        // Update container with success message
        verificationDiv.innerHTML = `
            <div class="verify-email-container">
                <div class="verification-success">
                    <svg xmlns="http://www.w3.org/2000/svg" class="success-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 class="success-title">Email Verified Successfully!</h3>
                    <p class="success-message">Redirecting to chat...</p>
                </div>
            </div>
        `;
    
        // Show the verification div
        verificationDiv.style.display = 'block';
    
        // Add fade-in effect
        verificationDiv.style.opacity = '0';
        setTimeout(() => {
            verificationDiv.style.transition = 'opacity 0.5s ease-in';
            verificationDiv.style.opacity = '1';
            
            // Redirect after showing success message
            setTimeout(() => {
                window.location.href = 'https://kartikbansode.github.io/Fromto/public/chat.html';
            }, 2000);
        }, 100);
    }
    
    
    
    


    
    


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
    
    
    

    function setLoading(button, isLoading) {
        if (button) {
            button.disabled = isLoading;
            button.innerHTML = isLoading ? 'Please wait...' : 'Create Account';
        }
    }

    function cleanupVerificationTimer() {
        // Clear all managed timers
        timerManager.clearAll();
        
        // Clear session storage
        sessionStorage.removeItem('verificationStartTime');
        sessionStorage.removeItem('emailVerified');
    }
    

    function showVerificationStatus(email) {
        if (signupForm) signupForm.style.display = 'none';
        if (!verificationDiv) return;

        verificationDiv.innerHTML = `
            <div class="verification-container">
                <h3>Verify Your Email</h3>
                <p>We've sent a verification email to:</p>
                <p class="email-address">${email}</p>
                <p>Please check your inbox and click the verification link.</p>
                <div class="warning-message">
                    <p>⚠️ Please do not refresh or reload this page.<br>If you do not get automatically redirected <a href="https://kartikbansode.github.io/Fromto/public/signup.html">click here</a></p>
                </div>
                <div id="resendContainer">
                    <button id="resendButton" class="resend-button" disabled>
                        Resend email (30s)
                    </button>
                </div>
                <p class="note">Check your spam folder if you don't see the email.</p>
                <div id="timeRemaining" class="time-remaining">
                    Time remaining: 30:00
                </div>
                <button id="cancelVerification" class="cancel-button">
                    Cancel & Start Over
                </button>
            </div>
        `;
        verificationDiv.style.display = 'block';

        async function cancelVerification(email) {
            try {
                const response = await fetch('/api/cancel-verification', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to cancel verification');
                }

                return data;
            } catch (error) {
                console.error('Error:', error);
                throw error;
            }
        }


        // Add cancel button event listener
        const cancelButton = document.getElementById('cancelVerification');
        if (cancelButton) {
            cancelButton.addEventListener('click', handleCancelVerification);
        }

        // Start countdown timer
        startVerificationCountdown();
        setupResendButton(email);
    }


    async function handleCancelVerification() {
        try {
            const user = firebase.auth().currentUser;
            if (user) {
                // Store the current user's email for the message
                const userEmail = user.email;

                try {
                    // Delete the user
                    await user.delete();
                    console.log('User deleted successfully');

                    // Sign out after deletion
                    await firebase.auth().signOut();

                    // Show success message
                    showMessage('Account canceled. You can now sign up again.', 'success');

                } catch (deleteError) {
                    console.error('Error deleting user:', deleteError);

                    // If deletion fails, try force sign out
                    await firebase.auth().signOut();

                    // Delete user from Firebase Authentication directly
                    const functions = firebase.functions();
                    const deleteUser = functions.httpsCallable('deleteUser');
                    await deleteUser({ email: userEmail });
                }
            }

            // Clean up timers and storage
            cleanupVerificationTimer();


            // Reset and show the signup form
            if (signupForm) {
                signupForm.style.display = 'block';
                signupForm.reset();
            }

            // Hide verification div
            if (verificationDiv) {
                verificationDiv.style.display = 'none';
                verificationDiv.innerHTML = '';
            }

            // Reset loading state
            if (signupButton) {
                setLoading(signupButton, false);
            }

        } catch (error) {
            console.error('Error in handleCancelVerification:', error);
            showMessage('Error canceling verification. Please try refreshing the page.', 'error');
        }
    }




    function startVerificationCountdown() {
        const timeRemainingDiv = document.getElementById('timeRemaining');

        // Get or set the start time in sessionStorage
        let startTime = sessionStorage.getItem('verificationStartTime');
        if (!startTime) {
            startTime = Date.now();
            sessionStorage.setItem('verificationStartTime', startTime);
        }

        // Clear existing countdown
        timerManager.clear('verificationCountdown');

        const countdownTimer = setInterval(() => {
            const currentTime = Date.now();
            const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
            const totalSeconds = 30 * 60; // 30 minutes in seconds
            const timeLeft = totalSeconds - elapsedSeconds;

            if (timeRemainingDiv) {
                if (timeLeft <= 0) {
                    timerManager.clear('verificationCountdown');
                    timeRemainingDiv.textContent = 'Time expired! Please sign up again.';
                    timeRemainingDiv.style.color = '#dc2626';
                    sessionStorage.removeItem('verificationStartTime'); // Clear the start time

                    // Delete the unverified user
                    const user = firebase.auth().currentUser;
                    if (user) {
                        user.delete()
                            .then(() => firebase.auth().signOut())
                            .then(() => {
                                setTimeout(() => {
                                    window.location.href = 'https://kartikbansode.github.io/Fromto/public/signup.html';
                                }, 3000);
                            })
                            .catch(error => console.error('Error deleting user:', error));
                    }
                    return;
                }

                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                timeRemainingDiv.textContent = `Time remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`;

                if (timeLeft <= 300) { // Last 5 minutes
                    timeRemainingDiv.style.color = '#dc2626';
                }
            }
        }, 1000);

        timerManager.add('verificationCountdown', countdownTimer);
    }
    function safeRedirect(url) {
        // Clean up everything before redirect
        cleanupVerificationTimer();
        
        // Clear all session storage
        sessionStorage.clear();
        
        // Perform the redirect
        window.location.href = url;
    }
    
    

    
    


    
    



    // Add this cleanup function


    function setupResendButton(email) {
        const resendButton = document.getElementById('resendButton');
        if (!resendButton) return;

        let timeLeft = 30;
        timerManager.clear('resendTimer');

        const timer = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                resendButton.textContent = 'Resend verification email';
                resendButton.disabled = false;
                timerManager.clear('resendTimer');
            } else {
                resendButton.textContent = `Resend email (${timeLeft}s)`;
            }
        }, 1000);

        timerManager.add('resendTimer', timer);

        resendButton.addEventListener('click', async () => {
            try {
                resendButton.disabled = true;
                const user = firebase.auth().currentUser;
                if (user) {
                    await user.sendEmailVerification({
                        url: window.location.origin + '/public/chat.html'
                    });
                    showMessage('Verification email resent!', 'success');
                    timeLeft = 30;
                } else {
                    await firebase.auth().signInWithEmailAndPassword(email, passwordInput.value);
                    await firebase.auth().currentUser.sendEmailVerification({
                        url: window.location.origin + '/public/chat.html'
                    });
                }
            } catch (error) {
                console.error('Resend error:', error);
                showMessage('Error resending email. Please try again.');
                resendButton.disabled = false;
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
    
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
    
            // Clear previous messages
            if (messageDiv) messageDiv.style.display = 'none';
    
            // Validation
            if (!email || !password || !confirmPassword) {
                showMessage('Please fill in all fields');
                return;
            }
    
            if (password !== confirmPassword) {
                showMessage('Passwords do not match');
                return;
            }
    
            if (password.length < 6) {
                showMessage('Password must be at least 6 characters');
                return;
            }
    
            try {
                setLoading(signupButton, true);
    
                // Check if email exists in Firebase
                const signInMethods = await firebase.auth().fetchSignInMethodsForEmail(email);
                if (signInMethods.length > 0) {
                    showMessage('An account with this email already exists');
                    setLoading(signupButton, false);
                    return;
                }
    
                // Create user
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
    
                // Send verification email
                await user.sendEmailVerification({
                    url: window.location.origin + '/public/chat.html'
                });
    
                // Show verification status
                showVerificationStatus(email);
    
                // Start checking for email verification
                startVerificationCheck(user);
    
                // Clear the form
                signupForm.reset();
    
                // Hide the signup form
                signupForm.style.display = 'none';
    
                // Show success message
                showMessage('Verification email sent! Please check your inbox.', 'success');
    
            } catch (error) {
                console.error('Signup error:', error);
                setLoading(signupButton, false);
    
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        showMessage('An account with this email already exists');
                        break;
                    case 'auth/invalid-email':
                        showMessage('Invalid email address');
                        break;
                    case 'auth/operation-not-allowed':
                        showMessage('Email/password accounts are not enabled');
                        break;
                    case 'auth/weak-password':
                        showMessage('Password must be at least 6 characters');
                        break;
                    default:
                        showMessage(error.message || 'Error creating account. Please try again.');
                }
    
                // Re-enable the signup button on error
                setLoading(signupButton, false);
            }
        });
    }
    

    function startVerificationCheck(user) {
        // Clear any existing checks first
        if (window.verificationCheckInterval) {
            clearInterval(window.verificationCheckInterval);
        }
    
        window.verificationCheckInterval = setInterval(async () => {
            try {
                // Reload user data
                await user.reload();
                const updatedUser = firebase.auth().currentUser;
                
                if (updatedUser && updatedUser.emailVerified) {
                    // Clear interval immediately
                    clearInterval(window.verificationCheckInterval);
                    
                    // Show success and redirect
                    showVerificationSuccess();
                }
            } catch (error) {
                console.error('Verification check error:', error);
                clearInterval(window.verificationCheckInterval);
            }
        }, 2000);
    }
    
    
    
    

    document.getElementById('homeButton').addEventListener('click', function () {
        // Option 1: Go back one step in browser history
        window.history.back();

        // OR Option 2: Navigate to specific home page
        // window.location.href = '/'; // Replace '/' with your home page path
    });
    window.addEventListener('beforeunload', () => {
        timerManager.clearAll();
    });
    window.addEventListener('beforeunload', () => {
        cleanupVerificationTimer();
    });
    

    // Check auth state
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            if (user.emailVerified) {
                cleanupVerificationTimer();
                const verificationDiv = document.getElementById('verificationMessage');
                if (verificationDiv) {
                    showVerificationSuccess();
                } else {
                    window.location.href = '/public/chat.html';
                }
            } else {
                showVerificationStatus(user.email);
                // Start verification check if not verified
                startVerificationCheck(user);
            }
        }
    });
    

});
