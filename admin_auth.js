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

// Show modal function
function showModal(title, message, redirectUrl) {
    // Create modal elements
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.top = '0';
    modalOverlay.style.left = '0';
    modalOverlay.style.width = '100%';
    modalOverlay.style.height = '100%';
    modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modalOverlay.style.display = 'flex';
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.alignItems = 'center';
    modalOverlay.style.zIndex = '1000';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.backgroundColor = 'white';
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '5px';
    modalContent.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    modalContent.style.width = '400px';
    modalContent.style.maxWidth = '90%';
    
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    modalHeader.style.marginBottom = '15px';
    
    const modalTitle = document.createElement('h3');
    modalTitle.textContent = title;
    modalTitle.style.margin = '0';
    modalTitle.style.color = '#333';
    
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    modalBody.style.marginBottom = '20px';
    
    const modalMessage = document.createElement('p');
    modalMessage.textContent = message;
    modalMessage.style.margin = '0';
    
    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';
    modalFooter.style.textAlign = 'right';
    
    const modalButton = document.createElement('button');
    modalButton.textContent = 'OK';
    modalButton.style.padding = '8px 16px';
    modalButton.style.backgroundColor = '#4CAF50';
    modalButton.style.color = 'white';
    modalButton.style.border = 'none';
    modalButton.style.borderRadius = '4px';
    modalButton.style.cursor = 'pointer';
    
    // Append elements
    modalHeader.appendChild(modalTitle);
    modalBody.appendChild(modalMessage);
    modalFooter.appendChild(modalButton);
    
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    
    modalOverlay.appendChild(modalContent);
    
    // Add to document
    document.body.appendChild(modalOverlay);
    
    // Add event listener to button
    modalButton.addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
        if (redirectUrl) {
            window.location.href = redirectUrl;
        }
    });
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
                    
                    showModal("Access Denied", "You do not have admin privileges", "admin_login.html");
                    
                    auth.signOut().then(() => {
                        // Redirect is handled by the modal now
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