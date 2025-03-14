// Firebase configuration - use your actual config
const firebaseConfig = {
    apiKey: "AIzaSyChYiTejtDAXaLTH0nCjKuJwR6_PvW6xMc",
    authDomain: "fromto-72f98.firebaseapp.com",
    projectId: "fromto-72f98",
    storageBucket: "fromto-72f98.firebasestorage.app",
    messagingSenderId: "907173125159",
    appId: "1:907173125159:web:f35416f73900eaa8078202"
  };

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const database = firebase.database();

// Global variables
let currentConnectionRequest = null;
let messageListeners = {};
const displayedMessages = new Set();

// Function to show messages
function showMessage(message, type = 'error') {
    const messageDiv = document.getElementById('message');
    if (!messageDiv) return;

    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';

    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Function to send connection request
async function sendConnectionRequest(targetUserEmail) {
    try {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            showMessage('You must be logged in to connect');
            return;
        }

        // Create a new connection request
        const requestRef = database.ref('connectionRequests').push();
        
        await requestRef.set({
            from: currentUser.email,
            to: targetUserEmail,
            status: 'pending',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });

        showMessage('Connection request sent!', 'success');

    } catch (error) {
        console.error('Error sending connection request:', error);
        showMessage('Failed to send connection request');
    }
}

// Function to listen for connection requests
function listenForConnectionRequests() {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const requestsRef = database.ref('connectionRequests');
    
    requestsRef.on('child_added', async (snapshot) => {
        const request = snapshot.val();
        
        // Check if this request is for current user and is pending
        if (request.to === currentUser.email && request.status === 'pending') {
            currentConnectionRequest = {
                id: snapshot.key,
                ...request
            };
            
            showConnectionRequestModal(request.from);
        }
    });
}

// Function to show connection request modal
function showConnectionRequestModal(fromEmail) {
    const modal = document.getElementById('connectionRequestModal');
    const message = document.getElementById('connectionRequestMessage');
    
    message.textContent = `${fromEmail} wants to connect with you`;
    modal.style.display = 'block';
}

// Function to handle connection response
async function handleConnectionResponse(accepted) {
    if (!currentConnectionRequest) return;

    try {
        const requestRef = database.ref(`connectionRequests/${currentConnectionRequest.id}`);
        
        if (accepted) {
            // Update request status
            await requestRef.update({
                status: 'accepted'
            });

            // Create chat connection
            const chatId = generateChatId(currentConnectionRequest.from, currentConnectionRequest.to);
            const chatRef = database.ref(`chats/${chatId}`);
            
            await chatRef.set({
                participants: {
                    [currentConnectionRequest.from.replace('.', '_')]: true,
                    [currentConnectionRequest.to.replace('.', '_')]: true
                },
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });

            showMessage('Connection accepted!', 'success');
            
            // Reload the page to show the new chat
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            // Update request status to rejected
            await requestRef.update({
                status: 'rejected'
            });
            showMessage('Connection request declined');
        }

    } catch (error) {
        console.error('Error handling connection response:', error);
        showMessage('Failed to process connection request');
    } finally {
        // Close modal and clear current request
        const modal = document.getElementById('connectionRequestModal');
        modal.style.display = 'none';
        currentConnectionRequest = null;
    }
}

// Utility function to generate chat ID
function generateChatId(email1, email2) {
    const sortedEmails = [email1, email2].sort();
    return `${sortedEmails[0]}_${sortedEmails[1]}`.replace(/\./g, '_');
}

// Modified connect function
function connectWithCode(code) {
    const targetEmail = code.trim();
    
    if (!targetEmail) {
        showMessage('Please enter a valid connection code');
        return;
    }

    if (targetEmail === auth.currentUser.email) {
        showMessage('You cannot connect with yourself');
        return;
    }

    // Send connection request
    sendConnectionRequest(targetEmail);
}

// Document ready event listener
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const connectInput = document.getElementById('connect-input');
    const connectBtn = document.getElementById('connect-btn');
    const acceptBtn = document.getElementById('acceptConnection');
    const rejectBtn = document.getElementById('rejectConnection');

    // Add event listeners
    if (connectBtn) {
        connectBtn.addEventListener('click', () => {
            if (connectInput) {
                connectWithCode(connectInput.value);
            }
        });
    }

    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => handleConnectionResponse(true));
    }

    if (rejectBtn) {
        rejectBtn.addEventListener('click', () => handleConnectionResponse(false));
    }

    // Start listening for connection requests
    listenForConnectionRequests();
});
