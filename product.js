import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

import {
  collection,
  addDoc,
  getFirestore,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyC5n40vPlIjXQ25X4NJlr8Z2jRGux0C1Y8",
  authDomain: "grindon-da126.firebaseapp.com",
  projectId: "grindon-da126",
  storageBucket: "grindon-da126.firebasestorage.app",
  messagingSenderId: "606558901364",
  appId: "1:606558901364:web:e39156bea8d403f191ed21"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Helper function to create and show modals
function showModal(title, message, isError = false) {
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  modal.style.display = 'flex';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';
  modal.style.zIndex = '1000';

  const modalContent = document.createElement('div');
  modalContent.style.backgroundColor = '#0f0f0f';
  modalContent.style.padding = '20px';
  modalContent.style.borderRadius = '8px';
  modalContent.style.textAlign = 'center';
  modalContent.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
  modalContent.style.maxWidth = '400px';
  modalContent.style.width = '90%';

  modalContent.innerHTML = `
    <img src="images/Wordmark White.png" style="height: 70px; width: auto; object-fit: contain;">
    <h4 style="color: white; padding: 10px;">${title}</h4>
    <p style="color: white; padding: 10px;">${message}</p>
    <button id="closeModalBtn" style="margin: 10px; padding: 10px 20px; background-color:${isError ? '#dc3545' : 'rgb(0, 0, 0)'}; color: white; border: none; border-radius: 4px; cursor: pointer;">Continue Shopping</button>
  `;

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  document.getElementById('closeModalBtn').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
}

// Get reference to the user option div in navbar (if it exists)
const userOptionDiv = document.querySelector('.user_option');

// Authentication state observer
if (userOptionDiv) {
  onAuthStateChanged(auth, (user) => {
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
            showModal("Logout Failed", error.message, true);
          });
        });

      }).catch((error) => {
        console.error("Failed to fetch username:", error);
        // fallback to email if username is unavailable
        const fallbackName = user.email.substring(0, 4) + "...";
        userOptionDiv.innerHTML = `
          <a href="cart.html">
            <i class="fa fa-shopping-cart" aria-hidden="true"></i>
          </a>
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
            showModal("Logout Failed", error.message, true);
          });
        });
      });
    } else {
      // User is signed out - show login message
      userOptionDiv.innerHTML = `
        <a href="cart.html">
          <i class="fa fa-shopping-cart" aria-hidden="true"></i>
        </a>
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
}

// Extract ID from URL
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

const productDetail = document.getElementById("productDetail");

// Function to add a product to the cart
async function addToCart(productId, quantity = 1, size = null, color = null) {
  try {
    // Check if user is logged in
    const user = auth.currentUser;
    if (!user) {
      // Show a modal prompting the user to log in
      const modal = document.createElement('div');
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      modal.style.display = 'flex';
      modal.style.justifyContent = 'center';
      modal.style.alignItems = 'center';
      modal.style.zIndex = '1000';

      const modalContent = document.createElement('div');
      modalContent.style.backgroundColor = '#0f0f0f';
      modalContent.style.padding = '20px';
      modalContent.style.borderRadius = '8px';
      modalContent.style.textAlign = 'center';
      modalContent.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';

      modalContent.innerHTML = `
        <img src="images/Wordmark White.png" style="height: 100px; width: auto; object-fit: contain;">
        <h4 style="color: white; padding: 10px;">Login Required!</h4>
        <p style="color: white; padding: 10px;">Please log in to add items to your cart.</p>
        <button id="loginModalBtn" style="margin: 10px; padding: 10px 20px; background-color:rgb(0, 0, 0); color: white; border: none; border-radius: 4px; cursor: pointer;">Log In</button>
        <button id="closeModalBtn" style="margin: 10px; padding: 10px 20px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
      `;

      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      document.getElementById('loginModalBtn').addEventListener('click', () => {
        window.location.href = 'login.html';
      });

      document.getElementById('closeModalBtn').addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      return;
    }
    
    // Get product details from Firestore
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      showModal("Error", "Product not found", true);
      return;
    }
    
    const productData = productSnap.data();
    
    // Check if product is already in cart
    const cartRef = collection(db, "carts");
    const q = query(
      cartRef, 
      where("userId", "==", user.uid),
      where("productId", "==", productId),
      where("size", "==", size),
      where("color", "==", color)
    );
    
    const cartSnap = await getDocs(q);
    
    if (!cartSnap.empty) {
      // Product already exists in cart, update quantity
      const cartItemDoc = cartSnap.docs[0];
      const cartItemRef = doc(db, "carts", cartItemDoc.id);
      const newQuantity = cartItemDoc.data().quantity + quantity;
      
      await updateDoc(cartItemRef, {
        quantity: newQuantity,
        updatedAt: new Date()
      });
      
      showModal("Cart Updated", `Item quantity updated in cart (${newQuantity})`);
    } else {
      // Product doesn't exist in cart, add new item
      const cartItem = {
        userId: user.uid,
        productId: productId,
        name: productData.name,
        price: productData.price,
        size: size,
        color: color,
        imageUrl: productData.imageUrls ? productData.imageUrls[0] : productData.imageUrl,
        quantity: quantity,
        addedAt: new Date()
      };
      
      await addDoc(collection(db, "carts"), cartItem);
      showModal("Item added to cart!", "Keep Grinding!");
    }
    
  } catch (error) {
    console.error("Error adding to cart:", error);
    showModal("Error", "Failed to add item to cart. Please try again.", true);
  }
}

async function fetchProduct() {
  if (!productId) {
    productDetail.innerHTML = "No product ID provided.";
    return;
  }

  try {
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      productDetail.innerHTML = "Product not found.";
      return;
    }

    const data = productSnap.data();
    
    // Handle both the old single imageUrl format and the new imageUrls array format
    const images = data.imageUrls || [data.imageUrl];

    // Render product details with image gallery
    productDetail.innerHTML = `
      <div class="product-container">
        <div class="product-image">
          <div class="product-gallery">
            <div class="main-image-container">
              <img src="${images[0]}" class="main-image" id="mainImage" alt="${data.name}">
            </div>
            <div class="thumbnails-container">
              ${images.map((img, index) => `
                <img src="${img}" class="thumbnail ${index === 0 ? 'active' : ''}" 
                     onclick="changeMainImage('${img}', this)" alt="Thumbnail ${index+1}">
              `).join('')}
            </div>
          </div>
        </div>
        <div class="product-info">
          <h2>${data.name}</h2>
          <p class="product-price">₱${data.price.toFixed(2)}</p>
          <div class="product-description">
            <p>${data.description}</p>
          </div>
          
          <div class="size-selector">
            <h5>Size</h5>
            <div class="size-options" id="size-options">
              ${renderSizeOptions(data.variations)}
            </div>
          </div>
          
          <div class="quantity-selector">
            <label for="quantity">Quantity: (<span id="max-available">0</span> available)</label>
            <div class="quantity-controls">
              <button id="decrease-qty" class="qty-btn">-</button>
              <input type="number" id="quantity" value="1" min="1">
              <button id="increase-qty" class="qty-btn">+</button>
            </div>
          </div>
          
          <button id="addToCartBtn" class="add-to-cart-btn">ADD TO CART</button>
        </div>
      </div>
    `;

    // Add global functions for image changing
    window.changeMainImage = function(imgSrc, clickedThumb) {
      document.getElementById("mainImage").src = imgSrc;
      
      // Update active thumbnail
      const thumbnails = document.querySelectorAll(".thumbnail");
      thumbnails.forEach(thumb => {
        thumb.classList.remove("active");
      });
      clickedThumb.classList.add("active");
    };

    // Get all color options from variations
    const colorOptions = Object.keys(data.variations || {});
    
    // If there are variations, set up the size options
    if (colorOptions.length > 0) {
      const selectedColor = colorOptions[0]; // Default to first color
      
      // Set up size options
      const sizeOptions = document.querySelectorAll(".size-option");
      sizeOptions.forEach(option => {
        option.addEventListener("click", function() {
          // Remove selected class from all options
          sizeOptions.forEach(opt => opt.classList.remove("selected"));
          // Add selected class to clicked option
          this.classList.add("selected");
          updateAvailableQuantity(data.variations, selectedColor);
        });
      });
      
      // Initialize with first size option selected
      if (sizeOptions.length > 0) {
        sizeOptions[0].classList.add("selected");
        updateAvailableQuantity(data.variations, selectedColor);
      }
    }

    // Set up quantity controls
    const quantityInput = document.getElementById("quantity");
    
    document.getElementById("decrease-qty").addEventListener("click", () => {
      const currentValue = parseInt(quantityInput.value);
      if (currentValue > 1) {
        quantityInput.value = currentValue - 1;
      }
    });
    
    document.getElementById("increase-qty").addEventListener("click", () => {
      const currentValue = parseInt(quantityInput.value);
      const maxAvailable = parseInt(document.getElementById("max-available").textContent);
      
      if (currentValue < maxAvailable) {
        quantityInput.value = currentValue + 1;
      }
    });
    
    // Add to cart button
    document.getElementById("addToCartBtn").addEventListener("click", async () => {
      const selectedSizeElement = document.querySelector(".size-option.selected");
      if (!selectedSizeElement) {
        showModal("Selection Required", "Please select a size");
        return;
      }
      
      const size = selectedSizeElement.textContent;
      const color = colorOptions.length > 0 ? colorOptions[0] : null;
      const quantity = parseInt(quantityInput.value);
      
      await addToCart(productId, quantity, size, color);
    });

  } catch (err) {
    console.error(err);
    productDetail.innerHTML = "Error loading product.";
  }
}

// Helper function to render size options
function renderSizeOptions(variations) {
  if (!variations) return '<p>No sizes available</p>';
  
  // Get the first color variation (we're only showing one color at a time)
  const firstColorKey = Object.keys(variations)[0];
  const sizes = variations[firstColorKey];
  
  let sizeButtons = '';
  
  // Only add size buttons for sizes with stock > 0
  if (sizes.small > 0) {
    sizeButtons += `<button class="size-option" data-size="small">Small</button>`;
  }
  
  if (sizes.medium > 0) {
    sizeButtons += `<button class="size-option" data-size="medium">Medium</button>`;
  }
  
  if (sizes.large > 0) {
    sizeButtons += `<button class="size-option" data-size="large">Large</button>`;
  }
  
  return sizeButtons || '<p>Out of stock</p>';
}

// Function to update available quantity based on selected size and color
function updateAvailableQuantity(variations, color) {
  const selectedSizeElement = document.querySelector(".size-option.selected");
  if (!selectedSizeElement) return;
  
  const size = selectedSizeElement.getAttribute("data-size");
  const quantityInput = document.getElementById("quantity");
  const maxAvailableSpan = document.getElementById("max-available");
  
  // Get available stock for selected color and size
  const availableStock = variations[color][size];
  maxAvailableSpan.textContent = availableStock;
  
  // Reset quantity to 1 or 0 depending on stock
  quantityInput.value = availableStock > 0 ? 1 : 0;
  quantityInput.max = availableStock;
  
  // Enable/disable add to cart button based on stock
  const addToCartBtn = document.getElementById("addToCartBtn");
  if (availableStock <= 0) {
    addToCartBtn.disabled = true;
    addToCartBtn.textContent = "OUT OF STOCK";
    addToCartBtn.style.backgroundColor = "#ccc";
  } else {
    addToCartBtn.disabled = false;
    addToCartBtn.textContent = "ADD TO CART";
    addToCartBtn.style.backgroundColor = "";
  }
}

// Initialize the page
fetchProduct();