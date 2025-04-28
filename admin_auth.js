// auth_check.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyC5n40vPlIjXQ25X4NJlr8Z2jRGux0C1Y8",
    authDomain: "grindon-da126.firebaseapp.com",
    projectId: "grindon-da126",
    storageBucket: "grindon-da126.firebasestorage.app",
    messagingSenderId: "606558901364",
    appId: "1:606558901364:web:e39156bea8d403f191ed21"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin emails - matching your Firestore structure
const ADMIN_EMAILS = ["admin@gmail.com"];

// Function to store admin info in localStorage
function setAdminInfoInStorage(adminInfo) {
    localStorage.setItem('adminEmail', adminInfo.email || '');
    localStorage.setItem('adminRole', adminInfo.role || 'admin');
    
    // Update admin name in the UI if the element exists
    const adminNameElement = document.getElementById('adminName');
    if (adminNameElement) {
        // Extract name from email or use default
        const name = adminInfo.email ? adminInfo.email.split('@')[0] : 'Admin';
        adminNameElement.textContent = name;
        localStorage.setItem('adminName', name);
    }
}

// Check authentication status and redirect if necessary
function checkAdminAuth() {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in
                console.log("User is signed in:", user.uid);
                
                // Check if the user's email is in our admin list
                if (ADMIN_EMAILS.includes(user.email.toLowerCase())) {
                    console.log("User is admin based on email:", user.email);
                    
                    // Store admin info
                    setAdminInfoInStorage({
                        email: user.email,
                        role: 'admin',
                        userId: user.uid
                    });
                    
                    resolve(true);
                } else {
                    // User is not an admin
                    console.log("User does not have admin role");
                    alert("Access denied: You do not have admin privileges");
                    auth.signOut().then(() => {
                        window.location.href = "admin_login.html";
                    });
                    resolve(false);
                }
            } else {
                // No user is signed in
                console.log("No user is signed in");
                window.location.href = "admin_login.html";
                resolve(false);
            }
        });
    });
}

// Initialize admin name from localStorage
function initAdminName() {
    const adminNameElement = document.getElementById('adminName');
    if (adminNameElement) {
        const storedName = localStorage.getItem('adminName');
        if (storedName) {
            adminNameElement.textContent = storedName;
        }
    }
}

// Export the auth check function
export { checkAdminAuth, initAdminName };

// Execute auth check immediately
checkAdminAuth();