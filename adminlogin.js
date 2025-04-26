import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
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

// Check if user is already logged in as admin
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Check if they're an admin
        try {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists() && userSnap.data().role === "admin") {
                // User is already logged in as admin, redirect to dashboard
                console.log("Already logged in as admin");
                window.location.href = "admin.html";
            }
        } catch (error) {
            console.error("Error checking admin status:", error);
        }
    }
});

// Button click
const submit = document.getElementById('submit');
submit.addEventListener("click", function (event){
    event.preventDefault();

    const email = document.getElementById('email').value.toLowerCase();
    const password = document.getElementById('password').value;

    // Simple validation
    if (!email || !password) {
        alert("Please enter both email and password");
        return;
    }

    // Show loading state
    submit.disabled = true;
    submit.textContent = "Signing in...";

    signInWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
        const user = userCredential.user;
        console.log("Signed in UID:", user.uid);

        // Reference to Firestore user doc
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const data = userSnap.data();
            console.log("User Firestore data:", data);

            if (data.role === "admin") {
                // Store admin name in localStorage if available
                if (data.name) {
                    localStorage.setItem('adminName', data.name);
                }
                
                alert("Welcome Admin!");
                window.location.href = "admin.html";
            } else {
                alert("Access denied: Not an admin.");
                // Sign out the user since they're not an admin
                auth.signOut();
            }
        } else {
            alert("No user role found in Firestore.");
            console.warn("No document found in Firestore with UID:", user.uid);
            // Sign out the user 
            auth.signOut();
        }
    })
    .catch((error) => {
        console.error("Error during sign-in:", error.message);
        alert("Login failed: " + error.message);
    })
    .finally(() => {
        // Reset button state
        submit.disabled = false;
        submit.textContent = "Sign In";
    });
});