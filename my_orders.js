import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy
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
// Get reference to the order container
const orderContainer = document.querySelector('.order-container');

// Format date function
function formatDate(timestamp) {
  const date = timestamp.toDate();
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Load user orders
async function loadUserOrders(userId) {
  try {
    // Create a reference to the orders collection
    const ordersRef = collection(db, "orders");
    
    // Create a query against the collection for this user
    const q = query(
      ordersRef, 
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    
    // If no orders found
    if (querySnapshot.empty) {
      displayNoOrdersMessage();
      return;
    }
    
    // Process orders data
    const orders = [];
    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Display orders summary
    displayOrdersSummary(orders);
    
    // Display each order
    displayOrders(orders);
    
  } catch (error) {
    console.error("Error fetching orders:", error);
    displayErrorMessage("Failed to load your orders. Please try again later.");
  }
}

// Display no orders message
function displayNoOrdersMessage() {
  const orderContent = `
    <div class="heading_container heading_center">
      <h2>Your Orders</h2>
    </div>
    
    <div class="card">
      <div class="order-summary">
        <div>
          <strong>Total Orders:</strong> 0
        </div>
      </div>
      
      <div class="no-orders-message">
        <p>You don't have any orders yet.</p>
        <a href="shop.html" class="shop-now-button">Shop Now</a>
      </div>
    </div>
  `;
  
  orderContainer.innerHTML = orderContent;
}

// Display error message
function displayErrorMessage(message) {
  const errorContent = `
    <div class="heading_container heading_center">
      <h2>Your Orders</h2>
    </div>
    
    <div class="card">
      <div class="error-message">
        <p>${message}</p>
        <button class="retry-button" onclick="location.reload()">Retry</button>
      </div>
    </div>
  `;
  
  orderContainer.innerHTML = errorContent;
}

// Display orders summary
function displayOrdersSummary(orders) {
  const pendingOrders = orders.filter(order => 
    order.status === "Pending" || order.status === "Processing" || order.status === "Shipped"
  ).length;
  
  const summaryHTML = `
    <div class="heading_container heading_center">
      <h2>Your Orders</h2>
    </div>
    
    <div class="card">
      <div class="order-summary">
        <div>
          <strong>Total Orders:</strong> ${orders.length}
        </div>
        <div>
          <strong>Active Orders:</strong> ${pendingOrders}
        </div>
      </div>
  `;
  
  // Start the container with the summary
  orderContainer.innerHTML = summaryHTML;
}

// Display orders
function displayOrders(orders) {
  let ordersHTML = '';
  
  orders.forEach(order => {
    // Determine status class
    let statusClass = '';
    switch (order.status) {
      case 'Pending':
      case 'Processing':
        statusClass = 'status-pending';
        break;
      case 'Shipped':
        statusClass = 'status-shipped';
        break;
      case 'Delivered':
        statusClass = 'status-delivered';
        break;
      case 'Cancelled':
        statusClass = 'status-cancelled';
        break;
      default:
        statusClass = 'status-pending';
    }
    
    // Format dates
    const orderDate = formatDate(order.createdAt);
    
    // Generate HTML for order items
    let itemsHTML = '';
    order.items.forEach(item => {
      itemsHTML += `
        <div class="product-info">
          <div class="product-image">
            <img src="${item.imageUrl}" alt="${item.name}" class="order-product-image">
          </div>
          <div class="product-details">
            <div class="product-name">${item.name}</div>
            <div class="product-variant">Size: ${item.size} | Color: ${item.color}</div>
            <div class="quantity">Quantity: ${item.quantity}</div>
            <div class="product-price">$${item.price.toFixed(2)} each</div>
          </div>
        </div>
      `;
    });
    
    // Estimated delivery or delivery date (for demonstration, add 5 days to created date for pending/shipped)
    let deliveryInfo = '';
    if (order.status === 'Delivered') {
      // For delivered orders, show actual delivery date (for demo we're adding 3 days)
      const deliveryDate = new Date(order.createdAt.toDate());
      deliveryDate.setDate(deliveryDate.getDate() + 3);
      deliveryInfo = `Delivered on: ${formatDate({ toDate: () => deliveryDate })}`;
    } else {
      // For pending/shipped orders, show estimated delivery (for demo adding 5 days)
      const estimatedDate = new Date(order.createdAt.toDate());
      estimatedDate.setDate(estimatedDate.getDate() + 5);
      deliveryInfo = `Estimated Delivery: ${formatDate({ toDate: () => estimatedDate })}`;
    }
    
    // Create order HTML
    const orderHTML = `
      <div class="order-item">
        <div class="order-header">
          <div>
            <div class="order-id">Order #${order.id.substring(0, 8)}</div>
            <div class="order-date">Placed on: ${orderDate}</div>
          </div>
          <div>
            <div>Status: <span class="${statusClass}">${order.status}</span></div>
            <div>${deliveryInfo}</div>
          </div>
        </div>
        
        ${itemsHTML}
        
        <div class="order-footer">
          <div class="price-summary">
            <div>Subtotal: $${order.subtotal.toFixed(2)}</div>
            <div>Shipping: $${order.shipping.toFixed(2)}</div>
            <div class="total-price">Total: $${order.total.toFixed(2)}</div>
          </div>
          <div class="shipping-details">
            <div><strong>Shipping Address:</strong></div>
            <div>${order.firstName} ${order.lastName}</div>
            <div>${order.address}, ${order.city}</div>
            <div>${order.province}, ${order.postalCode}</div>
            <div>Payment Method: ${order.paymentMethod === 'cash-on-delivery' ? 'Cash on Delivery' : order.paymentMethod}</div>
          </div>
        </div>
        
        <button class="track-button" data-order-id="${order.id}">
          ${order.status === 'Delivered' ? 'View Details' : 'Track Order'}
        </button>
      </div>
    `;
    
    ordersHTML += orderHTML;
  });
  
  // Append orders to the card
  const orderCard = document.querySelector('.card');
  orderCard.innerHTML += ordersHTML;
  
  // Add event listeners to the track buttons
  document.querySelectorAll('.track-button').forEach(button => {
    button.addEventListener('click', function() {
      const orderId = this.getAttribute('data-order-id');
      alert(`Tracking information for order #${orderId.substring(0, 8)} will be displayed here.`);
      // In a real application, this would navigate to a tracking page or open a modal
    });
  });
}

// Authentication state observer
onAuthStateChanged(auth, (user) => {
  if (!userOptionDiv) return; // if navbar not present, do nothing

  if (user) {
    // User is signed in
    const uid = user.uid;
    const userDocRef = doc(db, "users", uid);

    // Load the user's orders
    loadUserOrders(uid);

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
      const fallbackName = user.email ? user.email.substring(0, 4) + "..." : "User";
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
    // User is signed out
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
    
    // Display login required message
    const loginRequiredHTML = `
      <div class="heading_container heading_center">
        <h2>Your Orders</h2>
      </div>
      
      <div class="card">
        <div class="login-required">
          <p>Please login to view your orders.</p>
          <a href="login.html" class="login-button">Login</a>
        </div>
      </div>
    `;
    
    orderContainer.innerHTML = loginRequiredHTML;
  }
});