import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signOut, isSignInWithEmailLink, signInWithEmailLink } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
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

// Check if user has verified email
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check if the URL is a sign-in link from Firebase
        if (isSignInWithEmailLink(auth, window.location.href)) {
            // Get the email from localStorage that we saved in email_verification.js
            let email = localStorage.getItem('emailForSignIn');
            
            if (!email) {
                // If the email isn't found in localStorage, prompt the user
                email = window.prompt('Please provide your email for confirmation');
            }
            
            if (email) {
                // Sign in the user with the email link
                await signInWithEmailLink(auth, email, window.location.href);
                
                // Clear the URL query parameters for cleaner URL and to prevent reusing the link
                window.history.replaceState(null, null, window.location.pathname);
                
                // Store the verified email in localStorage for use in the registration process
                localStorage.setItem('verifiedEmail', email);
                
                // Populate the email field
                const emailInput = document.getElementById('email');
                emailInput.value = email;
                
                // No need for alert or redirect as the user is already verified
                console.log("Email verified successfully");
            } else {
                // If email is still not available, redirect to registration page
                alert("Could not verify email. Please start over.");
                window.location.href = "register.html";
            }
        } else {
            // Check if we have a verified email from a previous verification
            const verifiedEmail = localStorage.getItem('verifiedEmail');
            
            if (!verifiedEmail) {
                // If no verified email, redirect to the email verification page
                alert("Please verify your email before completing registration.");
                window.location.href = "register.html";
                return;
            }
            
            // Populate the email field
            const emailInput = document.getElementById('email');
            emailInput.value = verifiedEmail;
        }
    } catch (error) {
        console.error("Error during email verification:", error);
        alert("Error verifying email: " + error.message);
        window.location.href = "register.html";
    }
});

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

// Username validation function
function validateUsername(username) {
    // Username validation regex: alphanumeric characters or single hyphens, not at start/end
    const usernameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9]|-(?!-))*[a-zA-Z0-9]$/;
    return usernameRegex.test(username);
}

// Button event listener for registration completion
const submit = document.getElementById('submit');
submit.addEventListener("click", async function (event) {
    event.preventDefault();

    // Get values
    const email = document.getElementById('email').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Validate username
    if (!validateUsername(username)) {
        alert("Username may only contain alphanumeric characters or single hyphens, and cannot begin or end with a hyphen.");
        return;
    }

    // Validate password
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const isPasswordValid = password.length >= 15 || (password.length >= 8 && hasLowerCase && hasNumber);
    
    if (!isPasswordValid) {
        alert("Password should be at least 15 characters OR at least 8 characters including a number and a lowercase letter.");
        return;
    }

    // Disable button to prevent multiple submissions
    submit.disabled = true;
    submit.textContent = "Processing...";

    try {
        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Store user data in Firestore
        await setDoc(doc(db, "users", user.uid), {
            email: email,
            username: username,
            role: "user",
            emailVerified: true, // Email is already verified
            createdAt: new Date().toISOString()
        });

        // Clear the stored emails
        localStorage.removeItem('verifiedEmail');
        localStorage.removeItem('emailForSignIn');

        alert("Registration completed successfully!");
        window.location.href = "homepage.html";
    } catch (error) {
        console.error("Error completing registration:", error);
        alert("Error completing registration: " + error.message);

        // Reset button
        submit.disabled = false;
        submit.textContent = "Complete Registration";
    }
});