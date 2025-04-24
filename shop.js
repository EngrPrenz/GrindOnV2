import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
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
      
        <span style="color: white; margin-right: 10px;">Hi, <strong >${displayName}</strong></span>
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

// Add these variables at the top of your script after your Firebase setup
let currentPage = 1;
const productsPerPage = 4; // 2x2 grid
let allProducts = [];

// Function to create loading overlay if it doesn't exist
function createLoadingOverlay() {
  const productsList = document.getElementById("productsList");

  let loadingOverlay = document.querySelector('.loading-overlay');
  if (!loadingOverlay) {
    loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
      <div class="fa-spinner-wrapper">
        <i class="fa fa-spinner fa-spin fa-3x"></i>
        <p>Loading products...</p>
      </div>
    `;
    productsList.appendChild(loadingOverlay);
  }
  return loadingOverlay;
}


// Function to show loading animation
function showLoading() {
  const loadingOverlay = createLoadingOverlay();
  loadingOverlay.classList.add('active');
}

// Function to hide loading animation
function hideLoading() {
  const loadingOverlay = document.querySelector('.loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.classList.remove('active');
  }
}

async function loadProducts() {
  const productsList = document.getElementById("productsList");
  
  // Create loading overlay first
  createLoadingOverlay();
  
  // Show loading animation
  showLoading();

  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      productsList.innerHTML = "<p class='no-products'>No products found.</p>";
      const loadingOverlay = createLoadingOverlay();
      productsList.appendChild(loadingOverlay);
      hideLoading();
      return;
    }

    // Store all products in memory
    allProducts = [];
    snapshot.forEach(docSnap => {
      allProducts.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    // Display first page and set up pagination
    displayProductsPage(1);
    setupPagination();
    
  } catch (err) {
    console.error("Error fetching products:", err);
    productsList.innerHTML = "<p class='error'>Error loading products.</p>";
    const loadingOverlay = createLoadingOverlay();
    productsList.appendChild(loadingOverlay);
    hideLoading();
  }
}

function displayProductsPage(page) {
  // Show loading animation
  showLoading();
  
  const productsList = document.getElementById("productsList");
  currentPage = page;
  
  // Clear current products but preserve loading overlay
  const loadingOverlay = document.querySelector('.loading-overlay');
  productsList.innerHTML = ""; // Clear everything
  
  // Re-add the loading overlay
  if (loadingOverlay) {
    productsList.appendChild(loadingOverlay);
  }
  
  // Calculate start and end indices for the current page
  const startIndex = (page - 1) * productsPerPage;
  const endIndex = Math.min(startIndex + productsPerPage, allProducts.length);
  
  // Display products for current page after a small delay to ensure loading is visible
  setTimeout(() => {
    for (let i = startIndex; i < endIndex; i++) {
      const product = allProducts[i];
      
      let imageArray = [];
      if (Array.isArray(product.imageUrls)) {
        imageArray = product.imageUrls;
      } else if (typeof product.imageUrl === "string") {
        imageArray = [product.imageUrl];
      }
    
      const firstImage = imageArray[0] || "images/default-placeholder.png"; // fallback
    
      const productDiv = document.createElement("div");
      productDiv.className = "product";
      productDiv.setAttribute("data-product-id", product.id);
      productDiv.innerHTML = `
        <div class="product-image-container">
          <img src="${firstImage}" alt="${product.name}" class="product-image" />
        </div>
        <div class="product-info">
          <div class="product-name">${product.name}</div>
          <div class="product-price">₱${product.price}</div>
        </div>
      `;
    
      // Make the whole product box clickable
      productDiv.addEventListener("click", () => {
        window.location.href = `product.html?id=${product.id}`;
      });
      
      productsList.appendChild(productDiv);
    }
    
    // Hide loading animation
    hideLoading();
  }, 300);
}

function setupPagination() {
  // Create pagination container if it doesn't exist
  let paginationContainer = document.getElementById("paginationContainer");
  if (!paginationContainer) {
    paginationContainer = document.createElement("div");
    paginationContainer.id = "paginationContainer";
    paginationContainer.className = "pagination";
    document.querySelector(".client_section").appendChild(paginationContainer);
  }
  
  // Calculate total number of pages
  const totalPages = Math.ceil(allProducts.length / productsPerPage);
  
  // Clear existing pagination
  paginationContainer.innerHTML = "";
  
  // Previous button
  const prevButton = document.createElement("button");
  prevButton.className = `pagination-button ${currentPage === 1 ? 'disabled' : ''}`;
  prevButton.textContent = "Prev";
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      displayProductsPage(currentPage - 1);
      setupPagination();
    }
  });
  paginationContainer.appendChild(prevButton);
  
  // Page buttons - show 5 pages at most
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  
  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement("button");
    pageButton.className = `pagination-button ${i === currentPage ? 'active' : ''}`;
    pageButton.textContent = i;
    pageButton.addEventListener("click", () => {
      displayProductsPage(i);
      setupPagination();
    });
    paginationContainer.appendChild(pageButton);
  }
  
  // Next button
  const nextButton = document.createElement("button");
  nextButton.className = `pagination-button ${currentPage === totalPages ? 'disabled' : ''}`;
  nextButton.textContent = "Next";
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      displayProductsPage(currentPage + 1);
      setupPagination();
    }
  });
  paginationContainer.appendChild(nextButton);
  
  // Page info
  const pageInfo = document.createElement("span");
  pageInfo.className = "pagination-info";
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  paginationContainer.appendChild(pageInfo);
}

loadProducts();