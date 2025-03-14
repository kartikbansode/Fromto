// Firebase configuration should be the same as in auth.js
const firebaseConfig = {
    apiKey: "AIzaSyChYiTejtDAXaLTH0nCjKuJwR6_PvW6xMc",
    authDomain: "fromto-72f98.firebaseapp.com",
    projectId: "fromto-72f98",
    storageBucket: "fromto-72f98.firebasestorage.app",
    messagingSenderId: "907173125159",
    appId: "1:907173125159:web:f35416f73900eaa8078202"
};
let messageListeners = {};
const displayedMessages = new Set();

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const database = firebase.database();


// Add these at the start of your chat.js, after Firebase initialization
let currentConnectionRequest = null;

// Function to send connection request
async function sendConnectionRequest(targetUserEmail) {
    try {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            showMessage('You must be logged in to connect');
            return;
        }

        // Create a new connection request in Firebase
        const requestRef = firebase.database().ref('connectionRequests').push();
        
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

// Function to handle incoming connection requests
function listenForConnectionRequests() {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) return;

    const requestsRef = firebase.database().ref('connectionRequests');
    
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

// Function to handle connection request response
async function handleConnectionResponse(accepted) {
    if (!currentConnectionRequest) return;

    try {
        const requestRef = firebase.database().ref(`connectionRequests/${currentConnectionRequest.id}`);
        
        if (accepted) {
            // Update request status
            await requestRef.update({
                status: 'accepted'
            });

            // Create chat connection for both users
            const chatId = generateChatId(currentConnectionRequest.from, currentConnectionRequest.to);
            const chatRef = firebase.database().ref(`chats/${chatId}`);
            
            await chatRef.set({
                participants: {
                    [currentConnectionRequest.from.replace('.', '_')]: true,
                    [currentConnectionRequest.to.replace('.', '_')]: true
                },
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });

            showMessage('Connection accepted!', 'success');
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

// Utility function to generate a unique chat ID
function generateChatId(email1, email2) {
    const sortedEmails = [email1, email2].sort();
    return `${sortedEmails[0]}_${sortedEmails[1]}`.replace(/\./g, '_');
}

// Add event listeners for the modal buttons
document.addEventListener('DOMContentLoaded', () => {
    const acceptBtn = document.getElementById('acceptConnection');
    const rejectBtn = document.getElementById('rejectConnection');

    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => handleConnectionResponse(true));
    }

    if (rejectBtn) {
        rejectBtn.addEventListener('click', () => handleConnectionResponse(false));
    }

    // Start listening for connection requests
    listenForConnectionRequests();
});

// Modify your existing connect function to use the new system
function connectWithCode(code) {
    // Assuming the code is the user's email
    const targetEmail = code.trim();
    
    if (!targetEmail) {
        showMessage('Please enter a valid connection code');
        return;
    }

    if (targetEmail === firebase.auth().currentUser.email) {
        showMessage('You cannot connect with yourself');
        return;
    }

    // Send connection request
    sendConnectionRequest(targetEmail);
}


document.addEventListener('DOMContentLoaded', function() {
    console.log("Chat page loaded");
    
    // DOM Elements
    const userCodeElement = document.getElementById('user-code');
    const copyCodeBtn = document.getElementById('copy-code');
    const connectInput = document.getElementById('connect-input');
    const connectBtn = document.getElementById('connect-btn');
    const chatStatus = document.getElementById('chat-status');
    const messagesContainer = document.getElementById('messages');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // App state
    let currentUser = null;
    let userCode = null;
    let chatRoomId = null;
    let messageListener = null;

    // Disable buttons initially
    copyCodeBtn.disabled = true;
    connectBtn.disabled = true;
    
    // Initialize chat interface
    function initializeChat() {
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                console.log("No user signed in, redirecting to login");
                window.location.href = 'https://kartikbansode.github.io/Fromto/public/login.html';
                return;
            }

            console.log("User authenticated:", user.email);
            currentUser = user;

            try {
                // Get user code
                const userSnapshot = await database.ref(`users/${user.uid}`).once('value');
                const userData = userSnapshot.val();
                userCode = userData.userCode;
                userCodeElement.textContent = userCode;
                copyCodeBtn.disabled = false;

                // Check for existing chat room
                const userChatsSnapshot = await database.ref(`userChats/${user.uid}`).once('value');
                const userChats = userChatsSnapshot.val();

                if (userChats && userChats.activeChatRoom) {
                    chatRoomId = userChats.activeChatRoom;
                    await setupExistingChat(chatRoomId);
                }
            } catch (error) {
                console.error("Error initializing chat:", error);
                alert("Error loading chat. Please refresh the page.");
            }
        });
    }

    // Set up existing chat
    async function setupExistingChat(roomId) {
        try {
            const roomSnapshot = await database.ref(`chatRooms/${roomId}`).once('value');
            const roomData = roomSnapshot.val();

            if (roomData && roomData.participants) {
                const otherUserId = Object.keys(roomData.participants)
                    .find(id => id !== currentUser.uid);

                if (otherUserId) {
                    const otherUserSnapshot = await database.ref(`users/${otherUserId}`).once('value');
                    const otherUserData = otherUserSnapshot.val();

                    if (otherUserData) {
                        connectInput.value = otherUserData.userCode;
                        enableChat(otherUserData.userCode);
                        setupMessageListener(roomId);
                    }
                }
            }
        } catch (error) {
            console.error("Error setting up existing chat:", error);
        }
    }

    // Enable chat interface
    function enableChat(connectedCode) {
        chatStatus.textContent = `Connected with: ${connectedCode}`;
        chatStatus.style.backgroundColor = '#e6ffe6';
        messageInput.disabled = false;
        sendBtn.disabled = false;
        connectInput.disabled = true;
        connectBtn.disabled = true;
    }

    // Set up message listener
    function setupMessageListener(roomId) {
        // Remove existing listener if any
        if (messageListener) {
            database.ref(`chatRooms/${roomId}/messages`).off('child_added', messageListener);
        }

        // Clear messages container
        messagesContainer.innerHTML = '';

        // Load existing messages
        database.ref(`chatRooms/${roomId}/messages`)
            .orderByChild('timestamp')
            .once('value', (snapshot) => {
                const messages = snapshot.val();
                if (messages) {
                    Object.values(messages).forEach(msg => displayMessage(msg));
                }
            });

        // Listen for new messages
        messageListener = database.ref(`chatRooms/${roomId}/messages`)
            .orderByChild('timestamp')
            .startAfter(Date.now())
            .on('child_added', (snapshot) => {
                const message = snapshot.val();
                displayMessage(message);
            });
    }

    // Display a message
    function displayMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(message.senderId === currentUser.uid ? 'sent' : 'received');
        
        const timeString = new Date(message.timestamp).toLocaleTimeString();
        
        messageDiv.innerHTML = `
            <div class="message-content">${message.text}</div>
            <div class="message-time">${timeString}</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Connect to another user
    connectBtn.addEventListener('click', async () => {
        const targetCode = connectInput.value.trim().toUpperCase();

        if (!targetCode) {
            alert('Please enter a valid code');
            return;
        }

        if (targetCode === userCode) {
            alert('You cannot connect to yourself');
            return;
        }

        connectBtn.disabled = true;
        connectBtn.textContent = 'Connecting...';

        try {
            // Find user with the target code
            const usersSnapshot = await database.ref('users')
                .orderByChild('userCode')
                .equalTo(targetCode)
                .once('value');
            
            const users = usersSnapshot.val();

            if (!users) {
                throw new Error('No user found with this code');
            }

            const targetUserId = Object.keys(users)[0];
            chatRoomId = [currentUser.uid, targetUserId].sort().join('_');

            // Create or update chat room
            await database.ref(`chatRooms/${chatRoomId}`).update({
                updatedAt: Date.now(),
                participants: {
                    [currentUser.uid]: true,
                    [targetUserId]: true
                }
            });

            // Update both users' active chat
            await Promise.all([
                database.ref(`userChats/${currentUser.uid}`).update({
                    activeChatRoom: chatRoomId
                }),
                database.ref(`userChats/${targetUserId}`).update({
                    activeChatRoom: chatRoomId
                })
            ]);

            enableChat(targetCode);
            setupMessageListener(chatRoomId);

        } catch (error) {
            console.error('Connection error:', error);
            alert(error.message);
        } finally {
            connectBtn.disabled = false;
            connectBtn.textContent = 'Connect';
        }
    });

    // Send message
    function sendMessage() {
        const text = messageInput.value.trim();
        
        if (!text || !chatRoomId) return;

        const message = {
            text: text,
            senderId: currentUser.uid,
            timestamp: Date.now()
        };

        // Disable send button while sending
        sendBtn.disabled = true;

        database.ref(`chatRooms/${chatRoomId}/messages`).push(message)
            .then(() => {
                messageInput.value = '';
                messageInput.focus();
            })
            .catch(error => {
                console.error('Error sending message:', error);
                alert('Failed to send message. Please try again.');
            })
            .finally(() => {
                sendBtn.disabled = false;
            });
    }

    // Send message event listeners
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Copy code button
    copyCodeBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(userCode)
            .then(() => {
                copyCodeBtn.textContent = 'Copied!';
                setTimeout(() => copyCodeBtn.textContent = 'Copy Code', 1500);
            })
            .catch(() => alert('Failed to copy code'));
    });

    // Logout button
    logoutBtn.addEventListener('click', () => {
        auth.signOut()
            .then(() => window.location.href = 'https://kartikbansode.github.io/Fromto/public/login.html')
            .catch(error => {
                console.error('Logout error:', error);
                alert('Error signing out');
            });
    });

    // Initialize chat
    initializeChat();
}); 