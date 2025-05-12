import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { checkAdminAuth, initAdminName } from "./admin_auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC5n40vPlIjXQ25X4NJlr8Z2jRGux0C1Y8",
  authDomain: "grindon-da126.firebaseapp.com",
  projectId: "grindon-da126",
  storageBucket: "grindon-da126.appspot.com",
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
    
    // Set up message modal functionality
    setupMessageModal();
    
    // Set up notification modal functionality
    setupNotificationModal();
    
    // Set up filter buttons
    setupFilterButtons();
    
    // Add loading state to the table before fetching messages
    showTableLoadingState();
    
    // Fetch messages and update counter
    await fetchMessages();
    await updateUnreadMessagesCounter();
  } catch (error) {
    console.error("Error initializing page:", error);
    showNotification("Error", "Failed to initialize page: " + error.message, "error");
  }
});

// Set up filter buttons
function setupFilterButtons() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', async () => {
      // Set active class
      document.querySelector('.filter-btn.active').classList.remove('active');
      button.classList.add('active');
      
      // Add loading state
      showTableLoadingState();
      
      // Fetch messages with filter
      await fetchMessages(button.dataset.filter);
    });
  });
}

// Show loading state for the table
function showTableLoadingState() {
  const messagesTableBody = document.querySelector("#messagesTable tbody");
  
  // Clear existing content
  messagesTableBody.innerHTML = "";
  
  // Create 5 loading placeholder rows
  for (let i = 0; i < 5; i++) {
    const loadingRow = document.createElement('tr');
    loadingRow.className = 'loading-row';
    
    // Create 7 columns (matching our table structure)
    for (let j = 0; j < 7; j++) {
      const cell = document.createElement('td');
      const placeholder = document.createElement('div');
      placeholder.className = 'loading-placeholder';
      
      // Make some columns wider than others for visual variety
      if (j === 4) { // Message column
        placeholder.style.width = '90%';
      } else if (j === 1 || j === 2) { // Name and Email columns
        placeholder.style.width = '80%';
      } else {
        placeholder.style.width = '60%';
      }
      
      cell.appendChild(placeholder);
      loadingRow.appendChild(cell);
    }
    
    messagesTableBody.appendChild(loadingRow);
  }
}

// Set up message modal
function setupMessageModal() {
  const modal = document.getElementById('messageModal');
  const closeButton = document.querySelector('.close-message');
  
  // Close modal when clicking X button
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }
  
  // Close modal when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
  
  // Close button functionality
  document.getElementById('closeMessage').addEventListener('click', () => {
    modal.style.display = 'none';
  });
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

// Show notification modal
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
    showNotification("Error", "Failed to sign out: " + error.message, "error");
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

// Format date
function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Pagination state
let currentPage = 1;
const itemsPerPage = 10;
let totalMessages = 0;

// Fetch messages from Firestore
async function fetchMessages(filter = 'all') {
  const messagesTableBody = document.querySelector("#messagesTable tbody");
  
  try {
    const messagesRef = collection(db, "messages");
    let q = query(messagesRef, orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    
    // Create new table content with a hidden class
    const tableContent = document.createElement('tbody');
    tableContent.className = 'new-table-content';
    tableContent.style.opacity = '0';
    
    if (querySnapshot.empty) {
      tableContent.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center;">No messages found</td>
        </tr>
      `;
    } else {
      let filteredMessages = [];
      
      querySnapshot.forEach((doc) => {
        const message = doc.data();
        
        // Apply filter
        if (filter === 'all' || message.status === filter) {
          filteredMessages.push({ id: doc.id, ...message });
        }
      });
      
      totalMessages = filteredMessages.length;

      if (filteredMessages.length === 0) {
        tableContent.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center;">No ${filter} messages found</td>
          </tr>
        `;
      } else {
        // Calculate pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedMessages = filteredMessages.slice(startIndex, endIndex);

        paginatedMessages.forEach((message) => {
          const row = `
            <tr>
              <td>${formatDate(message.timestamp)}</td>
              <td>${message.name || 'N/A'}</td>
              <td>${message.email || 'N/A'}</td>
              <td>${message.phone || 'N/A'}</td>
              <td>
                <div class="message-preview">
                  ${message.status === 'unread' ? '<span class="unread-indicator"></span>' : ''}
                  ${message.message || 'No message content'}
                </div>
              </td>
              <td><span class="status-badge status-${message.status}">${message.status}</span></td>
              <td>
                <button class="action-btn view-btn" data-id="${message.id}">
                  <i class="fas fa-eye"></i> View
                </button>
              </td>
            </tr>
          `;
          tableContent.innerHTML += row;
        });

        // Add pagination controls
        updatePaginationControls();
      }
    }
    
    // Add a small delay to simulate loading and make the transition noticeable
    setTimeout(() => {
      // Replace the old table body with the new one
      const table = document.getElementById('messagesTable');
      const oldTbody = table.querySelector('tbody');
      table.replaceChild(tableContent, oldTbody);
      
      // Apply a fade-in transition to the new content
      setTimeout(() => {
        tableContent.style.transition = 'opacity 0.6s ease';
        tableContent.style.opacity = '1';
        
        // Add event listeners for view buttons
        document.querySelectorAll(".view-btn").forEach((button) => {
          button.addEventListener("click", () => viewMessage(button.dataset.id));
        });
      }, 50);
    }, 800);
    
  } catch (error) {
    console.error("Error fetching messages: ", error);
    messagesTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center;">Error loading messages: ${error.message}</td>
      </tr>
    `;
    showNotification("Error", "Failed to load messages: " + error.message, "error");
  }
}

// Update pagination controls
function updatePaginationControls() {
  const totalPages = Math.ceil(totalMessages / itemsPerPage);
  
  // Create pagination container if it doesn't exist
  let paginationContainer = document.querySelector('.pagination-container');
  if (!paginationContainer) {
    paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination-container';
    document.querySelector('.messages-section').appendChild(paginationContainer);
  }
  
  // Generate pagination HTML
  let paginationHTML = `
    <div class="pagination">
      <button class="pagination-btn" id="prevPage" ${currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-chevron-left"></i>
      </button>
      
      <div class="page-numbers">
        ${generatePageNumbers(currentPage, totalPages)}
      </div>
      
      <button class="pagination-btn" id="nextPage" ${currentPage === totalPages ? 'disabled' : ''}>
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
    <div class="pagination-info">
      Showing ${((currentPage - 1) * itemsPerPage) + 1} to ${Math.min(currentPage * itemsPerPage, totalMessages)} of ${totalMessages} messages
    </div>
  `;
  
  paginationContainer.innerHTML = paginationHTML;
  
  // Add event listeners
  document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      showTableLoadingState();
      fetchMessages(document.querySelector('.filter-btn.active').dataset.filter);
    }
  });
  
  document.getElementById('nextPage').addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      showTableLoadingState();
      fetchMessages(document.querySelector('.filter-btn.active').dataset.filter);
    }
  });
  
  // Add event listeners for page numbers
  document.querySelectorAll('.page-number').forEach(button => {
    button.addEventListener('click', () => {
      const page = parseInt(button.dataset.page);
      if (page !== currentPage) {
        currentPage = page;
        showTableLoadingState();
        fetchMessages(document.querySelector('.filter-btn.active').dataset.filter);
      }
    });
  });
}

// Generate page numbers with ellipsis
function generatePageNumbers(currentPage, totalPages) {
  let pages = [];
  const maxVisiblePages = 5;
  
  if (totalPages <= maxVisiblePages) {
    // Show all pages if total pages is less than max visible
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);
    
    // Calculate start and end of visible pages
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);
    
    // Adjust if at the start
    if (currentPage <= 2) {
      end = 4;
    }
    // Adjust if at the end
    if (currentPage >= totalPages - 1) {
      start = totalPages - 3;
    }
    
    // Add ellipsis and middle pages
    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < totalPages - 1) pages.push('...');
    
    // Always show last page
    pages.push(totalPages);
  }
  
  return pages.map(page => {
    if (page === '...') {
      return '<span class="ellipsis">...</span>';
    }
    return `
      <button class="page-number ${page === currentPage ? 'active' : ''}" 
              data-page="${page}">${page}</button>
    `;
  }).join('');
}

// View message details
async function viewMessage(messageId) {
  try {
    const messageRef = doc(db, "messages", messageId);
    const messageSnap = await getDoc(messageRef);
    
    if (!messageSnap.exists()) {
      showNotification("Error", "Message not found!", "error");
      return;
    }
    
    const message = messageSnap.data();
    
    // Update modal content
    document.getElementById('messageTitle').textContent = `Message from ${message.name || 'Unknown'}`;
    document.getElementById('messageDate').textContent = formatDate(message.timestamp);
    document.getElementById('messageName').textContent = message.name || 'N/A';
    document.getElementById('messageEmail').textContent = message.email || 'N/A';
    document.getElementById('messagePhone').textContent = message.phone || 'N/A';
    document.getElementById('messageText').textContent = message.message || 'No message content';
    
    // Show modal
    const modal = document.getElementById('messageModal');
    modal.style.display = 'flex';
    
    // Set up mark as read button
    const markAsReadBtn = document.getElementById('markAsRead');
    if (message.status === 'unread') {
      markAsReadBtn.style.display = 'block';
      markAsReadBtn.onclick = async () => {
        try {
          await updateDoc(messageRef, { status: 'read' });
          showNotification("Success", "Message marked as read", "success");
          modal.style.display = 'none';
          
          // Get current active filter and refresh the table
          const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
          await fetchMessages(activeFilter);
          await updateUnreadMessagesCounter(); // Update the counter
        } catch (error) {
          console.error("Error marking message as read:", error);
          showNotification("Error", "Failed to mark message as read", "error");
        }
      };
    } else {
      markAsReadBtn.style.display = 'none';
    }
    
  } catch (error) {
    console.error("Error viewing message:", error);
    showNotification("Error", "Failed to view message: " + error.message, "error");
  }
}

// Update unread messages counter
async function updateUnreadMessagesCounter() {
  try {
    const messagesRef = collection(db, "messages");
    const querySnapshot = await getDocs(messagesRef);
    
    let unreadCount = 0;
    querySnapshot.forEach((doc) => {
      const message = doc.data();
      if (message.status === 'unread') {
        unreadCount++;
      }
    });
    
    // Update counter in sidebar
    const counter = document.getElementById('unreadMessagesCounter');
    if (counter) {
      counter.textContent = unreadCount > 0 ? unreadCount : '';
    }
  } catch (error) {
    console.error("Error updating unread messages counter:", error);
  }
}