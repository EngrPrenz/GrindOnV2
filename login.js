import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

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

// Utility function to show modal
function showModal(message) {
    console.log("Modal message:", message); // Debugging
    const modal = document.getElementById('modal');
    const modalMessage = document.getElementById('modal-message');
    modalMessage.textContent = message;
    modal.style.display = 'block';
}

// Utility function to hide modal
function hideModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
}

// Button event listener for login
const submit = document.getElementById('submit');
submit.addEventListener("click", function (event) {
    event.preventDefault();

    // Inputs
    const usernameOrEmail = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Simple validation
    if (!usernameOrEmail || !password) {
        showModal("Please enter both email/username and password");
        return;
    }

    // Show loading state
    submit.disabled = true;
    submit.textContent = "Signing in...";

    // If the input is an email
    if (usernameOrEmail.includes('@')) {
        signInWithEmailAndPassword(auth, usernameOrEmail, password)
            .then((userCredential) => {
                // Signed in 
                const user = userCredential.user;
                window.location.href = "homepage.html"; // Or another page you want
            })
            .catch((error) => {
                const errorMessage = error.message;
                showModal(errorMessage); // Display error message if login fails
            })
            .finally(() => {
                // Reset button state
                submit.disabled = false;
                submit.textContent = "Sign In";
            });
    } else {
        // If the input is a username, query Firestore to find the email
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", usernameOrEmail));

        getDocs(q)
            .then((querySnapshot) => {
                if (querySnapshot.empty) {
                    showModal("Username not found.");
                    return;
                }

                // If username is found, get the email from Firestore
                const userDoc = querySnapshot.docs[0].data();
                const email = userDoc.email;

                // Now use the email to sign in with Firebase Authentication
                signInWithEmailAndPassword(auth, email, password)
                    .then((userCredential) => {
                        // Signed in 
                        const user = userCredential.user;
                        showModal("Welcome, you have logged in successfully!");
                        window.location.href = "home.html"; // Or another page you want
                    })
                    .catch((error) => {
                        const errorMessage = error.message;
                        showModal(errorMessage); // Display error message if login fails
                    });
            })
            .catch((error) => {
                console.error("Error fetching user by username: ", error);
                showModal("Error fetching user details.");
            })
            .finally(() => {
                // Reset button state
                submit.disabled = false;
                submit.textContent = "Sign In";
            });
    }
});
