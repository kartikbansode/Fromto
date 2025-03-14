// Get current page
const currentPage = window.location.pathname.split('/').pop() || '/public/index.html';
console.log("Current page:", currentPage);

// Only redirect from index page to chat if logged in
// Don't redirect from login or signup pages automatically
firebase.auth().onAuthStateChanged(user => {
    console.log("Auth state changed. User:", user ? user.email : "signed out");
    
    if (user) {
        // Only redirect from index page
        if (currentPage === 'index.html' || currentPage === '') {
            console.log("User is logged in, redirecting from index to chat");
            window.location.replace('/public/chat.html');
        }
    } 
    // Only redirect from chat page if not logged in
    else {
        if (currentPage === 'chat.html') {
            console.log("User is not logged in, redirecting from chat to login");
            window.location.replace('/public/login.html');
        }
    }
}); 