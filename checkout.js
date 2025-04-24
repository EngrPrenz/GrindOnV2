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
        
        // Fill in the shipping form fields
        document.getElementById('full-name').value = userData.fullName || '';
        document.getElementById('phone').value = userData.phone || '';
        document.getElementById('address').value = userData.address || '';
        document.getElementById('city').value = userData.city || '';
        document.getElementById('postal-code').value = userData.postalCode || '';
      }
    } catch (error) {
      console.error("Error loading user details:", error);
    }
  }
  
  // Handle order submission
  document.getElementById('checkout-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to place an order.");
      return;
    }
  
    const fullName = document.getElementById('full-name').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const postalCode = document.getElementById('postal-code').value;
    
    if (!fullName || !phone || !address || !city || !postalCode) {
      alert("Please fill in all the required fields.");
      return;
    }
  
    const orderData = {
      userId: user.uid,
      fullName,
      phone,
      address,
      city,
      postalCode,
      items: window.cartItems || [],
      subtotal: window.orderSubtotal || 0,
      shipping: 150,
      total: window.orderTotal || 0,
      createdAt: serverTimestamp(),
      status: "pending"
    };
  
    try {
      await addDoc(collection(db, "orders"), orderData);
  
      // Optionally: clear user's cart
      const cartQuery = query(collection(db, "carts"), where("userId", "==", user.uid));
      const cartSnapshot = await getDocs(cartQuery);
      cartSnapshot.forEach(async (docSnap) => {
        await deleteDoc(doc(db, "carts", docSnap.id));
      });
  
      alert("Order placed successfully!");
      window.location.href = 'order-success.html'; // Redirect to confirmation page
  
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order. Please try again.");
    }
  });
  