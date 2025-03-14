const express = require('express');
const admin = require('firebase-admin');
const schedule = require('node-schedule');
const path = require('path');

// Initialize express
const app = express();

// Initialize Firebase Admin
const serviceAccount = require('./path-to-your-serviceAccountKey.json'); // Download this from Firebase Console
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Schedule user cleanup every 5 minutes
schedule.scheduleJob('*/5 * * * *', async function() {
    try {
        console.log('Running cleanup of unverified users...');
        
        // Get all users
        const listUsersResult = await admin.auth().listUsers();
        const users = listUsersResult.users;

        // Current time minus 30 minutes
        const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);

        // Filter for unverified users created more than 30 minutes ago
        const unverifiedUsers = users.filter(user => {
            return !user.emailVerified && 
                   user.metadata.creationTime &&
                   new Date(user.metadata.creationTime).getTime() < thirtyMinutesAgo;
        });

        // Delete unverified users
        for (const user of unverifiedUsers) {
            try {
                await admin.auth().deleteUser(user.uid);
                console.log(`Deleted unverified user: ${user.email}`);
            } catch (error) {
                console.error(`Error deleting user ${user.email}:`, error);
            }
        }

        console.log(`Cleanup completed. Deleted ${unverifiedUsers.length} unverified users`);
    } catch (error) {
        console.error('Error in cleanup job:', error);
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


// Add this new endpoint to handle verification cancellation
app.post('/api/cancel-verification', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Find the user by email
        const userRecord = await admin.auth().getUserByEmail(email);
        
        // Check if the user exists and is not verified
        if (userRecord && !userRecord.emailVerified) {
            // Delete the user
            await admin.auth().deleteUser(userRecord.uid);
            return res.json({ 
                success: true, 
                message: 'Unverified user account deleted successfully' 
            });
        } else {
            return res.status(404).json({ 
                error: 'User not found or already verified' 
            });
        }
    } catch (error) {
        console.error('Error cancelling verification:', error);
        return res.status(500).json({ 
            error: 'Error processing your request' 
        });
    }
});

// Your existing scheduled cleanup code can remain as is
// ... rest of your server code ...
