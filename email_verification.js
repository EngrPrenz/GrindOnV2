import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, sendSignInLinkToEmail } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

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

// Display the user's email
const userEmailSpan = document.getElementById('user-email');
const email = localStorage.getItem('emailForSignIn');

if (email) {
    userEmailSpan.textContent = email;
} else {
    userEmailSpan.textContent = 'your email address';
}

// Timer functionality
const timerElement = document.getElementById('timer');
let timeLeft = 5 * 60; // 5 minutes in seconds

// Update timer every second
let timerInterval = setInterval(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    // Format the time as MM:SS
    timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    
    if (timeLeft <= 0) {
        clearInterval(timerInterval);
        timerElement.textContent = '0:00';
        timerElement.style.color = 'red';
        
        // Optionally show a message that the link has expired
        alert("The verification link has expired. Please request a new one.");
    }
    
    timeLeft--;
}, 1000);

// Resend verification email button
const resendButton = document.getElementById('resend-email');
resendButton.addEventListener('click', async () => {
    const email = localStorage.getItem('emailForSignIn');
    
    if (!email) {
        alert("Email address not found. Please start the registration process again.");
        window.location.href = "register.html";
        return;
    }
    
    // Disable button and show loading state
    resendButton.disabled = true;
    resendButton.textContent = "Sending...";
    
    // Set up actionCodeSettings for email link
    const actionCodeSettings = {
        url: window.location.origin + '/register2.html',
        handleCodeInApp: true,
    };
    
    try {
        // Send verification email
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        
        // Reset timer
        clearInterval(timerInterval);
        timeLeft = 5 * 60;
        timerElement.textContent = '5:00';
        timerElement.style.color = '';
        
        // Start the timer again
        timerInterval = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            
            timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                timerElement.textContent = '0:00';
                timerElement.style.color = 'red';
            }
            
            timeLeft--;
        }, 1000);
        
        alert("Verification email sent successfully!");
        resendButton.textContent = "Email Sent";
        
        // Reset the button after 3 seconds
        setTimeout(() => {
            resendButton.disabled = false;
            resendButton.textContent = "Resend Verification Email";
        }, 3000);
        
    } catch (error) {
        console.error("Error sending verification email:", error);
        alert("Error sending verification email: " + error.message);
        
        // Reset button
        resendButton.disabled = false;
        resendButton.textContent = "Resend Verification Email";
    }
});