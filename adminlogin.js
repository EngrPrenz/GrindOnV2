import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// Your web app's Firebase configuration
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

// Button
const submit = document.getElementById('submit');
submit.addEventListener("click", function (event) {
    event.preventDefault();

    // Inputs
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Check for specific admin credentials
    if (email === "admin@gmail.com" && password === "12345678") {
        // Proceed with Firebase sign-in
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed in
                alert("Welcome Admin!");
                window.location.href = "adminpage.html";
            })
            .catch((error) => {
                alert("Authentication failed: " + error.message);
            });
    } else {
        // Block access for non-admin users
        alert("Access denied: Invalid admin credentials.");
    }
});
