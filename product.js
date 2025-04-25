
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
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
  storageBucket: "grindon-da126.appspot.com",
  messagingSenderId: "606558901364",
  appId: "1:606558901364:web:e39156bea8d403f191ed21"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

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
            alert("Logout failed: " + error.message);
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
            alert("Logout failed: " + error.message);
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
      // Redirect to login page or show login modal
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
      alert("Product not found");
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
      
      alert(`Item quantity updated in cart (${newQuantity})`);
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
      alert("Item added to cart");
    }
    
  } catch (error) {
    console.error("Error adding to cart:", error);
    alert("Failed to add item to cart. Please try again.");
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
    const images = data.imageUrls || [data.imageUrl] || [];

    // Render product details with better variation handling
    productDetail.innerHTML = `
      <div class="product-container">
        <div class="product-image">
          <img src="${images[0]}" alt="${data.name}" style="max-width:100%; max-height:400px" />
        </div>
        <div class="product-info">
          <h2>${data.name}</h2>
          <p class="product-price">₱${data.price.toFixed(2)}</p>
          <div class="product-description">
            <p>${data.description}</p>
          </div>
          
          <div class="product-variations">
            <div class="variation-selection">
              <label for="color-select">Color:</label>
              <select id="color-select" class="variation-dropdown">
                ${renderColorOptions(data.variations)}
              </select>
            </div>
            <div class="variation-selection">
              <label for="size-select">Size:</label>
              <select id="size-select" class="variation-dropdown">
                ${renderSizeOptions(data.variations)}
              </select>
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

    // Set up controls and event handlers
    const quantityInput = document.getElementById("quantity");
    const colorSelect = document.getElementById("color-select");
    const sizeSelect = document.getElementById("size-select");
    const maxAvailableSpan = document.getElementById("max-available");
    
    // Function to get current available stock based on selected color and size
    function getCurrentStock() {
      const selectedColor = colorSelect.value;
      const selectedSize = sizeSelect.value.toLowerCase();
      
      if (data.variations && 
          data.variations[selectedColor] && 
          data.variations[selectedColor][selectedSize]) {
        return data.variations[selectedColor][selectedSize];
      }
      return 0;
    }
    
    // Function to update max quantity based on stock
    function updateMaxQuantity() {
      const availableStock = getCurrentStock();
      
      // Update the display of available stock
      maxAvailableSpan.textContent = availableStock;
      
      // If current quantity exceeds stock, adjust it down
      if (parseInt(quantityInput.value) > availableStock) {
        quantityInput.value = availableStock;
      }
      
      // Disable add to cart button if no stock
      const addToCartBtn = document.getElementById("addToCartBtn");
      if (availableStock <= 0) {
        addToCartBtn.disabled = true;
        addToCartBtn.textContent = "OUT OF STOCK";
        addToCartBtn.style.backgroundColor = "#ccc";
        quantityInput.value = 0;
      } else {
        addToCartBtn.disabled = false;
        addToCartBtn.textContent = "ADD TO CART";
        addToCartBtn.style.backgroundColor = "";
        if (parseInt(quantityInput.value) < 1) {
          quantityInput.value = 1;
        }
      }
    }
    
    // Setup quantity control buttons
    document.getElementById("decrease-qty").addEventListener("click", () => {
      const currentValue = parseInt(quantityInput.value);
      if (currentValue > 1) {
        quantityInput.value = currentValue - 1;
      }
    });
    
    document.getElementById("increase-qty").addEventListener("click", () => {
      const currentValue = parseInt(quantityInput.value);
      const maxStock = getCurrentStock();
      
      if (currentValue < maxStock) {
        quantityInput.value = currentValue + 1;
      }
    });
    
    // Add input validation for direct quantity field entry
    quantityInput.addEventListener("change", () => {
      let value = parseInt(quantityInput.value);
      const maxStock = getCurrentStock();
      
      if (isNaN(value) || value < 1) {
        value = 1;
      } else if (value > maxStock) {
        value = maxStock;
      }
      
      quantityInput.value = value;
    });
    
    // Update available sizes when color changes
    colorSelect.addEventListener("change", () => {
      updateSizeOptions(data.variations, colorSelect.value, sizeSelect);
      updateMaxQuantity();
    });
    
    // Update max quantity when size changes
    sizeSelect.addEventListener("change", () => {
      updateMaxQuantity();
    });
    
    // Initial setup based on default selections
    if (colorSelect.options.length > 0) {
      updateSizeOptions(data.variations, colorSelect.value, sizeSelect);
      updateMaxQuantity();
    }

    // Setup add to cart button
    document.getElementById("addToCartBtn").addEventListener("click", async () => {
      const selectedColor = colorSelect.value;
      const selectedSize = sizeSelect.value;
      const selectedQuantity = parseInt(quantityInput.value);
      const availableStock = getCurrentStock();
      
      if (!selectedColor || !selectedSize) {
        alert("Please select color and size");
        return;
      }
      
      if (selectedQuantity < 1 || selectedQuantity > availableStock) {
        alert(`Please select a quantity between 1 and ${availableStock}`);
        return;
      }
      
      // Add to cart using the shared cart function
      await addToCart(productId, selectedQuantity, selectedSize, selectedColor);
    });

  } catch (err) {
    console.error(err);
    productDetail.innerHTML = "Error loading product.";
  }
}

// Helper function to render color options
function renderColorOptions(variations) {
  if (!variations) return '<option value="">No options available</option>';
  
  return Object.keys(variations).map(color => 
    `<option value="${color}">${color.toUpperCase()}</option>`
  ).join('');
}

// Helper function to render size options
function renderSizeOptions(variations) {
  if (!variations) return '<option value="">No options available</option>';
  
  // Just return default options, will be updated by updateSizeOptions
  return `
    <option value="Small">Small</option>
    <option value="Medium">Medium</option>
    <option value="Large">Large</option>
  `;
}

// Helper function to update size options based on selected color
function updateSizeOptions(variations, selectedColor, sizeSelect) {
  if (!variations || !variations[selectedColor]) {
    sizeSelect.innerHTML = '<option value="">No sizes available</option>';
    return;
  }
  
  const colorVariation = variations[selectedColor];
  sizeSelect.innerHTML = '';
  
  // Add size options with stock information
  if (colorVariation.small > 0) {
    sizeSelect.innerHTML += `<option value="Small">Small (${colorVariation.small} in stock)</option>`;
  }
  
  if (colorVariation.medium > 0) {
    sizeSelect.innerHTML += `<option value="Medium">Medium (${colorVariation.medium} in stock)</option>`;
  }
  
  if (colorVariation.large > 0) {
    sizeSelect.innerHTML += `<option value="Large">Large (${colorVariation.large} in stock)</option>`;
  }
  
  if (sizeSelect.innerHTML === '') {
    sizeSelect.innerHTML = '<option value="">Out of stock</option>';
  }
}

fetchProduct();