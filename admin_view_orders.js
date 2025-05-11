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
    
    // Set up receipt modal functionality
    setupReceiptModal();
    
    // Set up notification modal functionality
    setupNotificationModal();
    
    // Set up confirmation modal functionality
    setupConfirmationModal();
    
    // Add loading state to the table before fetching orders
    showTableLoadingState();
    
    // Fetch orders and update counter
    await fetchPendingOrders();
    await updatePendingOrdersCounter();
  } catch (error) {
    console.error("Error initializing page:", error);
    showNotification("Error", "Failed to initialize page: " + error.message, "error");
  }
});

// Set up confirmation modal
function setupConfirmationModal() {
  // Close button functionality
  document.querySelector('.close-confirmation').addEventListener('click', () => {
    document.getElementById('confirmationModal').style.display = 'none';
  });
  
  // Close on background click
  document.getElementById('confirmationModal').addEventListener('click', (event) => {
    if (event.target === document.getElementById('confirmationModal')) {
      document.getElementById('confirmationModal').style.display = 'none';
    }
  });
  
  // Default button actions (will be overridden in showConfirmation)
  document.getElementById('confirmNo').addEventListener('click', () => {
    document.getElementById('confirmationModal').style.display = 'none';
  });
}

// Show loading state for the table
function showTableLoadingState() {
  const ordersTableBody = document.querySelector("#ordersTable tbody");
  
  // Clear existing content
  ordersTableBody.innerHTML = "";
  
  // Create 5 loading placeholder rows
  for (let i = 0; i < 5; i++) {
    const loadingRow = document.createElement('tr');
    loadingRow.className = 'loading-row';
    
    // Create 9 columns (matching our table structure)
    for (let j = 0; j < 9; j++) {
      const cell = document.createElement('td');
      const placeholder = document.createElement('div');
      placeholder.className = 'loading-placeholder';
      
      // Make some columns wider than others for visual variety
      if (j === 1 || j === 2) {
        placeholder.style.width = '80%';
      } else if (j === 8) {
        placeholder.style.width = '90%';
      } else {
        placeholder.style.width = '60%';
      }
      
      cell.appendChild(placeholder);
      loadingRow.appendChild(cell);
    }
    
    ordersTableBody.appendChild(loadingRow);
  }
}

// Set up notification modal
function setupNotificationModal() {
  // Close button functionality
  document.querySelectorAll('.close-notification').forEach(button => {
    button.addEventListener('click', () => {
      document.getElementById('notificationModal').style.display = 'none';
    });
  });
  
  // Close on background click
  window.addEventListener('click', (event) => {
    const modal = document.getElementById('notificationModal');
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
  
  // Close on confirmation button click
  document.getElementById('confirmNotification').addEventListener('click', () => {
    document.getElementById('notificationModal').style.display = 'none';
  });
}

// Show notification modal with custom title, message and type (success, error, warning)
function showNotification(title, message, type = "info") {
  const modal = document.getElementById('notificationModal');
  const modalTitle = document.getElementById('notificationTitle');
  const modalMessage = document.getElementById('notificationMessage');
  const modalIcon = document.getElementById('notificationIcon');
  const modalContent = document.querySelector('.notification-modal-content');
  
  // Set content
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  
  // Reset classes
  modalContent.className = 'notification-modal-content';
  modalIcon.className = '';
  
  // Set type-specific styles
  if (type === "success") {
    modalContent.classList.add('success');
    modalIcon.className = 'fas fa-check-circle';
  } else if (type === "error") {
    modalContent.classList.add('error');
    modalIcon.className = 'fas fa-exclamation-circle';
  } else if (type === "warning") {
    modalContent.classList.add('warning');
    modalIcon.className = 'fas fa-exclamation-triangle';
  } else {
    modalContent.classList.add('info');
    modalIcon.className = 'fas fa-info-circle';
  }
  
  // Show modal with animation
  modal.style.display = 'flex';
  setTimeout(() => {
    modalContent.classList.add('show');
  }, 10);
}

// Show confirmation modal
function showConfirmation(title, message, onConfirm) {
  const modal = document.getElementById('confirmationModal');
  const modalTitle = document.getElementById('confirmationTitle');
  const modalMessage = document.getElementById('confirmationMessage');
  const modalContent = document.querySelector('.confirmation-modal-content');
  
  // Set content
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  
  // Show modal with animation
  modal.style.display = 'flex';
  setTimeout(() => {
    modalContent.classList.add('show');
  }, 10);
  
  // Set up confirm button
  const confirmBtn = document.getElementById('confirmYes');
  const cancelBtn = document.getElementById('confirmNo');
  
  // Remove existing event listeners
  const newConfirmBtn = confirmBtn.cloneNode(true);
  const newCancelBtn = cancelBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
  
  // Add new event listeners
  newConfirmBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    if (typeof onConfirm === 'function') {
      onConfirm();
    }
  });
  
  newCancelBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });
}

// Set up receipt modal functionality
function setupReceiptModal() {
  const modal = document.getElementById('receiptModal');
  const closeButton = document.querySelector('.close-modal');
  
  // Close modal when clicking X button
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }
  
  // Close modal when clicking outside the image
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
}

// Open receipt modal with image
function openReceiptModal(imageUrl) {
  const modal = document.getElementById('receiptModal');
  const fullImage = document.getElementById('fullReceiptImage');
  
  fullImage.src = imageUrl;
  modal.style.display = 'flex';
}

// Handle logout
function handleLogout(e) {
  e.preventDefault();
  
  showConfirmation("Confirm Logout", "Are you sure you want to log out?", () => {
    signOut(auth).then(() => {
      // Sign-out successful
      console.log("User signed out");
      localStorage.removeItem('adminName');
      window.location.href = "admin_login.html";
    }).catch((error) => {
      // An error happened
      console.error("Error signing out:", error);
      showNotification("Error", "Failed to sign out: " + error.message, "error");
    });
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
  
  try {
    const ordersRef = collection(db, "orders");
    
    // Get all orders first so we can filter them properly
    const querySnapshot = await getDocs(ordersRef);

    console.log(`Total orders found: ${querySnapshot.size}`);
    
    // Create new table content with a hidden class
    const tableContent = document.createElement('tbody');
    tableContent.className = 'new-table-content';
    tableContent.style.opacity = '0';
    
    let pendingOrdersFound = false;

    if (querySnapshot.empty) {
      tableContent.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center;">No orders found</td>
        </tr>
      `;
    } else {
      querySnapshot.forEach((doc) => {
        const order = doc.data();
        
        // Case-insensitive check for "pending" status
        // This ensures we match "pending", "Pending", "PENDING", etc.
        if (order.status && order.status.toLowerCase() === "pending") {
          pendingOrdersFound = true;
          const totalQuantity = order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
          
          // Handle payment proof/receipt
          let receiptCell;
          if (order.paymentMethod && order.paymentMethod.toLowerCase() !== 'cod') {
            // Check for payment proof URL (from either field)
            const receiptUrl = order.paymentProofUrl || order.bankProofUrl || '';
            
            if (receiptUrl) {
              receiptCell = `
                <img src="${receiptUrl}" alt="Payment Receipt" class="receipt-thumbnail" 
                  onclick="openReceiptModal('${receiptUrl}')" data-receipt-url="${receiptUrl}">
              `;
            } else {
              receiptCell = `<span class="no-receipt">No receipt uploaded</span>`;
            }
          } else {
            receiptCell = `<span class="no-receipt">Cash on Delivery</span>`;
          }
          
          // Log for debugging
          console.log(`Found pending order: ${doc.id}`, order);
          
          const row = `
            <tr>
              <td>${doc.id}</td>
              <td>${order.items.map(item => item.name).join(", ")}</td>
              <td>${order.firstName || ''} ${order.lastName || ''}</td>
              <td>${totalQuantity}</td>
              <td>₱${order.total ? order.total.toFixed(2) : '0.00'}</td>
              <td>${order.paymentMethod || 'N/A'}</td>
              <td>${receiptCell}</td>
              <td><span class="status-badge status-pending">${order.status}</span></td>
              <td>
                <button class="action-btn ship-btn" data-id="${doc.id}"><i class="fas fa-shipping-fast"></i> Ship Order</button>
                <button class="action-btn decline-btn" data-id="${doc.id}"><i class="fas fa-times-circle"></i> Decline</button>
              </td>
            </tr>
          `;
          tableContent.innerHTML += row;
        }
      });

      if (!pendingOrdersFound) {
        tableContent.innerHTML = `
          <tr>
            <td colspan="9" style="text-align: center;">No pending orders found</td>
          </tr>
        `;
      }
    }
    
    // Add a small delay to simulate loading and make the transition noticeable
    setTimeout(() => {
      // Replace the old table body with the new one
      const table = document.getElementById('ordersTable');
      const oldTbody = table.querySelector('tbody');
      table.replaceChild(tableContent, oldTbody);
      
      // Apply a fade-in transition to the new content
      setTimeout(() => {
        tableContent.style.transition = 'opacity 0.6s ease';
        tableContent.style.opacity = '1';
        
        // Add event listeners for ship and decline buttons
        document.querySelectorAll(".ship-btn").forEach((button) => {
          button.addEventListener("click", () => fulfillOrder(button.dataset.id));
        });

        document.querySelectorAll(".decline-btn").forEach((button) => {
          button.addEventListener("click", () => declineOrder(button.dataset.id));
        });
        
        // Add event listeners for receipt thumbnails
        document.querySelectorAll(".receipt-thumbnail").forEach((img) => {
          img.addEventListener("click", function() {
            const receiptUrl = this.getAttribute("data-receipt-url");
            openReceiptModal(receiptUrl);
          });
        });
      }, 50);
    }, 800); // Simulate loading delay
    
  } catch (error) {
    console.error("Error fetching orders: ", error);
    ordersTableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center;">Error loading orders: ${error.message}</td>
      </tr>
    `;
    showNotification("Error", "Failed to load orders: " + error.message, "error");
  }
}

// Make the openReceiptModal function globally available
window.openReceiptModal = openReceiptModal;

// Update pending orders counter
async function updatePendingOrdersCounter() {
  try {
    const ordersRef = collection(db, "orders");
    const querySnapshot = await getDocs(ordersRef);
    
    let pendingCount = 0;
    querySnapshot.forEach((doc) => {
      const order = doc.data();
      if (order.status && order.status.toLowerCase() === "pending") {
        pendingCount++;
      }
    });
    
    // Update counter in sidebar
    const counter = document.getElementById('pendingOrdersCounter');
    if (counter) {
      counter.textContent = pendingCount > 0 ? pendingCount : '';
    }
  } catch (error) {
    console.error("Error updating pending orders counter:", error);
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
      showNotification("Error", "Order not found!", "error");
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
        showNotification("Error", `Product ${productId} not found`, "error");
        continue;
      }
      
      const productData = productSnap.data();
      console.log("Product data:", productData);
      
      // Check if variations exist
      if (!productData.variations) {
        console.error(`Product ${productId} has no variations`);
        showNotification("Error", `Product ${productId} has no variations`, "error");
        continue;
      }
      
      // Check if this color exists in variations
      if (!productData.variations[color]) {
        console.error(`Color "${color}" not found in variations`);
        showNotification("Error", `Color "${color}" not found in product variations`, "error");
        continue;
      }
      
      // Check if this size exists for this color
      if (productData.variations[color][size] === undefined) {
        // Try with first letter capitalized
        size = size.charAt(0).toUpperCase() + size.slice(1);
        console.log(`Trying with capitalized size: ${size}`);
        
        if (productData.variations[color][size] === undefined) {
          console.error(`Size "${size}" not found for color "${color}"`);
          showNotification("Error", `Size "${size}" not found for color "${color}"`, "error");
          continue;
        }
      }
      
      const currentStock = productData.variations[color][size];
      console.log("Current stock for", color, size, ":", currentStock);
      
      if (currentStock < quantity) {
        console.error(`Not enough stock. Need: ${quantity}, Have: ${currentStock}`);
        showNotification("Warning", `Not enough stock for ${item.name}. Need: ${quantity}, Have: ${currentStock}`, "warning");
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
    
    showNotification("Success", "Order shipped and stock updated successfully!", "success");
    
    // Show loading state before refreshing the table
    showTableLoadingState();
    await fetchPendingOrders(); // Refresh the table
    await updatePendingOrdersCounter(); // Update the counter
  } catch (error) {
    console.error("Error fulfilling order:", error);
    showNotification("Error", `Failed to ship the order: ${error.message}`, "error");
  }
}

// Decline an order
async function declineOrder(orderId) {
  showConfirmation("Confirm Decline", "Are you sure you want to decline this order?", async () => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: "Declined" });
      showNotification("Success", "Order declined successfully!", "success");
      
      // Show loading state before refreshing the table
      showTableLoadingState();
      await fetchPendingOrders(); // Refresh the table
      await updatePendingOrdersCounter(); // Update the counter
    } catch (error) {
      console.error("Error declining order: ", error);
      showNotification("Error", "Failed to decline the order: " + error.message, "error");
    }
  });
}