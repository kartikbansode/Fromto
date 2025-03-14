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

// Add file handling variables
let selectedFile = null;
const MAX_FILE_SIZE = 1024 * 1024; // 1MB

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const database = firebase.database();

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
        
        if (message.file) {
            const fileHtml = `
                <div class="file-attachment">
                    <i class="fas ${getFileIcon(message.file.type)}"></i>
                    <div class="file-info">
                        <div class="file-name">${message.file.name}</div>
                        <div class="file-size">${formatFileSize(message.file.size)}</div>
                    </div>
                    <div class="download-btn" onclick="downloadFile('${message.file.name}', '${message.file.data}')">
                        <i class="fas fa-download"></i>
                    </div>
                </div>
            `;
            messageDiv.innerHTML += fileHtml;
        }

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
    async function sendMessage() {
        const text = messageInput.value.trim();
        if (!text && !selectedFile) return;
        if (!chatRoomId) return;

        try {
            sendBtn.disabled = true;
            let fileData = null;

            if (selectedFile) {
                fileData = {
                    name: selectedFile.name,
                    type: selectedFile.type,
                    size: selectedFile.size,
                    data: await encodeFile(selectedFile)
                };
            }

            const message = {
                text: text,
                senderId: currentUser.uid,
                timestamp: Date.now(),
                file: fileData
            };

            await database.ref(`chatRooms/${chatRoomId}/messages`).push(message);
            messageInput.value = '';
            removeSelectedFile();
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        } finally {
            sendBtn.disabled = false;
        }
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

    document.getElementById('attachFileBtn').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });

    document.getElementById('fileInput').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            alert('File size must be less than 1MB');
            e.target.value = '';
            return;
        }

        const preview = document.getElementById('uploadPreview');
        preview.innerHTML = `
            <div class="file-preview">
                <i class="fas ${getFileIcon(file.type)}"></i>
                <span class="file-name">${file.name}</span>
                <i class="fas fa-times remove-file" onclick="removeSelectedFile()"></i>
            </div>
        `;
        preview.classList.add('active');
        selectedFile = file;
    });

    function removeSelectedFile() {
        selectedFile = null;
        document.getElementById('fileInput').value = '';
        document.getElementById('uploadPreview').innerHTML = '';
        document.getElementById('uploadPreview').classList.remove('active');
    }

    async function encodeFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function downloadFile(fileName, dataUrl) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function getFileIcon(fileType) {
        if (fileType.startsWith('image/')) return 'fa-image';
        if (fileType.includes('pdf')) return 'fa-file-pdf';
        if (fileType.includes('word')) return 'fa-file-word';
        if (fileType.includes('excel') || fileType.includes('sheet')) return 'fa-file-excel';
        return 'fa-file';
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    }
});