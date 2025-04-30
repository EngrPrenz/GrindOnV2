import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { checkAdminAuth, initAdminName } from "./admin_auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC5n40vPlIjXQ25X4NJlr8Z2jRGux0C1Y8",
  authDomain: "grindon-da126.firebaseapp.com",
  projectId: "grindon-da126",
  storageBucket: "grindon-da126.firebasestorage.app",
  messagingSenderId: "606558901364",
  appId: "1:606558901364:web:e39156bea8d403f191ed21"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let uploadedImageUrls = []; // Store uploaded image URLs here

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
  try {
    // Check authentication first
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) return; // Don't initialize if not admin
    
    // Initialize admin name
    initAdminName();
    
    // Initialize theme
    initTheme();
    
    // Set up logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Initialize drag and drop for the upload area
    initDragAndDrop();
  } catch (error) {
    console.error("Error initializing page:", error);
  }
});

// Handle logout
function handleLogout(e) {
  e.preventDefault();
  
  signOut(auth).then(() => {
    // Sign-out successful
    console.log("User signed out");
    localStorage.removeItem('adminName');
    window.location.href = "admin_login.html";
  }).catch((error) => {
    // An error happened
    console.error("Error signing out:", error);
    showModal('error', 'Logout Failed', `Error signing out: ${error.message}`);
  });
}

// Initialize theme based on user preference or localStorage
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const themeToggle = document.getElementById('themeToggle');
  
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.checked = true;
  } else {
    document.body.classList.remove('dark-mode');
    themeToggle.checked = false;
  }
  
  // Theme toggle event
  themeToggle.addEventListener('change', function() {
    if (this.checked) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  });
}

// Initialize drag and drop functionality
function initDragAndDrop() {
  const uploadImage = document.getElementById('uploadImage');
  if (uploadImage) {
    uploadImage.addEventListener('change', function(e) {
      const files = this.files;
      const previewContainer = document.getElementById('imagePreviewContainer');
      
      if (previewContainer) {
        previewContainer.innerHTML = '';
        
        if (files.length > 0) {
          for (let file of files) {
            const reader = new FileReader();
            reader.onload = function(e) {
              const img = document.createElement('img');
              img.src = e.target.result;
              previewContainer.appendChild(img);
            };
            reader.readAsDataURL(file);
          }
        }
      }
    });
    
    // Make the upload area highlight on drag
    const uploadArea = document.querySelector('.upload-area');
    if (uploadArea) {
      ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, function(e) {
          e.preventDefault();
          this.classList.add('active');
        });
      });
      
      ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, function(e) {
          e.preventDefault();
          this.classList.remove('active');
        });
      });
    }
  }
}

// Modal functionality
function showModal(type, title, message) {
  const modal = document.getElementById('customModal');
  const modalIcon = modal.querySelector('.modal-icon');
  const modalTitle = modal.querySelector('.modal-title');
  const modalMessage = modal.querySelector('.modal-message');
  
  // Clear previous classes
  modalIcon.className = 'modal-icon';
  
  // Set icon and color based on type
  if (type === 'success') {
    modalIcon.className = 'modal-icon success';
    modalIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
  } else if (type === 'error') {
    modalIcon.className = 'modal-icon error';
    modalIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
  } else if (type === 'warning') {
    modalIcon.className = 'modal-icon warning';
    modalIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
  } else {
    modalIcon.className = 'modal-icon info';
    modalIcon.innerHTML = '<i class="fas fa-info-circle"></i>';
  }
  
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  
  modal.style.display = 'flex';
  
  // Close modal with X or confirm button
  const closeButtons = modal.querySelectorAll('.close-modal, .modal-confirm');
  closeButtons.forEach(button => {
    button.onclick = function() {
      modal.style.display = 'none';
    };
  });
  
  // Close on click outside
  window.onclick = function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
}

// Form submit handler
document.getElementById("addProductForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const description = document.getElementById("description").value;
  const price = parseFloat(document.getElementById("price").value);
  const color = document.getElementById("color").value.toLowerCase();
  const small = parseInt(document.getElementById("small").value);
  const medium = parseInt(document.getElementById("medium").value);
  const large = parseInt(document.getElementById("large").value);

  if (uploadedImageUrls.length === 0) {
    showModal('warning', 'Missing Images', 'Please upload at least one image.');
    return;
  }

  const product = {
    name,
    description,
    price,
    imageUrls: uploadedImageUrls, // now storing as array
    variations: {
      [color]: {
        small,
        medium,
        large
      }
    },
    createdAt: serverTimestamp()
  };

  try {
    await addDoc(collection(db, "products"), product);
    showModal('success', 'Product Added', 'Product added successfully!');
    document.getElementById("addProductForm").reset();
    document.getElementById("imagePreviewContainer").innerHTML = "";
    document.getElementById("imageUrl").value = "";
    uploadedImageUrls = [];
  } catch (error) {
    console.error("Error adding product:", error);
    showModal('error', 'Add Product Failed', 'Failed to add product.');
  }
});

// Show image previews
document.getElementById("uploadImage").addEventListener("change", function () {
  const files = this.files;
  const previewContainer = document.getElementById("imagePreviewContainer");
  previewContainer.innerHTML = "";

  if (files.length > 0) {
    for (let file of files) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = document.createElement("img");
        img.src = e.target.result;
        previewContainer.appendChild(img);
      };
      reader.readAsDataURL(file);
    }
  }
});

// Upload images to ImgBB
document.getElementById("uploadToImgBB").addEventListener("click", async () => {
  const fileInput = document.getElementById("uploadImage");
  const files = fileInput.files;

  if (!files.length) {
    showModal('warning', 'No Images Selected', 'Please select image(s) first.');
    return;
  }

  uploadedImageUrls = [];
  document.getElementById("uploadToImgBB").innerText = "⏳ Uploading...";

  for (let file of files) {
    const base64 = await fileToBase64(file);
    try {
      const response = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          key: "54d7f9f504ad8667bd240160609fd2b4", // Your ImgBB API key
          image: base64.split(",")[1]
        })
      });

      const result = await response.json();

      if (result.success) {
        uploadedImageUrls.push(result.data.url);
      } else {
        console.error("Upload failed for one image:", result);
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
  }

  document.getElementById("imageUrl").value = uploadedImageUrls.join(", ");
  document.getElementById("uploadToImgBB").innerText = "✅ Upload to ImgBB";
  showModal('success', 'Images Uploaded', 'All images uploaded successfully!');
});

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}