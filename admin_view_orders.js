import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { checkAdminAuth, initAdminName } from "./admin_auth.js";

// Firebase configuration - fixed storage bucket URL
const firebaseConfig = {
  apiKey: "AIzaSyC5n40vPlIjXQ25X4NJlr8Z2jRGux0C1Y8",
  authDomain: "grindon-da126.firebaseapp.com", 
  projectId: "grindon-da126",
  storageBucket: "grindon-da126.firebasestorage.app", // Fixed to match the URL in add_products.js
  messagingSenderId: "606558901364",
  appId: "1:606558901364:web:e39156bea8d403f191ed21"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Initialize page when DOM loads
document.addEventListener("DOMContentLoaded", async function() {
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
    
    // Fetch orders
    await fetchPendingOrders();
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
    alert("Error signing out: " + error.message);
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

// Fetch pending orders from Firestore - fixed to handle case-sensitivity
async function fetchPendingOrders() {
  const ordersTableBody = document.querySelector("#ordersTable tbody");
  ordersTableBody.innerHTML = ""; // Clear existing rows

  try {
    const ordersRef = collection(db, "orders");
    
    // Get all orders first so we can filter them properly
    const querySnapshot = await getDocs(ordersRef);

    console.log(`Total orders found: ${querySnapshot.size}`);
    
    if (querySnapshot.empty) {
      ordersTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center;">No orders found</td>
        </tr>
      `;
      return;
    }

    let pendingOrdersFound = false;

    querySnapshot.forEach((doc) => {
      const order = doc.data();
      
      // Case-insensitive check for "pending" status
      // This ensures we match "pending", "Pending", "PENDING", etc.
      if (order.status && order.status.toLowerCase() === "pending") {
        pendingOrdersFound = true;
        const totalQuantity = order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        // Log for debugging
        console.log(`Found pending order: ${doc.id}`, order);
        
        const row = `
          <tr>
            <td>${doc.id}</td>
            <td>${order.items.map(item => item.name).join(", ")}</td>
            <td>${order.firstName || ''} ${order.lastName || ''}</td>
            <td>${totalQuantity}</td>
            <td>₱${order.total ? order.total.toFixed(2) : '0.00'}</td>
            <td><span class="status-badge status-pending">${order.status}</span></td>
            <td>
              <button class="action-btn ship-btn" data-id="${doc.id}"><i class="fas fa-shipping-fast"></i> Ship Order</button>
              <button class="action-btn decline-btn" data-id="${doc.id}"><i class="fas fa-times-circle"></i> Decline</button>
            </td>
          </tr>
        `;
        ordersTableBody.innerHTML += row;
      }
    });

    if (!pendingOrdersFound) {
      ordersTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center;">No pending orders found</td>
        </tr>
      `;
      return;
    }

    // Add event listeners for ship and decline buttons
    document.querySelectorAll(".ship-btn").forEach((button) => {
      button.addEventListener("click", () => fulfillOrder(button.dataset.id));
    });

    document.querySelectorAll(".decline-btn").forEach((button) => {
      button.addEventListener("click", () => declineOrder(button.dataset.id));
    });
  } catch (error) {
    console.error("Error fetching orders: ", error);
    ordersTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center;">Error loading orders: ${error.message}</td>
      </tr>
    `;
  }
}

// Fulfill an order and reduce stock for variations
async function fulfillOrder(orderId) {
  try {
    console.log("Starting to fulfill order:", orderId);
    
    // Get the order data first
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      alert("Order not found!");
      return;
    }
    
    const orderData = orderSnap.data();
    const items = orderData.items;
    
    console.log("Order data:", orderData);
    console.log("Items in order:", items);
    
    // Process each item in the order
    for (const item of items) {
      // Use productId instead of id
      const productId = item.productId;
      const quantity = item.quantity || 1;
      const color = item.color.toLowerCase(); // Make lowercase to match DB structure
      let size = item.size.toLowerCase(); // Make lowercase to match DB structure
      
      console.log(`Processing item: ${item.name}, Color: ${color}, Size: ${size}, Quantity: ${quantity}`);
      
      // Get the product document
      const productRef = doc(db, "products", productId);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        console.error(`Product ${productId} not found`);
        continue;
      }
      
      const productData = productSnap.data();
      console.log("Product data:", productData);
      
      // Check if variations exist
      if (!productData.variations) {
        console.error(`Product ${productId} has no variations`);
        continue;
      }
      
      // Check if this color exists in variations
      if (!productData.variations[color]) {
        console.error(`Color "${color}" not found in variations`);
        continue;
      }
      
      // Check if this size exists for this color
      if (productData.variations[color][size] === undefined) {
        // Try with first letter capitalized
        size = size.charAt(0).toUpperCase() + size.slice(1);
        console.log(`Trying with capitalized size: ${size}`);
        
        if (productData.variations[color][size] === undefined) {
          console.error(`Size "${size}" not found for color "${color}"`);
          continue;
        }
      }
      
      const currentStock = productData.variations[color][size];
      console.log("Current stock for", color, size, ":", currentStock);
      
      if (currentStock < quantity) {
        console.error(`Not enough stock. Need: ${quantity}, Have: ${currentStock}`);
        continue;
      }
      
      // Create update object
      const updateData = {};
      updateData[`variations.${color}.${size}`] = currentStock - quantity;
      
      console.log("Updating product with:", updateData);
      
      // Update the product
      await updateDoc(productRef, updateData);
      console.log("Stock updated successfully for", productId);
    }
    
    // Update order status
    await updateDoc(orderRef, { status: "Shipped" });
    console.log("Order status updated to Shipped");
    
    alert("Order shipped and stock updated successfully!");
    fetchPendingOrders(); // Refresh the table
  } catch (error) {
    console.error("Error fulfilling order:", error);
    alert(`Failed to ship the order: ${error.message}`);
  }
}

// Decline an order
async function declineOrder(orderId) {
  if (!confirm("Are you sure you want to decline this order?")) return;

  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, { status: "Declined" });
    alert("Order declined successfully!");
    fetchPendingOrders(); // Refresh the table
  } catch (error) {
    console.error("Error declining order: ", error);
    alert("Failed to decline the order. Please try again.");
  }
}