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
  <button id="closeModalBtn" style="margin: 10px; padding: 10px 20px; background-color:${isError ? '#dc3545' : 'rgb(0, 0, 0)'}; color: white; border: 2px solid transparent; border-radius: 4px; cursor: pointer; transition: all 0.3s ease;">Continue Shopping</button>
`;

modal.appendChild(modalContent);
document.body.appendChild(modal);

// Add hover effect with JavaScript
const closeBtn = document.getElementById('closeModalBtn');

closeBtn.addEventListener('mouseover', () => {
  closeBtn.style.backgroundColor = '#555555'; // Grey color on hover
  closeBtn.style.borderColor = 'white';      // White border on hover
});

closeBtn.addEventListener('mouseout', () => {
  closeBtn.style.backgroundColor = isError ? '#dc3545' : 'rgb(0, 0, 0)'; // Return to original color
  closeBtn.style.borderColor = 'transparent';                            // Return to transparent border
});

closeBtn.addEventListener('click', () => {
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
        <button id="loginModalBtn" style="margin: 10px; padding: 10px 20px; background-color:rgb(0, 0, 0); color: white; border: none; border-radius: 4px; cursor: pointer;" onmouseover="this.style.backgroundColor='grey'; this.style.color='#f0f0f0';" onmouseout="this.style.backgroundColor='rgb(0, 0, 0)'; this.style.color='white';">Log In</button>
        <button id="closeModalBtn" style="margin: 10px; padding: 10px 20px; background-color: black; color: white; border: none; border-radius: 4px; cursor: pointer;" onmouseover="this.style.backgroundColor='grey'; this.style.color='#e0e0e0';" onmouseout="this.style.backgroundColor='black'; this.style.color='white';">Close</button>
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

// Modified fetchProduct function to set up zoom functionality
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

    // Wait for the main image to be properly loaded before setting up zoom
    console.log("Setting up image load detection");
    
    setTimeout(() => {
      console.log("Initializing zoom functionality");
      setupPopupZoom();
    }, 500);

  } catch (err) {
    console.error("Error loading product:", err);
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

// Add this JavaScript to your product.js file

// Function to set up popup image zoom effect
function setupPopupZoom() {
  console.log("Setting up zoom functionality");
  const mainImageContainer = document.querySelector('.main-image-container');
  const mainImage = document.getElementById('mainImage');
  
  if (!mainImageContainer || !mainImage) {
    console.log("Main image or container not found");
    return;
  }
  
  // Create zoom lens element - now bigger
  const lens = document.createElement('div');
  lens.setAttribute('class', 'img-zoom-lens');
  lens.style.display = 'none';
  lens.style.width = '150px'; // Increased from 100px
  lens.style.height = '150px'; // Increased from 100px
  
  // Create zoom popup container - now bigger
  const zoomPopup = document.createElement('div');
  zoomPopup.setAttribute('class', 'img-zoom-popup');
  zoomPopup.style.display = 'none';
  zoomPopup.style.width = '500px'; // Increased from 400px
  zoomPopup.style.height = '500px'; // Increased from 400px
  
  // Add elements to the DOM
  mainImageContainer.style.position = 'relative';
  mainImageContainer.appendChild(lens);
  document.body.appendChild(zoomPopup); // Add popup to body for absolute positioning
  
  // Variables for zoom calculation
  const zoomLevel = 1.5; // Zoom magnification level
  
  // Set up event listeners
  mainImageContainer.addEventListener('mouseenter', function() {
    console.log("Mouse entered image container");
    lens.style.display = 'block';
    zoomPopup.style.display = 'block';
    updateZoomView(mainImage, lens, zoomPopup, zoomLevel);
    
    // Position the popup on page entry
    positionPopupFixed(mainImage, zoomPopup);
  });
  
  mainImageContainer.addEventListener('mouseleave', function() {
    console.log("Mouse left image container");
    lens.style.display = 'none';
    zoomPopup.style.display = 'none';
  });
  
  mainImageContainer.addEventListener('mousemove', function(e) {
    moveLens(e, mainImage, lens, zoomPopup, zoomLevel);
    // We don't call positionPopup here anymore since we want fixed position
  });
  
  // Handle window resize to reposition the popup
  window.addEventListener('resize', function() {
    updateZoomView(mainImage, lens, zoomPopup, zoomLevel);
    positionPopupFixed(mainImage, zoomPopup);
  });
  
  // Load initial image into zoom view
  if (mainImage.complete) {
    console.log("Image already loaded, updating zoom view");
    updateZoomView(mainImage, lens, zoomPopup, zoomLevel);
  } else {
    console.log("Setting up load event listener for image");
    mainImage.addEventListener('load', function() {
      console.log("Image loaded, updating zoom view");
      updateZoomView(mainImage, lens, zoomPopup, zoomLevel);
    });
  }
}

// Function to position popup near cursor
function positionPopupFixed(img, popup) {
  const imgRect = img.getBoundingClientRect();
  const imgContainer = img.closest('.main-image-container');
  const imgContainerRect = imgContainer.getBoundingClientRect();
  
  // Position the popup to the right of the image
  const popupLeft = imgContainerRect.right + 20; // 20px margin
  const popupTop = imgContainerRect.top;
  
  // Check if enough space on right side, if not place it on left
  const windowWidth = window.innerWidth;
  const popupWidth = popup.offsetWidth;
  
  if (popupLeft + popupWidth > windowWidth - 20) {
    // Not enough space on right, try left side
    popup.style.left = (imgContainerRect.left - popupWidth - 20) + 'px';
  } else {
    // Enough space on right side
    popup.style.left = popupLeft + 'px';
  }
  
  popup.style.top = popupTop + 'px';
}

// Function to move the lens and update zoom view
function moveLens(e, img, lens, popup, zoomLevel) {
  // Prevent any default action
  e.preventDefault();
  
  // Get cursor position
  const pos = getCursorPos(e, img);
  let x = pos.x;
  let y = pos.y;
  
  // Get the image dimensions as displayed
  const rect = img.getBoundingClientRect();
  const imgWidth = rect.width;
  const imgHeight = rect.height;
  
  // Calculate the ratio between natural and displayed dimensions
  const ratioX = img.naturalWidth / imgWidth;
  const ratioY = img.naturalHeight / imgHeight;
  
  // Adjust lens position for center of lens
  const lensWidth = lens.offsetWidth;
  const lensHeight = lens.offsetHeight;
  
  // Calculate position in the natural image space
  const naturalX = x - (lensWidth / 2) / ratioX;
  const naturalY = y - (lensHeight / 2) / ratioY;
  
  // Convert back to display coordinates
  let lensX = naturalX / ratioX;
  let lensY = naturalY / ratioY;
  
  // Set boundaries in display coordinates
  if (lensX > imgWidth - lensWidth) lensX = imgWidth - lensWidth;
  if (lensX < 0) lensX = 0;
  if (lensY > imgHeight - lensHeight) lensY = imgHeight - lensHeight;
  if (lensY < 0) lensY = 0;
  
  // Set lens position on display
  lens.style.left = lensX + "px";
  lens.style.top = lensY + "px";
  
  // Calculate the position for the background image in the popup
  // We need to convert lens position back to natural image coordinates
  const bgX = lensX * ratioX;
  const bgY = lensY * ratioY;
  
  // Set the background position for the popup
  popup.style.backgroundPosition = `-${bgX * zoomLevel}px -${bgY * zoomLevel}px`;
}

// Function to get cursor position
function getCursorPos(e, img) {
  // Get the bounding rectangle of the image
  const rect = img.getBoundingClientRect();
  
  // Get displayed image dimensions
  const displayWidth = rect.width;
  const displayHeight = rect.height;
  
  // Calculate position of cursor relative to the image
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  
  // Convert to position within the actual image (accounting for scaling/letterboxing)
  // Get the actual dimensions of the image as rendered (may be different than naturalWidth/Height due to object-fit)
  const imgComputedStyle = window.getComputedStyle(img);
  const imgWidth = img.width || img.clientWidth;
  const imgHeight = img.height || img.clientHeight;
  
  // Calculate the scaling factor between natural image size and displayed size
  const scaleX = img.naturalWidth / imgWidth;
  const scaleY = img.naturalHeight / imgHeight;
  
  // Adjust x and y by scale factor
  x = Math.max(0, Math.min(x * scaleX, img.naturalWidth));
  y = Math.max(0, Math.min(y * scaleY, img.naturalHeight));
  
  return { x, y };
}

// Function to update zoom view dimensions
function updateZoomView(img, lens, popup, zoomLevel) {
  console.log("Updating zoom view");
  
  // Set popup dimensions
  const popupWidth = 500; // Bigger size (was 400)
  const popupHeight = 500; // Bigger size (was 400)
  
  // Apply dimensions to popup
  popup.style.width = popupWidth + 'px';
  popup.style.height = popupHeight + 'px';
  
  // Set background properties for the popup
  popup.style.backgroundImage = `url('${img.src}')`;
  popup.style.backgroundSize = (img.naturalWidth * zoomLevel) + 'px ' + (img.naturalHeight * zoomLevel) + 'px';
  popup.style.backgroundRepeat = 'no-repeat';
  
  // Position the popup fixed to the right of the image
  positionPopupFixed(img, popup);
  
  console.log("Zoom view updated with image:", img.src);
  console.log("Natural dimensions:", img.naturalWidth, "x", img.naturalHeight);
  console.log("Zoom size:", img.naturalWidth * zoomLevel, "x", img.naturalHeight * zoomLevel);
}

// Override the original changeMainImage function to maintain zoom functionality
window.changeMainImage = function(imgSrc, clickedThumb) {
  console.log("Changing main image to:", imgSrc);
  const mainImage = document.getElementById("mainImage");
  
  // Update active thumbnail
  const thumbnails = document.querySelectorAll(".thumbnail");
  thumbnails.forEach(thumb => {
    thumb.classList.remove("active");
  });
  clickedThumb.classList.add("active");
  
  // Reset zoom view when changing images
  const zoomLens = document.querySelector('.img-zoom-lens');
  const zoomPopup = document.querySelector('.img-zoom-popup');
  
  if (zoomLens && zoomPopup) {
    zoomLens.style.display = 'none';
    zoomPopup.style.display = 'none';
  }
  
  // Set new image source
  mainImage.src = imgSrc;
  
  // Update zoom view when new image loads
  mainImage.onload = function() {
    console.log("New image loaded, updating zoom view");
    if (zoomLens && zoomPopup) {
      updateZoomView(mainImage, zoomLens, zoomPopup, 2.5);
    }
  };
};
// Function to set up image zoom after product loads
function addPopupZoomFunctionality() {
  // Wait for image to load before setting up the zoom
  document.addEventListener('DOMContentLoaded', function() {
    // Override changeMainImage function to maintain zoom functionality when changing images
    window.changeMainImage = function(imgSrc, clickedThumb) {
      const mainImage = document.getElementById("mainImage");
      mainImage.src = imgSrc;
      
      // Update active thumbnail
      const thumbnails = document.querySelectorAll(".thumbnail");
      thumbnails.forEach(thumb => {
        thumb.classList.remove("active");
      });
      clickedThumb.classList.add("active");
      
      // Reset zoom view when changing images
      const zoomLens = document.querySelector('.img-zoom-lens');
      const zoomPopup = document.querySelector('.img-zoom-popup');
      
      if (zoomLens && zoomPopup) {
        zoomLens.style.display = 'none';
        zoomPopup.style.display = 'none';
        
        // Update zoom view when new image loads
        mainImage.onload = function() {
          updateZoomView(mainImage, zoomLens, zoomPopup, 2.5);
        };
      }
    };
    
    // Check and setup zoom after product loads
    const checkImageLoaded = setInterval(function() {
      const mainImage = document.getElementById('mainImage');
      if (mainImage) {
        clearInterval(checkImageLoaded);
        // Add slight delay to ensure image is fully rendered
        setTimeout(setupPopupZoom, 500);
      }
    }, 100);
  });
}

// Add this to the end of your fetchProduct function
function modifyFetchProduct() {
  const originalFetchProduct = fetchProduct;
  
  fetchProduct = async function() {
    await originalFetchProduct();
    addPopupZoomFunctionality();
  };
}

modifyFetchProduct();
// Initialize the page
fetchProduct();