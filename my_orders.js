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

// Modal Management System
const showModal = (title, message, buttons = [], type = 'info') => {
  const modal = document.getElementById('tracking-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');
  const modalActions = document.getElementById('modal-actions');
  
  // Clear previous content
  modalTitle.textContent = title;
  modalMessage.innerHTML = message;
  modalActions.innerHTML = '';
  
  // Add appropriate class based on type
  modalTitle.className = '';
  if (type) {
    modalTitle.classList.add(`modal-title-${type}`);
  }
  
  // Add buttons
  buttons.forEach(button => {
    const btnElement = document.createElement('button');
    btnElement.className = `action-button ${button.class || ''}`;
    btnElement.textContent = button.text;
    btnElement.id = button.id || '';
    
    // Add event listener for button
    if (button.onClick) {
      btnElement.addEventListener('click', () => {
        button.onClick();
      });
    }
    
    modalActions.appendChild(btnElement);
  });
  
  // Show the modal
  modal.style.display = 'block';
  
  // Return a promise that resolves when modal is closed
  return new Promise((resolve) => {
    const closeModal = () => {
      modal.style.display = 'none';
      resolve();
    };
    
    // Set up close button functionality
    const closeButton = document.querySelector('.close-modal');
    if (closeButton) {
      closeButton.addEventListener('click', closeModal, { once: true });
    }
    
    // Close modal when clicking outside
    const outsideClickHandler = (event) => {
      if (event.target === modal) {
        closeModal();
        window.removeEventListener('click', outsideClickHandler);
      }
    };
    window.addEventListener('click', outsideClickHandler);
    
    // Add close method to each button
    buttons.forEach(button => {
      if (button.closeOnClick !== false) {
        const btnElement = document.getElementById(button.id);
        if (btnElement) {
          btnElement.addEventListener('click', closeModal, { once: true });
        }
      }
    });
  });
};

// Confirmation modal helper
const confirmModal = (title, message, confirmText = "Confirm", cancelText = "Cancel", type = "warning") => {
  return new Promise((resolve) => {
    const modal = document.getElementById('tracking-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalActions = document.getElementById('modal-actions');
    
    // Clear previous content
    modalTitle.textContent = title;
    modalMessage.innerHTML = message;
    modalActions.innerHTML = '';
    
    // Add buttons
    const confirmButton = document.createElement('button');
    confirmButton.className = `action-button delete-button`;
    confirmButton.textContent = confirmText;
    confirmButton.id = "confirm-button";
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'action-button';
    cancelButton.textContent = cancelText;
    cancelButton.id = "cancel-button";
    
    // Add the buttons to modal
    modalActions.appendChild(confirmButton);
    modalActions.appendChild(cancelButton);
    
    // Show the modal
    modal.style.display = 'block';
    
    // Handle button clicks
    confirmButton.addEventListener('click', () => {
      modal.style.display = 'none';
      resolve(true);
    });
    
    cancelButton.addEventListener('click', () => {
      modal.style.display = 'none';
      resolve(false);
    });
    
    // Close button handler
    const closeButton = document.querySelector('.close-modal');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
        resolve(false);
      });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
        resolve(false);
      }
    }, { once: true });
  });
};

// Success modal helper
const successModal = async (title, message) => {
  await showModal(title, message, [
    {
      text: "OK",
      class: "action-button",
      id: "ok-button"
    }
  ], "success");
};

// Error modal helper
const errorModal = async (title, message) => {
  await showModal(title, message, [
    {
      text: "OK",
      class: "",
      id: "ok-button"
    }
  ], "error");
};

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
    order.status === "pending" || order.status === "Processing" || order.status === "Shipped"
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
      case 'pending':
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
}

// Function to open tracking modal with appropriate message
function openTrackingModal(orderId, status) {
  const modal = document.getElementById('tracking-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');
  const modalActions = document.getElementById('modal-actions');
  
  // Clear previous content
  modalTitle.textContent = `Order #${orderId.substring(0, 8)} Status`;
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
      
      const okButton = document.createElement('button');
      okButton.className = 'action-button';
      okButton.textContent = "OK";
      modalActions.appendChild(okButton);
      
      okButton.addEventListener('click', () => {
        modal.style.display = 'none';
      });
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
      
      const claimButton = document.createElement('button');
      claimButton.className = 'action-button';
      claimButton.textContent = "Mark as Claimed";
      modalActions.appendChild(claimButton);
      
      const closeButton = document.createElement('button');
      closeButton.className = 'action-button';
      closeButton.textContent = "Close";
      modalActions.appendChild(closeButton);
      
      claimButton.addEventListener('click', async () => {
        modal.style.display = 'none';
        await updateOrderStatus(orderId, 'Claimed');
      });
      
      closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
      });
      break;
      
    case 'Declined':
      modalMessage.innerHTML = `
        <p>Sorry, your order has been declined. Thank you for your patience. We're sure there are other products here that are available for you.</p>
      `;
      
      const deleteButton = document.createElement('button');
      deleteButton.className = 'action-button delete-button';
      deleteButton.textContent = "Delete Order";
      modalActions.appendChild(deleteButton);
      
      const closeBtn = document.createElement('button');
      closeBtn.className = 'action-button';
      closeBtn.textContent = "Close";
      modalActions.appendChild(closeBtn);
      
      deleteButton.addEventListener('click', () => {
        modal.style.display = 'none';
        deleteOrder(orderId);
      });
      
      closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
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
      
      const okBtn = document.createElement('button');
      okBtn.className = 'action-button';
      okBtn.textContent = "OK";
      modalActions.appendChild(okBtn);
      
      okBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
      break;
      
    default:
      modalMessage.innerHTML = `Current status: ${status}`;
      
      const defaultOkBtn = document.createElement('button');
      defaultOkBtn.className = 'action-button';
      defaultOkBtn.textContent = "OK";
      modalActions.appendChild(defaultOkBtn);
      
      defaultOkBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
  }
  
  // Show the modal
  modal.style.display = 'block';
  
  // Set up close button functionality
  const closeModalBtn = document.querySelector('.close-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }
  
  // Close modal when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
}

// Function to update order status
async function updateOrderStatus(orderId, newStatus) {
  try {
    const user = auth.currentUser;
    if (!user) {
      await errorModal("Authentication Error", "You must be logged in to update an order.");
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
    
    await successModal("Order Updated", `Order status updated to ${newStatus}!`);
    
    // Reload page to reflect changes
    location.reload();
    
  } catch (error) {
    console.error("Error updating order status:", error);
    await errorModal("Update Failed", "Failed to update order status. Please try again.");
  }
}

// Function to delete order
// Function to delete order
async function deleteOrder(orderId) {
  try {
    const user = auth.currentUser;
    if (!user) {
      // Show error modal if user isn't logged in
      const modal = document.getElementById('tracking-modal');
      const modalTitle = document.getElementById('modal-title');
      const modalMessage = document.getElementById('modal-message');
      const modalActions = document.getElementById('modal-actions');
      
      modalTitle.textContent = "Authentication Error";
      modalMessage.innerHTML = "You must be logged in to delete an order.";
      modalActions.innerHTML = '';
      
      const okButton = document.createElement('button');
      okButton.className = 'action-button';
      okButton.textContent = "OK";
      modalActions.appendChild(okButton);
      
      modal.style.display = 'block';
      
      okButton.addEventListener('click', () => {
        modal.style.display = 'none';
      });
      
      return;
    }
    
    // Confirm deletion
    const isConfirmed = await confirmModal(
      "Delete Order",
      "Are you sure you want to delete this order? This action cannot be undone.",
      "Delete",
      "Cancel"
    );
    
    // If user confirmed deletion
    if (isConfirmed) {
      const orderRef = doc(db, "orders", orderId);
      await deleteDoc(orderRef);
      
      // Remove order from UI
      const orderElement = document.getElementById(`order-${orderId}`);
      if (orderElement) {
        orderElement.remove();
      }
      
      // Show success message
      const modal = document.getElementById('tracking-modal');
      const modalTitle = document.getElementById('modal-title');
      const modalMessage = document.getElementById('modal-message');
      const modalActions = document.getElementById('modal-actions');
      
      modalTitle.textContent = "Order Deleted";
      modalMessage.innerHTML = "Order deleted successfully!";
      modalActions.innerHTML = '';
      
      const okButton = document.createElement('button');
      okButton.className = 'action-button';
      okButton.textContent = "OK";
      modalActions.appendChild(okButton);
      
      modal.style.display = 'block';
      
      okButton.addEventListener('click', () => {
        modal.style.display = 'none';
        window.location.reload();
      });
    }
  } catch (error) {
    console.error("Error deleting order:", error);
    
    // Show error modal
    const modal = document.getElementById('tracking-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalActions = document.getElementById('modal-actions');
    
    modalTitle.textContent = "Delete Failed";
    modalMessage.innerHTML = "Failed to delete order. Please try again.";
    modalActions.innerHTML = '';
    
    const okButton = document.createElement('button');
    okButton.className = 'action-button';
    okButton.textContent = "OK";
    modalActions.appendChild(okButton);
    
    modal.style.display = 'block';
    
    okButton.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }
}

// Authentication state observer
onAuthStateChanged(auth, async (user) => {
  if (!userOptionDiv) return; // if navbar not present, do nothing

  if (user) {
    // User is signed in
    const uid = user.uid;
    const userDocRef = doc(db, "users", uid);

    // Load the user's orders
    loadUserOrders(uid);

    try {
      const docSnap = await getDoc(userDocRef);
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

      document.getElementById('logoutBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          await signOut(auth);
          location.reload();
        } catch (error) {
          await errorModal("Logout Failed", error.message);
        }
      });
    } catch (error) {
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

      document.getElementById('logoutBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          await signOut(auth);
          location.reload();
        } catch (error) {
          await errorModal("Logout Failed", error.message);
        }
      });
    }
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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Nothing specific to initialize here
});