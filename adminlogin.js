import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
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

// Button click
const submit = document.getElementById('submit');
submit.addEventListener("click", function (event){
    event.preventDefault();

    const email = document.getElementById('email').value.toLowerCase();
    const password = document.getElementById('password').value;

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
                alert("Welcome Admin!");
                window.location.href = "admin.html";
            } else {
                alert("Access denied: Not an admin.");
            }
        } else {
            alert("No user role found in Firestore.");
            console.warn("No document found in Firestore with UID:", user.uid);
        }
    })
    .catch((error) => {
        console.error("Error during sign-in:", error.message);
        alert(error.message);
    });
});
