import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, sendSignInLinkToEmail, GoogleAuthProvider, signInWithPopup, fetchSignInMethodsForEmail, isSignInWithEmailLink, signInWithEmailLink } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

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

// Modal functionality
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalOkBtn = document.getElementById('modal-ok-btn');
const closeModalBtn = document.querySelector('.close-modal');

// Show modal function
function showModal(title, message, callback = null) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.classList.add('visible');
    
    // Reset previous event listeners
    const newOkBtn = modalOkBtn.cloneNode(true);
    modalOkBtn.parentNode.replaceChild(newOkBtn, modalOkBtn);
    
    // Set up event listener for OK button
    newOkBtn.addEventListener('click', () => {
        modal.classList.remove('visible');
        if (callback && typeof callback === 'function') {
            callback();
        }
    });
    
    // Close modal when clicking the X button
    closeModalBtn.onclick = () => {
        modal.classList.remove('visible');
        if (callback && typeof callback === 'function') {
            callback();
        }
    };
    
    // Close modal when clicking outside
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.classList.remove('visible');
            if (callback && typeof callback === 'function') {
                callback();
            }
        }
    };
}

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

// Verify Email button event listener
const verifyEmailBtn = document.getElementById('verify-email');
verifyEmailBtn.addEventListener("click", async function(event) {
    event.preventDefault();
    
    const email = emailInput.value.trim();
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        emailVerification.textContent = 'Please enter a valid email address';
        emailVerification.className = 'verification-message invalid';
        return;
    }
    
    // Check if email exists
    try {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.length > 0) {
            emailVerification.textContent = 'This email is already in use';
            emailVerification.className = 'verification-message invalid';
            return;
        }
    } catch (error) {
        console.error("Error checking email:", error);
        showModal("Error", "Error checking email availability. Please try again.");
        return;
    }
    
    // Disable button and show loading state
    verifyEmailBtn.disabled = true;
    verifyEmailBtn.textContent = "Sending verification...";
    
    // Set up actionCodeSettings for email link
    const actionCodeSettings = {
        // Make sure to use the correct URL with your renamed file
        url: window.location.origin + '/register2.html',
        handleCodeInApp: true,
    };
    
    try {
        // Send verification email
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        
        // Save email to localStorage for later use
        localStorage.setItem('emailForSignIn', email);
        
        // Redirect to verification pending page
        window.location.href = "email_verification.html";
    } catch (error) {
        console.error("Error sending verification email:", error);
        showModal("Error", "Error sending verification email: " + error.message);
        
        // Reset button
        verifyEmailBtn.disabled = false;
        verifyEmailBtn.textContent = "Verify Email";
    }
});

// Google Sign-Up
const googleButton = document.getElementById('google-signup');
googleButton.addEventListener("click", async function () {
    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Store the email in localStorage for the next step
        localStorage.setItem('verifiedEmail', user.email);
        
        // Redirect to complete registration
        window.location.href = "register2.html";
    } catch (error) {
        console.error("Google Sign-In error:", error);
        showModal("Google Sign-In Failed", error.message);
    }
});

// Check if we're coming back with an email sign-in link
if (isSignInWithEmailLink(auth, window.location.href)) {
    // Additional security - you should call signInWithEmailLink first
    let email = localStorage.getItem('emailForSignIn');
    if (!email) {
        // If we don't have the email stored locally, prompt user with modal
        showModal("Email Verification", "Please provide your email for confirmation", () => {
            // After modal is closed, prompt the user
            const promptEmail = window.prompt('Please provide your email for confirmation');
            if (promptEmail) {
                completeSignInWithEmail(promptEmail);
            }
        });
    } else {
        completeSignInWithEmail(email);
    }
}

// Function to complete sign-in with email link
function completeSignInWithEmail(email) {
    signInWithEmailLink(auth, email, window.location.href)
        .then((result) => {
            // Clear email from storage
            localStorage.removeItem('emailForSignIn');
            
            // Store the verified email
            localStorage.setItem('verifiedEmail', email);
            
            // Redirect to complete registration
            window.location.href = "register2.html";
        })
        .catch((error) => {
            console.error("Error completing sign-in with email link:", error);
            showModal("Error", "Error verifying email: " + error.message);
        });
}