import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC5n40vPlIjXQ25X4NJlr8Z2jRGux0C1Y8",
  authDomain: "grindon-da126.firebaseapp.com",
  projectId: "grindon-da126",
  storageBucket: "grindon-da126.appspot.com",
  messagingSenderId: "606558901364",
  appId: "1:606558901364:web:e39156bea8d403f191ed21"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Get reference to the user option div in navbar
const userOptionDiv = document.querySelector('.user_option');

// Authentication state observer
onAuthStateChanged(auth, (user) => {
  if (!userOptionDiv) return; // if navbar not present, do nothing

  if (user) {
    // User is signed in
    const uid = user.uid;
    const userDocRef = doc(db, "users", uid);

    getDoc(userDocRef).then((docSnap) => {
      let displayName = "User";
      if (docSnap.exists() && docSnap.data().username) {
        displayName = docSnap.data().username;
      }

      userOptionDiv.innerHTML = `
        <a href="cart.html">
          <i class="fa fa-shopping-cart" aria-hidden="true"></i>
        </a>      
      
        <span style="color: white; margin-right: 10px;">Hi, <strong>${displayName}</strong></span>
        <a href="#" id="logoutBtn">
          <i class="fa fa-sign-out" aria-hidden="true"></i>
          <span style="color: white;">Logout</span>
        </a>
      `;

      document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth).then(() => {
          location.reload();
        }).catch((error) => {
          alert("Logout failed: " + error.message);
        });
      });

    }).catch((error) => {
      console.error("Failed to fetch username:", error);
      // fallback to email if username is unavailable
      const fallbackName = user.email.substring(0, 4) + "...";
      userOptionDiv.innerHTML = `
        <span style="color: white; margin-right: 10px;">Hi, ${fallbackName}</span>
        <a href="#" id="logoutBtn">
          <i class="fa fa-sign-out" aria-hidden="true"></i>
          <span style="color: white;">Logout</span>
        </a>
      `;

      document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth).then(() => {
          location.reload();
        }).catch((error) => {
          alert("Logout failed: " + error.message);
        });
      });
    });
  } else {
    // User is signed out
    userOptionDiv.innerHTML = `
      <a href="login.html">
        <i class="fa fa-user" aria-hidden="true"></i>
        <span style="color: white;">Login</span>
      </a>
      <a href="register.html">
        <i class="fa fa-vcard" aria-hidden="true"></i>
        <span style="color: white;">Register</span>
      </a>
    `;
  }
});

// Add contact form submission handler
document.addEventListener('DOMContentLoaded', function() {
  const contactForm = document.getElementById('contactForm');
  
  if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Disable form submission while processing
      const submitButton = this.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'SENDING...';
      
      // Get form data
      const name = this.querySelector('input[name="name"]').value;
      const email = this.querySelector('input[name="email"]').value;
      const phone = this.querySelector('input[name="phone"]').value;
      const message = this.querySelector('textarea[name="message"]').value;
      
      try {
        // Add to Firestore
        const messagesRef = collection(db, "messages");
        await addDoc(messagesRef, {
          name: name,
          email: email,
          phone: phone,
          message: message,
          timestamp: new Date(),
          status: "unread"
        });
        
        // Show success modal
        $('#successModal').modal('show');
        
        // Clear form
        this.reset();
        
        // Refresh page after modal is closed
        $('#successModal').on('hidden.bs.modal', function () {
          window.location.reload();
        });
        
      } catch (error) {
        console.error("Error sending message:", error);
        // Show error modal
        $('#errorModal').modal('show');
      } finally {
        // Re-enable form submission
        submitButton.disabled = false;
        submitButton.textContent = 'SEND';
      }
    });
  }
});