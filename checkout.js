import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// Import missing functions
import {
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

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

// Authentication state observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    const uid = user.uid;
    
    // Load user cart for order summary
    loadUserCart(uid);
    
    // Pre-fill user details if available
    loadUserDetails(uid);
  } else {
    // Redirect to login page if not logged in
    window.location.href = 'login.html?redirect=checkout.html';
  }
});

// Load user's cart data for order summary
async function loadUserCart(userId) {
  try {
    const orderItemsContainer = document.getElementById('order-items');
    orderItemsContainer.innerHTML = ''; // Clear loading placeholder
    
    const cartRef = collection(db, "carts");
    const q = query(cartRef, where("userId", "==", userId));
    const cartSnapshot = await getDocs(q);
    
    if (cartSnapshot.empty) {
      // If cart is empty, redirect to cart page
      window.location.href = 'cart.html';
      return;
    }
    
    let subtotal = 0;
    
    // Add each cart item to the order summary
    cartSnapshot.forEach((cartDoc) => {
      const cartItem = cartDoc.data();
      
      // Calculate item subtotal
      const itemSubtotal = cartItem.price * cartItem.quantity;
      subtotal += itemSubtotal;
      
      // Create order item element
      const itemElement = document.createElement('div');
      itemElement.className = 'order-item';
      
      // Populate the order item HTML
      itemElement.innerHTML = `
        <img src="${cartItem.imageUrl || '/api/placeholder/80/80'}" alt="${cartItem.name}" class="order-item-image">
        <div class="order-item-details">
          <div class="order-item-name">${cartItem.name}</div>
          <div class="order-item-variant">
            ${cartItem.size ? 'Size: ' + cartItem.size + ', ' : ''}
            ${cartItem.color ? 'Color: ' + cartItem.color : ''}
            (Qty: ${cartItem.quantity})
          </div>
          <div class="order-item-price">₱${(cartItem.price * cartItem.quantity).toFixed(2)}</div>
        </div>
      `;
      
      orderItemsContainer.appendChild(itemElement);
    });
    
    // Update order summary totals
    const shipping = 150; // Fixed shipping cost
    const total = subtotal + shipping;
    
    document.getElementById('order-subtotal').innerText = '₱' + subtotal.toFixed(2);
    document.getElementById('order-shipping').innerText = '₱' + shipping.toFixed(2);
    document.getElementById('order-total').innerText = '₱' + total.toFixed(2);
    
    // Store cart data for order processing
    window.cartItems = cartSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    window.orderSubtotal = subtotal;
    window.orderTotal = total;
    
  } catch (error) {
    console.error("Error loading cart for checkout:", error);
    alert("Failed to load your cart. Please try again later.");
  }
}

// Load user details to pre-fill checkout form
async function loadUserDetails(userId) {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Pre-fill user details if available
      if (userData.firstName) document.getElementById('first-name').value = userData.firstName;
      if (userData.lastName) document.getElementById('last-name').value = userData.lastName;
      if (userData.email) document.getElementById('email').value = userData.email;
      if (userData.phone) document.getElementById('phone').value = userData.phone;
      if (userData.address) document.getElementById('address').value = userData.address;
      if (userData.city) document.getElementById('city').value = userData.city;
      if (userData.province) document.getElementById('province').value = userData.province;
      if (userData.postalCode) document.getElementById('zip').value = userData.postalCode;
    }
  } catch (error) {
    console.error("Error loading user details:", error);
    // Continue checkout process even if user details can't be loaded
  }
}

// Handle checkout form submission
// Add an event listener that runs when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Find the checkout form
  const checkoutForm = document.getElementById('checkout-form');
  
  // Add event listener to the form
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleCheckout);
    console.log('Form submit event listener added');
  } else {
    console.error('Checkout form not found in the DOM');
  }
  
  // Payment method toggle - move this code inside DOMContentLoaded
  const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
  const gcashDetails = document.getElementById('gcash-details');
  const bankDetails = document.getElementById('bank-details');
  
  paymentMethods.forEach(method => {
    method.addEventListener('change', function() {
      if (this.value === 'gcash') {
        gcashDetails.style.display = 'block';
        bankDetails.style.display = 'none';
      } else if (this.value === 'bank-transfer') {
        gcashDetails.style.display = 'none';
        bankDetails.style.display = 'block';
      } else {
        gcashDetails.style.display = 'none';
        bankDetails.style.display = 'none';
      }
    });
  });
});

async function handleCheckout(event) {
  event.preventDefault();
  console.log("Checkout process started");
  
  // Get the current user
  const user = auth.currentUser;
  if (!user) {
    console.log("No authenticated user found");
    alert("Please log in to complete your order.");
    window.location.href = 'login.html?redirect=checkout.html';
    return;
  }
  console.log("Authenticated user:", user.uid);
  
  // Validate the form 
  const requiredFields = [
    { id: 'first-name', errorId: 'first-name-error' },
    { id: 'last-name', errorId: 'last-name-error' },
    { id: 'email', errorId: 'email-error' },
    { id: 'phone', errorId: 'phone-error' },
    { id: 'address', errorId: 'address-error' },
    { id: 'city', errorId: 'city-error' },
    { id: 'zip', errorId: 'zip-error' },
    { id: 'province', errorId: 'province-error' }
  ];

  let isValid = true;

  requiredFields.forEach(field => {
    const input = document.getElementById(field.id);
    const errorElement = document.getElementById(field.errorId);
    
    if (!input.value.trim()) {
      errorElement.style.display = 'block';
      isValid = false;
    } else {
      errorElement.style.display = 'none';
    }
  });

  if (!isValid) {
    console.log("Form validation failed");
    return;
  }
  
  // Show loading overlay
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = 'flex';
  } else {
    // Create loading overlay if it doesn't exist
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '1000';
    
    const spinner = document.createElement('div');
    spinner.classList.add('loading-spinner');
    spinner.innerHTML = '<div class="spinner"></div><p>Processing your order...</p>';
    overlay.appendChild(spinner);
    
    document.body.appendChild(overlay);
  }
  
  // Disable submit button to prevent multiple submissions
  const submitButton = document.getElementById('place-order-btn');
  submitButton.disabled = true;
  submitButton.textContent = 'Processing...';
  console.log("Submit button disabled");
  
  try {
    // Gather form data
    const orderData = {
      userId: user.uid,
      firstName: document.getElementById('first-name').value,
      lastName: document.getElementById('last-name').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      address: document.getElementById('address').value,
      city: document.getElementById('city').value,
      province: document.getElementById('province').value,
      postalCode: document.getElementById('zip').value,
      paymentMethod: document.querySelector('input[name="payment-method"]:checked')?.value || 'cod',
      items: window.cartItems || [],
      subtotal: window.orderSubtotal || 0,
      shipping: 150, // Fixed shipping cost
      total: window.orderTotal || 0,
      status: 'pending',
      createdAt: serverTimestamp()
    };
    console.log("Order data prepared:", orderData);
    
    // Create new order in Firestore
    console.log("Attempting to create order in Firestore collection 'orders'");
    const orderRef = await addDoc(collection(db, "orders"), orderData);
    console.log("Order created successfully with ID:", orderRef.id);
    
    // Save user details for future checkouts
    console.log("Updating user details");
    await updateUserDetails(user.uid, orderData);
    console.log("User details updated");
    
    // Clear user's cart after successful order
    console.log("Clearing user cart");
    await clearUserCart(user.uid);
    console.log("User cart cleared");
    
    // Hide loading overlay before showing success message
    const loadingElem = document.getElementById('loading-overlay');
    if (loadingElem) {
      loadingElem.style.display = 'none';
    }
    
    // Show success message with order number
    const orderSuccess = document.getElementById('order-success');
    if (orderSuccess) {
      // Set the order number in the success message
      const orderNumberElement = document.getElementById('success-order-number');
      if (orderNumberElement) {
        orderNumberElement.textContent = `GRD-${orderRef.id.substr(0, 5).toUpperCase()}`;
      }
      
      // Show the success message
      orderSuccess.style.display = 'block';
      
      // Scroll to the success message
      orderSuccess.scrollIntoView({ behavior: 'smooth' });
      
      // After 8 seconds, redirect to homepage (increased from 3 seconds)
      setTimeout(() => {
        window.location.href = 'homepage.html';
      }, 8000); // 8 seconds is a good middle ground between 6-10 seconds
    } else {
      // If success element not found, redirect immediately
      window.location.href = 'homepage.html';
    }
  } catch (error) {
    console.error("Error processing order:", error);
    
    // Hide loading overlay
    const loadingElem = document.getElementById('loading-overlay');
    if (loadingElem) {
      loadingElem.style.display = 'none';
    }
    
    alert("There was an error processing your order. Please try again.");
    submitButton.disabled = false;
    submitButton.textContent = 'Place Order';
  }
}

// Update user details for future checkouts
async function updateUserDetails(userId, orderData) {
  try {
    const userRef = doc(db, "users", userId);
    
    // Extract only the shipping details to save to user profile
    const userDetails = {
      firstName: orderData.firstName,
      lastName: orderData.lastName,
      email: orderData.email,
      phone: orderData.phone,
      address: orderData.address,
      city: orderData.city,
      province: orderData.province,
      postalCode: orderData.postalCode,
      updatedAt: serverTimestamp()
    };
    
    // Update the user document (merge: true preserves other fields)
    await updateDoc(userRef, userDetails, { merge: true });
    
  } catch (error) {
    console.error("Error updating user details:", error);
    // Continue with order process even if user details update fails
  }
}

// Clear the user's cart after successful order
async function clearUserCart(userId) {
  try {
    const cartRef = collection(db, "carts");
    const q = query(cartRef, where("userId", "==", userId));
    const cartSnapshot = await getDocs(q);
    
    // Delete each cart item
    const deletePromises = cartSnapshot.docs.map(doc => {
      return deleteDoc(doc.ref);
    });
    
    await Promise.all(deletePromises);
    
  } catch (error) {
    console.error("Error clearing user cart:", error);
    // Continue with order process even if cart clearing fails
  }
}

// Handle payment method selection
const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
paymentMethods.forEach(method => {
  method.addEventListener('change', function() {
    const paymentDetails = document.querySelectorAll('.payment-details');
    
    // Hide all payment details sections
    paymentDetails.forEach(section => {
      section.style.display = 'none';
    });
    
    // Show the selected payment method's details section
    const selectedMethod = this.value;
    const detailsElement = document.getElementById(`${selectedMethod}-details`);
    if (detailsElement) {
      detailsElement.style.display = 'block';
    }
  });
});

// Initialize default payment method
document.querySelector('input[name="payment-method"]:checked')?.dispatchEvent(new Event('change'));