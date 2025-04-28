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

// Set up password visibility toggle
document.addEventListener('DOMContentLoaded', function() {
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle icon between eye and eye-slash
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }
});

// Modal utility functions
function showModal(title, message, callback = null) {
  // Create modal elements
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  
  const modalContainer = document.createElement('div');
  modalContainer.className = 'modal-container';
  
  const modalHeader = document.createElement('div');
  modalHeader.className = 'modal-header';
  
  const modalTitle = document.createElement('h3');
  modalTitle.className = 'modal-title';
  modalTitle.textContent = title;
  
  const closeButton = document.createElement('button');
  closeButton.className = 'modal-close';
  closeButton.innerHTML = '&times;';
  
  const modalBody = document.createElement('div');
  modalBody.className = 'modal-body';
  modalBody.textContent = message;
  
  const modalFooter = document.createElement('div');
  modalFooter.className = 'modal-footer';
  
  const okButton = document.createElement('button');
  okButton.className = 'modal-btn modal-btn-primary';
  okButton.textContent = 'OK';
  
  // Construct modal
  modalHeader.appendChild(modalTitle);
  modalHeader.appendChild(closeButton);
  
  modalFooter.appendChild(okButton);
  
  modalContainer.appendChild(modalHeader);
  modalContainer.appendChild(modalBody);
  modalContainer.appendChild(modalFooter);
  
  modalOverlay.appendChild(modalContainer);
  
  // Add to DOM
  document.body.appendChild(modalOverlay);
  
  // Animation timing
  setTimeout(() => {
    modalOverlay.classList.add('active');
  }, 10);
  
  // Close modal function
  const closeModal = () => {
    modalOverlay.classList.remove('active');
    
    // Wait for animation to complete before removing from DOM
    setTimeout(() => {
      document.body.removeChild(modalOverlay);
      if (callback && typeof callback === 'function') {
        callback();
      }
    }, 300);
  };
  
  // Event listeners
  closeButton.addEventListener('click', closeModal);
  okButton.addEventListener('click', closeModal);
  
  // Close on overlay click (optional)
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });
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
        showModal("Missing Information", "Please enter both email/username and password");
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
                showModal("Success", "Welcome, you have logged in successfully!", () => {
                    window.location.href = "homepage.html"; // Or another page you want
                });
            })
            .catch((error) => {
                const errorMessage = error.message;
                showModal("Login Failed", errorMessage); // Display error message if login fails
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
                    showModal("User Not Found", "Username not found.");
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
                        showModal("Success", "Welcome, you have logged in successfully!", () => {
                            window.location.href = "home.html"; // Or another page you want
                        });
                    })
                    .catch((error) => {
                        const errorMessage = error.message;
                        showModal("Login Failed", errorMessage); // Display error message if login fails
                    });
            })
            .catch((error) => {
                console.error("Error fetching user by username: ", error);
                showModal("Error", "Error fetching user details.");
            })
            .finally(() => {
                // Reset button state
                submit.disabled = false;
                submit.textContent = "Sign In";
            });
    }
});

// Add modal styles to the page
const styleElement = document.createElement('style');
styleElement.textContent = `
/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.modal-overlay.active {
  opacity: 1;
  visibility: visible;
}

.modal-container {
  background-color: #1a1a1a;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
  transform: translateY(-20px);
  transition: transform 0.3s ease;
}

.modal-overlay.active .modal-container {
  transform: translateY(0);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #f0f0f0;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: #999;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  margin: 0;
  width: auto;
}

.modal-close:hover {
  color: #fff;
  background-color: transparent;
}

.modal-body {
  color: #cccccc;
  margin-bottom: 16px;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
}

.modal-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  background-color: #2e2e2e;
  color: #fff;
  border: 1px solid #444;
  width: auto;
  margin-left: 8px;
}

.modal-btn:hover {
  background-color: #3a3a3a;
}

.modal-btn-primary {
  background-color: #333;
  border-color: #444;
}

.modal-btn-primary:hover {
  background-color: #444;
}
`;
document.head.appendChild(styleElement);