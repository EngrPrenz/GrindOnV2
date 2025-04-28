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
        
        showModal("Link Expired", "The verification link has expired. Please request a new one.");
    }
    
    timeLeft--;
}, 1000);

// Resend verification email button
const resendButton = document.getElementById('resend-email');
resendButton.addEventListener('click', async () => {
    const email = localStorage.getItem('emailForSignIn');
    
    if (!email) {

        showModal("Email Not Found", "Email address not found. Please start the registration process again.", () => {
            window.location.href = "register.html";
        });
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
        

        showModal("Success", "Verification email sent successfully!");
        resendButton.textContent = "Email Sent";
        
        // Reset the button after 3 seconds
        setTimeout(() => {
            resendButton.disabled = false;
            resendButton.textContent = "Resend Verification Email";
        }, 3000);
        
    } catch (error) {
        console.error("Error sending verification email:", error);

        showModal("Error", "Error sending verification email: " + error.message);
        
        // Reset button
        resendButton.disabled = false;
        resendButton.textContent = "Resend Verification Email";
    }
});