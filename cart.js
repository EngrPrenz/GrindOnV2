import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
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
    loadUserCart(uid); // Load the user's cart data
    
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
    // User is signed out - show login message or redirect
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
    
    // Display message that user needs to log in to view cart
    // Or redirect to login page
    document.getElementById('cart-items-container').style.display = 'none';
    document.getElementById('empty-cart').style.display = 'block';
    document.querySelector('#empty-cart h3').innerText = 'Please log in to view your cart';
    document.querySelector('#empty-cart p').innerText = 'You need to be logged in to manage your shopping cart';
    const emptyCartButton = document.querySelector('#empty-cart .checkout-btn');
    emptyCartButton.innerText = 'LOGIN';
    emptyCartButton.addEventListener('click', function() {
      window.location.href = 'login.html';
    });
  }
});

// Function to load user's cart data from Firestore
// Function to load user's cart data from Firestore
async function loadUserCart(userId) {
  try {
    console.log("Loading cart for user ID:", userId);
    
    const cartRef = collection(db, "carts");
    const q = query(cartRef, where("userId", "==", userId));
    console.log("Executing Firestore query...");
    
    const cartSnapshot = await getDocs(q);
    console.log("Query results:", cartSnapshot.size, "cart items found");
    
    if (cartSnapshot.empty) {
      console.log("Cart is empty, showing empty cart message");
      document.getElementById('cart-items-container').style.display = 'none';
      document.getElementById('empty-cart').style.display = 'block';
      return;
    }
    
    // Clear existing cart items (except the header, summary, and checkout button)
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartHeader = cartItemsContainer.querySelector('.cart-header');
    const cartSummary = cartItemsContainer.querySelector('.cart-summary');
    const checkoutBtn = document.querySelector('.checkout-btn'); // Get the checkout button
    
    cartItemsContainer.innerHTML = '';
    cartItemsContainer.appendChild(cartHeader);
    
    let subtotal = 0;
    
    // Add each cart item to the display
    cartSnapshot.forEach((cartDoc) => {
      const cartItem = cartDoc.data();
      
      // Create cart item element
      const itemElement = document.createElement('div');
      itemElement.className = 'cart-item';
      itemElement.setAttribute('data-id', cartDoc.id);
      
      // Calculate item subtotal
      const itemSubtotal = cartItem.price * cartItem.quantity;
      subtotal += itemSubtotal;
      
      // Populate the cart item HTML
      itemElement.innerHTML = `
        <img src="${cartItem.imageUrl || '/api/placeholder/100/100'}" alt="${cartItem.name}" class="cart-item-image">
        <div class="cart-item-details">
          <div class="cart-item-title">${cartItem.name}</div>
          <div class="cart-item-variant">Size: ${cartItem.size || 'N/A'}, Color: ${cartItem.color || 'N/A'}</div>
          <div class="cart-item-price">₱${cartItem.price.toFixed(2)}</div>
        </div>
        <div class="cart-item-quantity">
          <button class="quantity-btn decrease">-</button>
          <input type="number" min="1" value="${cartItem.quantity}" class="quantity-input" data-price="${cartItem.price}">
          <button class="quantity-btn increase">+</button>
        </div>
        <div class="cart-item-subtotal">₱${itemSubtotal.toFixed(2)}</div>
        <div class="cart-item-remove">
          <i class="fa fa-trash-o"></i>
        </div>
      `;
      
      cartItemsContainer.appendChild(itemElement);
    });
    
    // Add summary section back
    if (cartSummary) {
      cartItemsContainer.appendChild(cartSummary);
    } else {
      // Create summary element if it doesn't exist
      const newSummary = document.createElement('div');
      newSummary.className = 'cart-summary';
      newSummary.innerHTML = `
        <div class="summary-row">
          <span>Subtotal</span>
          <span>₱${subtotal.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Shipping</span>
          <span>₱150.00</span>
        </div>
        <div class="summary-row total">
          <span>Total</span>
          <span>₱${(subtotal + 150).toFixed(2)}</span>
        </div>
      `;
      cartItemsContainer.appendChild(newSummary);
    }
    
    // Add the checkout button back to the container's parent (outside the cart items container)
    if (checkoutBtn && !cartItemsContainer.parentNode.contains(checkoutBtn)) {
      cartItemsContainer.parentNode.appendChild(checkoutBtn);
    }
    
    // Update the summary amounts
    const shipping = 150;
    const total = subtotal + shipping;
    
    const subtotalElement = document.querySelector('.summary-row:first-child span:last-child');
    if (subtotalElement) {
      subtotalElement.innerText = '₱' + subtotal.toFixed(2);
    }
    
    const totalElement = document.querySelector('.summary-row.total span:last-child');
    if (totalElement) {
      totalElement.innerText = '₱' + total.toFixed(2);
    }
    
    // Make sure cart items container is visible
    cartItemsContainer.style.display = 'block';
    document.getElementById('empty-cart').style.display = 'none';
    
    // Make sure checkout button is visible
    if (checkoutBtn) {
      checkoutBtn.style.display = 'block';
    }
    
    // Add event listeners for the quantity buttons and remove buttons
    setupCartEventListeners();
    
  } catch (error) {
    console.error("Detailed error loading cart:", error);
    console.error("Error stack:", error.stack);
    alert("Failed to load your cart items. Please try again later.");
  }
}

// Setup event listeners for cart functionality
function setupCartEventListeners() {
  // Quantity decrease buttons
  const decreaseButtons = document.querySelectorAll('.decrease');
  decreaseButtons.forEach(button => {
    button.addEventListener('click', function() {
      const input = this.nextElementSibling;
      let value = parseInt(input.value);
      if (value > 1) {
        input.value = value - 1;
        updateCartItemTotal(this);
        updateCartItemInDatabase(this);
      }
    });
  });
  
  // Quantity increase buttons
  const increaseButtons = document.querySelectorAll('.increase');
  increaseButtons.forEach(button => {
    button.addEventListener('click', function() {
      const input = this.previousElementSibling;
      let value = parseInt(input.value);
      input.value = value + 1;
      updateCartItemTotal(this);
      updateCartItemInDatabase(this);
    });
  });
  
  // Remove item buttons
  const removeButtons = document.querySelectorAll('.cart-item-remove');
  removeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const cartItem = this.closest('.cart-item');
      const itemId = cartItem.getAttribute('data-id');
      
      if (confirm('Are you sure you want to remove this item from your cart?')) {
        removeCartItemFromDatabase(itemId);
        cartItem.remove();
        updateCartTotal();
        
        // Check if cart is empty
        if (document.querySelectorAll('.cart-item').length === 0) {
          document.getElementById('cart-items-container').style.display = 'none';
          document.getElementById('empty-cart').style.display = 'block';
        }
      }
    });
  });
  
  // Checkout button
  const checkoutBtn = document.querySelector('.checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function() {
      // Redirect to checkout page or initiate checkout process
      window.location.href = 'checkout.html';
    });
  }
}

// Update the cart item total when quantity changes
function updateCartItemTotal(element) {
  const cartItem = element.closest('.cart-item');
  const input = cartItem.querySelector('.quantity-input');
  const price = parseFloat(input.getAttribute('data-price'));
  const quantity = parseInt(input.value);
  const subtotal = price * quantity;
  
  cartItem.querySelector('.cart-item-subtotal').innerText = '₱' + subtotal.toFixed(2);
  updateCartTotal();
}

// Update the overall cart total
function updateCartTotal() {
  const subtotals = document.querySelectorAll('.cart-item-subtotal');
  let total = 0;
  
  subtotals.forEach(item => {
    total += parseFloat(item.innerText.replace('₱', ''));
  });
  
  const shipping = 150; // Fixed shipping cost
  const finalTotal = total + shipping;
  
  document.querySelector('.summary-row:first-child span:last-child').innerText = '₱' + total.toFixed(2);
  document.querySelector('.summary-row.total span:last-child').innerText = '₱' + finalTotal.toFixed(2);
}

// Update cart item in Firestore database when quantity changes
async function updateCartItemInDatabase(element) {
  try {
    const cartItem = element.closest('.cart-item');
    const itemId = cartItem.getAttribute('data-id');
    const quantity = parseInt(cartItem.querySelector('.quantity-input').value);
    
    // Get the current user
    const user = auth.currentUser;
    if (!user) {
      console.error("User not logged in");
      return;
    }
    
    // Update the item in Firestore
    const cartItemRef = doc(db, "carts", itemId);
    await updateDoc(cartItemRef, {
      quantity: quantity,
      updatedAt: new Date()
    });
    
    console.log("Cart item updated successfully");
  } catch (error) {
    console.error("Error updating cart item:", error);
    alert("Failed to update cart. Please try again.");
  }
}

// Remove cart item from Firestore database
async function removeCartItemFromDatabase(itemId) {
  try {
    // Get the current user
    const user = auth.currentUser;
    if (!user) {
      console.error("User not logged in");
      return;
    }
    
    // Delete the item from Firestore
    const cartItemRef = doc(db, "carts", itemId);
    await deleteDoc(cartItemRef);
    
    console.log("Cart item removed successfully");
  } catch (error) {
    console.error("Error removing cart item:", error);
    alert("Failed to remove item from cart. Please try again.");
  }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  // Cart page elements
  const cartItemsContainer = document.getElementById('cart-items-container');
  const emptyCart = document.getElementById('empty-cart');
  
  // If we're on the cart page
  if (cartItemsContainer && emptyCart) {
    // Initially hide both until we check auth status
    cartItemsContainer.style.display = 'none';
    emptyCart.style.display = 'none';
    
    // Auth state will trigger loadUserCart() which will handle the display
  }
  
  // Add event listener for the "Continue Shopping" button if it exists
  const continueShopping = document.querySelector('.continue-shopping');
  if (continueShopping) {
    continueShopping.addEventListener('click', function() {
      window.location.href = 'shop.html';
    });
  }
});

// Function to add a product to the cart
async function addToCart(productId, quantity = 1, size = null, color = null) {
  try {
    // Check if user is logged in
    const user = auth.currentUser;
    if (!user) {
      // Redirect to login page or show login modal
      alert("Please log in to add items to your cart");
      window.location.href = 'login.html';
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
        imageUrl: productData.imageUrl,
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

// Expose functions to global scope for use in HTML elements
window.addToCart = addToCart;