import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  updateDoc,
  deleteDoc
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

function displayNoOrdersMessage() {
  const orderContent = `
    <div class="heading_container heading_center">
      <h2>YOUR ORDERS</h2>
    </div>
    
    <div class="card no-orders-card">
      <div class="order-icon">
        <i class="fa fa-file-text" aria-hidden="true"></i>
      </div>
      <h3>You don't have any orders yet</h3>
      <p>Browse our collection and place your first order today</p>
      <a href="shop.html" class="shop-now-button">Shop Now</a>
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
          <strong>TOTAL ORDERS:</strong> ${orders.length}
        </div>
        <div>
          <strong>ACTIVE ORDERS:</strong> ${pendingOrders}
        </div>
      </div>
  `;
  
  // Start the container with the summary
  orderContainer.innerHTML = summaryHTML;
}

function displayOrders(orders) {
  let ordersHTML = '';
  
  // Add a style tag to ensure our label styling overrides any existing styles
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    .label-text {
      font-weight: bold !important;
      color: #000000 !important;
    }
  `;
  document.head.appendChild(styleTag);
  
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
      case 'Claimed':
        statusClass = 'status-delivered';
        break;
      case 'Cancelled':
      case 'Declined':
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
            <div class="product-variant"><span class="label-text">Size:</span> ${item.size} | <span class="label-text">Color:</span> ${item.color}</div>
            <div class="quantity"><span class="label-text">Quantity:</span> ${item.quantity}</div>
            <div class="product-price">₱${item.price.toFixed(2)} each</div>
          </div>
        </div>
      `;
    });
    
    // Estimated delivery or delivery date
    let deliveryInfo = '';
    if (order.status === 'Delivered' || order.status === 'Claimed') {
      // For delivered orders, show actual delivery date (for demo we're adding 3 days)
      const deliveryDate = new Date(order.createdAt.toDate());
      deliveryDate.setDate(deliveryDate.getDate() + 3);
      deliveryInfo = `<span class="label-text">Delivered on:</span> ${formatDate({ toDate: () => deliveryDate })}`;
    } else {
      // For pending/shipped orders, show estimated delivery (for demo adding 5 days)
      const estimatedDate = new Date(order.createdAt.toDate());
      estimatedDate.setDate(estimatedDate.getDate() + 5);
      deliveryInfo = `<span class="label-text">Estimated Delivery:</span> ${formatDate({ toDate: () => estimatedDate })}`;
    }
    
    // Create order HTML - Hide track button if status is Claimed
    const trackButtonHtml = order.status === 'Claimed' ? '' : `
      <button class="track-button" data-order-id="${order.id}">
        ${order.status === 'Delivered' || order.status === 'Claimed' ? 'View Details' : 'Track Order'}
      </button>
    `;
    
    const orderHTML = `
      <div class="order-item" id="order-${order.id}">
        <div class="order-header">
          <div>
            <div class="order-id">Order #${order.id.substring(0, 8)}</div>
            <div class="order-date"><span class="label-text">Placed on:</span> ${orderDate}</div>
          </div>
          <div>
            <div><span class="label-text">Status:</span> <span class="${statusClass}" id="status-${order.id}">${order.status}</span></div>
            <div>${deliveryInfo}</div>
          </div>
        </div>
        
        ${itemsHTML}
        
        <div class="order-footer">
          <div class="price-summary">
            <div><span class="label-text">Subtotal:</span> ₱${order.subtotal.toFixed(2)}</div>
            <div><span class="label-text">Shipping:</span> ₱${order.shipping.toFixed(2)}</div>
            <div class="total-price"><span class="label-text">Total:</span> ₱${order.total.toFixed(2)}</div>
          </div>
          <div class="shipping-details">
            <div><span class="label-text">Shipping Address:</span></div>
            <div>${order.firstName} ${order.lastName}</div>
            <div>${order.address}, ${order.city}</div>
            <div>${order.province}, ${order.postalCode}</div>
            <div><span class="label-text">Payment Method:</span> ${order.paymentMethod === 'cash-on-delivery' ? 'Cash on Delivery' : order.paymentMethod}</div>
          </div>
        </div>
        
        ${trackButtonHtml}
      </div>
    `;
    
    ordersHTML += orderHTML;
  });
  
  // Append orders to the card
  const orderCard = document.querySelector('.card');
  orderCard.innerHTML += ordersHTML;
  
  // Set up event listeners for track buttons
  document.querySelectorAll('.track-button').forEach(button => {
    button.addEventListener('click', function() {
      const orderId = this.getAttribute('data-order-id');
      const orderElement = document.getElementById(`order-${orderId}`);
      const statusElement = document.getElementById(`status-${orderId}`);
      const status = statusElement.textContent;
      
      openTrackingModal(orderId, status);
    });
  });

  // Set up modal close event listeners
  setupModalCloseListeners();
}

// Set up event listeners for modal close button and outside click
function setupModalCloseListeners() {
  const modal = document.getElementById('tracking-modal');
  const closeButton = document.querySelector('.close-modal');
  
  if (closeButton) {
    closeButton.addEventListener('click', closeModal);
  }
  
  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      closeModal();
    }
  });
}

// Function to open tracking modal with appropriate message
function openTrackingModal(orderId, status) {
  const modal = document.getElementById('tracking-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');
  const modalActions = document.getElementById('modal-actions');
  
  if (!modal) {
    console.error("Modal element not found");
    return;
  }
  
  modalTitle.textContent = `Order #${orderId.substring(0, 8)} Status`;
  
  // Clear previous content
  modalMessage.innerHTML = '';
  modalActions.innerHTML = '';
  
  // Set content based on status
  switch(status) {
    case 'pending':
    case 'Processing':
      modalMessage.innerHTML = `
        <p>Your order is still in processing. Thank you for your patience!</p>
        <div class="order-status-progress">
          <div class="status-step active">
            <div class="step-icon"><i class="fa fa-check-circle"></i></div>
            <div class="step-label">Order Placed</div>
          </div>
          <div class="status-step">
            <div class="step-icon"><i class="fa fa-truck"></i></div>
            <div class="step-label">Shipped</div>
          </div>
          <div class="status-step">
            <div class="step-icon"><i class="fa fa-home"></i></div>
            <div class="step-label">Delivered</div>
          </div>
        </div>
      `;
      break;
      
    case 'Shipped':
      modalMessage.innerHTML = `
        <p>Your order has been shipped! Did the product(s) already arrive?</p>
        <div class="order-status-progress">
          <div class="status-step active">
            <div class="step-icon"><i class="fa fa-check-circle"></i></div>
            <div class="step-label">Order Placed</div>
          </div>
          <div class="status-step active">
            <div class="step-icon"><i class="fa fa-truck"></i></div>
            <div class="step-label">Shipped</div>
          </div>
          <div class="status-step">
            <div class="step-icon"><i class="fa fa-home"></i></div>
            <div class="step-label">Delivered</div>
          </div>
        </div>
      `;
      modalActions.innerHTML = `
        <button id="claim-button" class="action-button" data-order-id="${orderId}">Claimed</button>
      `;
      
      // Add event listener to claim button
      setTimeout(() => {
        const claimButton = document.getElementById('claim-button');
        if (claimButton) {
          claimButton.addEventListener('click', async function() {
            await updateOrderStatus(orderId, 'Claimed');
          });
        }
      }, 0);
      break;
      
    case 'Declined':
      modalMessage.innerHTML = `
        <p>Sorry, your order has been declined. Thank you for your patience. We're sure there are other products here that are available for you.</p>
      `;
      modalActions.innerHTML = `
        <button id="delete-button" class="action-button delete-button" data-order-id="${orderId}">Delete Order</button>
      `;
      
      // Add event listener to delete button
      setTimeout(() => {
        const deleteButton = document.getElementById('delete-button');
        if (deleteButton) {
          deleteButton.addEventListener('click', async function() {
            await deleteOrder(orderId);
          });
        }
      }, 0);
      break;
      
    case 'Delivered':
    case 'Claimed':
      modalMessage.innerHTML = `
        <p>Your order has been delivered. Thank you for shopping with us!</p>
        <div class="order-status-progress">
          <div class="status-step active">
            <div class="step-icon"><i class="fa fa-check-circle"></i></div>
            <div class="step-label">Order Placed</div>
          </div>
          <div class="status-step active">
            <div class="step-icon"><i class="fa fa-truck"></i></div>
            <div class="step-label">Shipped</div>
          </div>
          <div class="status-step active">
            <div class="step-icon"><i class="fa fa-home"></i></div>
            <div class="step-label">Delivered</div>
          </div>
        </div>
      `;
      break;
      
    default:
      modalMessage.textContent = `Current status: ${status}`;
  }
  
  modal.style.display = 'block';
}

// Function to close modal
function closeModal() {
  const modal = document.getElementById('tracking-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Function to update order status
async function updateOrderStatus(orderId, newStatus) {
  try {
    const user = auth.currentUser;
    if (!user) {
      alert('You must be logged in to update an order.');
      return;
    }
    
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      status: newStatus
    });
    
    // Update UI
    const statusElement = document.getElementById(`status-${orderId}`);
    statusElement.textContent = newStatus;
    
    // Update status class
    if (newStatus === 'Claimed') {
      statusElement.className = 'status-delivered';
      // Hide the track button
      const orderElement = document.getElementById(`order-${orderId}`);
      const trackButton = orderElement.querySelector('.track-button');
      if (trackButton) {
        trackButton.style.display = 'none';
      }
    }
    
    closeModal();
    alert(`Order status updated to ${newStatus}!`);
    
    // Reload page to reflect changes
    location.reload();
    
  } catch (error) {
    console.error("Error updating order status:", error);
    alert("Failed to update order status. Please try again.");
  }
}

// Function to delete order
async function deleteOrder(orderId) {
  try {
    const user = auth.currentUser;
    if (!user) {
      alert('You must be logged in to delete an order.');
      return;
    }
    
    if (confirm("Are you sure you want to delete this order?")) {
      const orderRef = doc(db, "orders", orderId);
      await deleteDoc(orderRef);
      
      // Remove order from UI
      const orderElement = document.getElementById(`order-${orderId}`);
      orderElement.remove();
      
      closeModal();
      alert("Order deleted successfully!");
      
      // Reload to update summary count
      location.reload();
    }
    
  } catch (error) {
    console.error("Error deleting order:", error);
    alert("Failed to delete order. Please try again.");
  }
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
    
    // Display login required message with shopping cart style UI
    const loginRequiredHTML = `
    <div class="heading_container heading_center">
      <h2>YOUR ORDERS</h2>
    </div>
    
    <div class="card login-required-card">
      <div class="order-icon">
        <i class="fa fa-file-text" aria-hidden="true"></i>
      </div>
      <h3>Please log in to view your orders</h3>
      <p>You need to be logged in to tracked your orders</p>
      <a href="login.html" class="login-button">Login</a>
    </div>
  `;

  orderContainer.innerHTML = loginRequiredHTML;
  }
});

// Initialize modal close button functionality when page loads
document.addEventListener('DOMContentLoaded', function() {
  setupModalCloseListeners();
});