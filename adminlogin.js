import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

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

// Admin emails hardcoded for security since we can't access Firestore securely
const ADMIN_EMAILS = ["admin@gmail.com"];

// Function to check if user is admin based on email
function isAdminEmail(email) {
    return ADMIN_EMAILS.includes(email.toLowerCase());
}

// Check if user is already logged in as admin
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User already logged in, checking admin status:", user.uid);
        
        if (isAdminEmail(user.email)) {
            console.log("Already logged in as admin");
            localStorage.setItem('adminEmail', user.email);
            localStorage.setItem('adminRole', 'admin');
            localStorage.setItem('adminUid', user.uid);
            
            // Only redirect if we're not already on the admin page
            if (!window.location.href.includes("admin.html")) {
                window.location.href = "admin.html";
            }
        } else {
            console.log("Logged in user is not an admin");
        }
    }
});

// Button click
const submit = document.getElementById('submit');
submit.addEventListener("click", function (event) {
    event.preventDefault();

    const email = document.getElementById('email').value.toLowerCase();
    const password = document.getElementById('password').value;

    // Simple validation
    if (!email || !password) {
        alert("Please enter both email and password");
        return;
    }

    // Check if email is in admin list before trying to authenticate
    if (!isAdminEmail(email)) {
        alert("Access denied: This email is not authorized for admin access.");
        return;
    }

    // Show loading state
    submit.disabled = true;
    submit.textContent = "Signing in...";

    signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        const user = userCredential.user;
        console.log("Signed in UID:", user.uid);
        
        // Store admin info in localStorage
        localStorage.setItem('adminEmail', user.email);
        localStorage.setItem('adminRole', 'admin');
        localStorage.setItem('adminUid', user.uid);
        
        alert("Welcome Admin!");
        window.location.href = "admin.html";
    })
    .catch((error) => {
        console.error("Error during sign-in:", error.message);
        alert("Login failed: " + error.message);
    })
    .finally(() => {
        submit.disabled = false;
        submit.textContent = "Sign In";
    });
});