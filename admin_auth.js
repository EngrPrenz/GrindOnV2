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

// Function to store admin name in localStorage
function setAdminNameInStorage(name) {
    localStorage.setItem('adminName', name);
    
    // Update admin name in the UI if the element exists
    const adminNameElement = document.getElementById('adminName');
    if (adminNameElement) {
        adminNameElement.textContent = name;
    }
}

// Check authentication status and redirect if necessary
function checkAdminAuth() {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in
                console.log("User is signed in:", user.uid);
                
                // Check if the user has admin role in Firestore
                try {
                    const userRef = doc(db, "users", user.uid);
                    const userSnap = await getDoc(userRef);
                    
                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        
                        if (userData.role === "admin") {
                            // User is an admin, store name if available
                            if (userData.name) {
                                setAdminNameInStorage(userData.name);
                            } else {
                                setAdminNameInStorage("Admin"); // Default value
                            }
                            resolve(true);
                        } else {
                            // User is not an admin
                            console.log("User does not have admin role");
                            alert("Access denied: You do not have admin privileges");
                            window.location.href = "admin_login.html";
                            resolve(false);
                        }
                    } else {
                        // No user document found
                        console.log("No user document found");
                        alert("User data not found");
                        window.location.href = "admin_login.html";
                        resolve(false);
                    }
                } catch (error) {
                    console.error("Error checking admin status:", error);
                    alert("Error verifying admin status");
                    window.location.href = "admin_login.html";
                    reject(error);
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