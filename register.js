import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, fetchSignInMethodsForEmail } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

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

// Password visibility toggle
const togglePassword = document.getElementById('toggle-password');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Toggle icon between eye and eye-slash
    this.querySelector('i').classList.toggle('fa-eye');
    this.querySelector('i').classList.toggle('fa-eye-slash');
});

// Email verification
const emailInput = document.getElementById('email');
const emailVerification = document.getElementById('email-verification');

emailInput.addEventListener('input', debounce(async function() {
    const email = emailInput.value.trim();
    
    if (email === '') {
        emailVerification.textContent = '';
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        emailVerification.textContent = 'Please enter a valid email address';
        emailVerification.className = 'verification-message invalid';
        return;
    }

    // Check if email exists in Firebase Auth
    try {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.length > 0) {
            emailVerification.textContent = 'This email is already in use';
            emailVerification.className = 'verification-message invalid';
        } else {
            emailVerification.textContent = 'Email is available';
            emailVerification.className = 'verification-message valid';
        }
    } catch (error) {
        console.error("Error checking email:", error);
    }
}, 500));

// Password verification
const passwordVerification = document.getElementById('password-verification');

passwordInput.addEventListener('input', function() {
    const password = passwordInput.value;
    
    if (password === '') {
        passwordVerification.textContent = '';
        return;
    }

    let isValid = false;
    let message = '';

    // Check if password meets criteria
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    if (password.length >= 15) {
        isValid = true;
        message = 'Password meets length requirement';
    } else if (password.length >= 8 && hasLowerCase && hasNumber) {
        isValid = true;
        message = 'Password meets complexity requirements';
    } else {
        isValid = false;
        message = password.length < 8 ? 
            'Password too short (min 8 characters)' : 
            'Password needs at least one lowercase letter and one number';
    }

    passwordVerification.textContent = message;
    passwordVerification.className = isValid ? 
        'verification-message valid' : 
        'verification-message invalid';
});

// Debounce function to limit how often a function can fire
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// Button event listener for sign-up
const submit = document.getElementById('submit');
submit.addEventListener("click", function (event) {
    event.preventDefault();

    // Inputs
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value;

    // Firebase Auth user creation
    createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
            // Signed up
            const user = userCredential.user;

            // Store user data in Firestore with username
            await setDoc(doc(db, "users", user.uid), {
                email: email,
                username: username,
                role: "user"
            });

            alert("Account created successfully!");
            window.location.href = "homepage.html";
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            alert(errorMessage);
        });
});

// Google Sign-Up
const googleButton = document.getElementById('google-signup');
googleButton.addEventListener("click", function () {
    const provider = new GoogleAuthProvider();

    signInWithPopup(auth, provider)
        .then(async (result) => {
            const user = result.user;

            // Check if user already exists in Firestore
            const userRef = doc(db, "users", user.uid);
            const userSnapshot = await getDoc(userRef);

            if (!userSnapshot.exists()) {
                // Store new user data in Firestore
                await setDoc(userRef, {
                    email: user.email,
                    username: user.displayName || "Google User",
                    role: "user"
                });
            }

            alert("Signed in successfully with Google!");
            window.location.href = "homepage.html";
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            alert("Google Sign-In failed: " + errorMessage);
        });
});