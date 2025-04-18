import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
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

// Modal variables
let currentImages = [];
let currentIndex = 0;

const modal = document.getElementById("imageModal");
const modalImage = document.getElementById("modalImage");
const closeModal = document.getElementById("closeImageModal");
const nextBtn = document.getElementById("nextImage");
const prevBtn = document.getElementById("prevImage");
const userOptionDiv = document.querySelector('.user_option');

// Store references to page elements we need to hide/show
const heroArea = document.querySelector('.hero_area');
const clientSection = document.querySelector('.client_section');
const infoSection = document.querySelector('.info_section');
const footerSection = document.querySelector('.footer_section');

onAuthStateChanged(auth, (user) => {
  if (!userOptionDiv) return; // if navbar not present, do nothing

  if (user) {
    // Get email and truncate it to first 4 characters + ellipsis
    const email = user.email;
    const truncatedEmail = email.length > 4 ? email.substring(0, 4) + "..." : email;
    
    userOptionDiv.innerHTML = `
      <span style="color: white; margin-right: 10px;">Hi, ${truncatedEmail}</span>
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

  } else {
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

function showModal(images, index, event) {
  // Stop event propagation to prevent navigation when clicking on images
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  
  currentImages = images;
  currentIndex = index;
  modalImage.src = currentImages[currentIndex];
  
  // Hide all page sections except the modal
  if (heroArea) heroArea.style.display = 'none';
  if (clientSection) clientSection.style.display = 'none';
  if (infoSection) infoSection.style.display = 'none';
  if (footerSection) footerSection.style.display = 'none';
  
  // Show the modal
  modal.style.display = "flex";
  document.body.style.overflow = 'hidden'; // Prevent scrolling
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.backgroundColor = '#000';
}

function hideModal() {
  modal.style.display = "none";
  
  // Show all page sections again
  if (heroArea) heroArea.style.display = '';
  if (clientSection) clientSection.style.display = '';
  if (infoSection) infoSection.style.display = '';
  if (footerSection) footerSection.style.display = '';
  
  document.body.style.overflow = '';
  document.body.style.margin = '';
  document.body.style.padding = '';
  document.body.style.backgroundColor = '';
}

closeModal.onclick = (e) => {
  e.stopPropagation();
  hideModal();
};

nextBtn.onclick = (e) => {
  e.stopPropagation(); // Prevent click from bubbling to modal background
  currentIndex = (currentIndex + 1) % currentImages.length;
  modalImage.src = currentImages[currentIndex];
};

prevBtn.onclick = (e) => {
  e.stopPropagation(); // Prevent click from bubbling to modal background
  currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
  modalImage.src = currentImages[currentIndex];
};

window.onclick = (e) => {
  if (e.target === modal) {
    hideModal();
  }
};

// Close modal on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.style.display === 'flex') {
    hideModal();
  }
});

async function loadProducts() {
  const productsList = document.getElementById("productsList");
  productsList.innerHTML = "<div class='loading'>Loading products...</div>";

  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    productsList.innerHTML = "";

    if (snapshot.empty) {
      productsList.innerHTML = "<p class='no-products'>No products found.</p>";
      return;
    }

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const id = docSnap.id;
    
      let imageArray = [];
      if (Array.isArray(data.imageUrls)) {
        imageArray = data.imageUrls;
      } else if (typeof data.imageUrl === "string") {
        imageArray = [data.imageUrl];
      }
    
      const firstImage = imageArray[0] || "images/default-placeholder.png"; // fallback
    
      const productDiv = document.createElement("div");
      productDiv.className = "product";
      productDiv.setAttribute("data-product-id", id);
      productDiv.innerHTML = `
        <div class="product-image-container">
          <img src="${firstImage}" alt="${data.name}" class="product-image" />
        </div>
        <div class="product-info">
          <div class="product-name">${data.name}</div>
          <div class="product-price">₱${data.price}</div>
        </div>
      `;
    
      // Make the whole product box clickable
      productDiv.addEventListener("click", () => {
        window.location.href = `product.html?id=${id}`;
      });
      
      // Image click handler for modal - stop propagation to prevent navigation
      const img = productDiv.querySelector(".product-image");
      img.addEventListener("click", (e) => {
        showModal(imageArray, 0, e);
      });
    
      productsList.appendChild(productDiv);
    });
    
  } catch (err) {
    console.error("Error fetching products:", err);
    productsList.innerHTML = "<p class='error'>Error loading products.</p>";
  }
}

loadProducts();