import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

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
const db = getFirestore(app);

// Button event listener for sign-up
const submit = document.getElementById('submit');
submit.addEventListener("click", function (event){
    event.preventDefault()

    // Inputs
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value;  // New input for username

    // Firebase Auth user creation
    createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
            // Signed up
            const user = userCredential.user;

            // Store user data in Firestore with username
            await setDoc(doc(db, "users", user.uid), {
                email: email,
                username: username,  // Save the username to Firestore
                role: "user"  // Default role, could be 'user' or 'admin'
            });

            alert("Account created successfully!");
            window.location.href = "home.html"; // Redirect to home or another page
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            alert(errorMessage);  // Display error message if sign-up fails
        });
});
