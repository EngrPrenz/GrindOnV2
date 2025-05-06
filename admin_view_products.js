import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase Config
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
const auth = getAuth(app);
const db = getFirestore(app);

// Debug flag - set to true to see detailed logging
const DEBUG = true;

// Log function that only outputs when debug is enabled
function logDebug(message, data = null) {
  if (DEBUG) {
    if (data) {
      console.log(`[DEBUG] ${message}:`, data);
    } else {
      console.log(`[DEBUG] ${message}`);
    }
  }
}

// Elements
const productsGrid = document.getElementById('productsGrid');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const sortOptions = document.getElementById('sortOptions');
const adminNameElement = document.getElementById('adminName');

// Pagination config
const PRODUCTS_PER_PAGE = 4; // 2x2 grid
let currentPage = 1;
let totalPages = 1;
let allProducts = [];
let filteredProducts = [];
let isLoading = false;

// Initialize the page when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  logDebug('DOM fully loaded');
  displayAdminName();
  checkAuth();
});


// Add this near the top of your event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Add logout functionality
  const logoutBtn = document.querySelector('.logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      handleLogout();
    });
  }
});

// Add this function to handle logout
function handleLogout() {
  logDebug('Logout initiated');
  
  const auth = getAuth();
  signOut(auth).then(() => {
    // Sign-out successful
    logDebug("User signed out");
    localStorage.removeItem('adminName');
    
    // Disable any page transition effects
    const pageTransitionOverlay = document.getElementById('pageTransitionOverlay');
    if (pageTransitionOverlay) {
      pageTransitionOverlay.style.display = 'none';
    }
    
    // Direct redirect without transition
    window.location.href = "admin_login.html";
  }).catch((error) => {
    // An error happened
    logDebug("Error signing out:", error);
    console.error("Error signing out:", error);
    openModal("Error signing out: " + error.message);
  });
}

// Display admin name from localStorage if available
function displayAdminName() {
  const storedName = localStorage.getItem('adminName');
  logDebug('Stored admin name', storedName);
  
  if (adminNameElement && storedName) {
    adminNameElement.textContent = storedName;
    logDebug('Admin name set in UI');
  } else if (adminNameElement) {
    adminNameElement.textContent = 'Admin'; // Default fallback
    logDebug('Default admin name set');
  }
}

// Check authentication status
function checkAuth() {
  logDebug('Checking authentication');
  showLoading('Verifying authentication...');
  
  // Define admin emails
  const ADMIN_EMAILS = ["admin@gmail.com"];
  
  onAuthStateChanged(auth, (user) => {
    if (user) {
      logDebug('User is authenticated', user.uid);
      
      // Check if user's email is in the admin list
      if (ADMIN_EMAILS.includes(user.email.toLowerCase())) {
        logDebug('User confirmed as admin by email');
        
        // Store admin info from email
        const adminName = user.email.split('@')[0]; // Extract name from email
        localStorage.setItem('adminEmail', user.email);
        localStorage.setItem('adminRole', 'admin');
        localStorage.setItem('adminName', adminName);
        
        if (adminNameElement) {
          adminNameElement.textContent = adminName;
        }
        logDebug('Admin info stored and displayed', adminName);
        
        // Load products
        loadProducts();
        hideLoading();
      } else {
        logDebug('User email not in admin list', user.email);
        openModal("Access denied: You do not have admin privileges");
        auth.signOut().then(() => {
          window.location.href = "admin_login.html";
        });
      }
    } else {
      logDebug('No user is signed in');
      hideLoading();
      window.location.href = "admin_login.html";
    }
  });
}
// Show loading animation with optional message
function showLoading(message = 'Loading products...') {
  isLoading = true;
  logDebug('Showing loading animation', message);
  
  if (productsGrid) {
    productsGrid.innerHTML = `
      <div class="loading-animation">
        <i class="fas fa-spinner fa-spin"></i>
        <p>${message}</p>
      </div>
    `;
  }
  
  // Disable pagination buttons
  if (pagination) {
    const buttons = pagination.querySelectorAll('.page-button');
    buttons.forEach(button => {
      button.disabled = true;
      button.classList.add('loading');
    });
  }
}

// Hide loading animation
function hideLoading() {
  isLoading = false;
  logDebug('Hiding loading animation');
  
  // Re-enable pagination buttons
  if (pagination) {
    const buttons = pagination.querySelectorAll('.page-button');
    buttons.forEach(button => {
      button.disabled = false;
      button.classList.remove('loading');
    });
  }
}

// Load products from Firestore
async function loadProducts() {
  logDebug('Loading products');
  showLoading('Fetching products from database...');
  
  try {
    const productsRef = collection(db, "products");
    logDebug('Products collection reference created');
    
    const querySnapshot = await getDocs(productsRef);
    logDebug('Products query executed', `Retrieved ${querySnapshot.size} products`);
    
    // Clear products array
    allProducts = [];
    
    // Populate products array
    querySnapshot.forEach((doc) => {
      const productData = doc.data();
      allProducts.push({
        id: doc.id,
        ...productData
      });
      logDebug('Added product', { id: doc.id, name: productData.name });
    });
    
    logDebug('All products loaded', allProducts.length);
    
    // Set initial filtered products
    filteredProducts = [...allProducts];
    
    // Set total pages
    totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
    logDebug('Pagination calculated', { total: totalPages, perPage: PRODUCTS_PER_PAGE });
    
    // Render products and pagination
    renderProducts();
    renderPagination();
    
    hideLoading();
    
  } catch (error) {
    logDebug('Error loading products', error);
    console.error("Error loading products:", error);
    
    if (productsGrid) {
      productsGrid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-circle"></i>
          <p>Error loading products</p>
          <p class="error-details">${error.message}</p>
          <button id="retryButton" class="retry-button">
            <i class="fas fa-sync"></i> Retry
          </button>
        </div>
      `;
      
      // Add retry button functionality
      const retryButton = document.getElementById('retryButton');
      if (retryButton) {
        retryButton.addEventListener('click', loadProducts);
      }
    }
    
    hideLoading();
  }
}

// Render products for current page
function renderProducts() {
  if (!productsGrid) {
    logDebug('Products grid element not found');
    return;
  }
  
  logDebug('Rendering products for page', currentPage);
  
  // Start and end index for current page
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  
  // Get products for current page
  const productsToShow = filteredProducts.slice(startIndex, endIndex);
  logDebug('Products to display', productsToShow.length);
  
  // Clear products grid
  productsGrid.innerHTML = '';
  
  // Check if there are products
  if (productsToShow.length === 0) {
    logDebug('No products to display');
    productsGrid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-box-open"></i>
        <p>No products found</p>
        <a href="add_products.html" class="add-product-btn">
          <i class="fas fa-plus"></i> Add New Product
        </a>
      </div>
    `;
    return;
  }
  
  // Loop through products and create cards
  productsToShow.forEach(product => {
    logDebug('Creating card for product', { id: product.id, name: product.name });
    
    // Determine stock status
    let stockStatus = '';
    let stockClass = '';
    
    if (product.variations) {
      const totalStock = calculateTotalStock(product.variations);
      
      if (totalStock > 10) {
        stockStatus = 'In Stock';
        stockClass = 'status-in-stock';
      } else if (totalStock > 0) {
        stockStatus = 'Low Stock';
        stockClass = 'status-low-stock';
      } else {
        stockStatus = 'Out of Stock';
        stockClass = 'status-out-of-stock';
      }
    }
    
    // Get image URL
    const imageUrl = product.imageUrls?.[0] || product.imageUrl || 'images/placeholder-product.jpg';
    
    // Create product card HTML
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.innerHTML = `
      <div class="product-image">
        <img src="${imageUrl}" alt="${product.name}" onerror="this.src='images/placeholder-product.jpg';">
        <div class="product-status ${stockClass}">${stockStatus}</div>
      </div>
      <div class="product-details">
        <h3 class="product-title">${product.name}</h3>
        <div class="product-category">${product.category || ''}</div>
        <div class="product-price">₱${(parseFloat(product.price) || 0).toFixed(2)}</div>
        <div class="product-actions">
          <button class="action-button edit-btn" data-id="${product.id}">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="action-button delete-btn" data-id="${product.id}">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    `;
    
    // Add event listeners for buttons
    productCard.querySelector('.edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      logDebug('Edit button clicked for product', product.id);
      window.location.href = `admin_edit_product.html?id=${product.id}`;
    });
    
    productCard.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      logDebug('Delete button clicked for product', product.id);
      confirmDeleteProduct(product.id, product.name);
    });
    
    productsGrid.appendChild(productCard);
  });
  
  logDebug('Products rendered successfully');
}

// Calculate total stock from variations
function calculateTotalStock(variations) {
  let totalStock = 0;
  
  for (const color in variations) {
    const sizes = variations[color];
    for (const size in sizes) {
      totalStock += parseInt(sizes[size]) || 0;
    }
  }
  
  return totalStock;
}

// Render pagination buttons
function renderPagination() {
  if (!pagination) {
    logDebug('Pagination element not found');
    return;
  }
  
  logDebug('Rendering pagination', { currentPage, totalPages });
  
  // Clear pagination
  pagination.innerHTML = '';
  
  // Don't show pagination if there's only one page
  if (totalPages <= 1) {
    logDebug('No pagination needed (only one page)');
    return;
  }
  
  // Create previous button
  const prevButton = document.createElement('button');
  prevButton.className = `page-button prev ${currentPage === 1 ? 'disabled' : ''}`;
  prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener('click', () => {
    if (currentPage > 1 && !isLoading) {
      logDebug('Previous page button clicked');
      goToPage(currentPage - 1);
    }
  });
  pagination.appendChild(prevButton);
  
  // Create page buttons
  const maxButtons = 5;
  const startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  const endPage = Math.min(totalPages, startPage + maxButtons - 1);
  
  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement('button');
    pageButton.className = `page-button ${i === currentPage ? 'active' : ''}`;
    pageButton.textContent = i;
    pageButton.addEventListener('click', () => {
      if (i !== currentPage && !isLoading) {
        logDebug('Page button clicked', i);
        goToPage(i);
      }
    });
    pagination.appendChild(pageButton);
  }
  
  // Create next button
  const nextButton = document.createElement('button');
  nextButton.className = `page-button next ${currentPage === totalPages ? 'disabled' : ''}`;
  nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener('click', () => {
    if (currentPage < totalPages && !isLoading) {
      logDebug('Next page button clicked');
      goToPage(currentPage + 1);
    }
  });
  pagination.appendChild(nextButton);
  
  logDebug('Pagination rendered successfully');
}

// Navigate to a specific page
function goToPage(page) {
  if (page < 1 || page > totalPages || page === currentPage || isLoading) return;
  
  logDebug('Navigating to page', page);
  showLoading(`Loading page ${page}...`);
  
  // Use setTimeout to show the loading animation
  setTimeout(() => {
    currentPage = page;
    renderProducts();
    renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    hideLoading();
  }, 300);
}

// Filter and search products
function filterProducts() {
  if (isLoading) return;
  
  logDebug('Filtering products');
  showLoading('Filtering products...');
  
  // Use setTimeout to show the loading animation
  setTimeout(() => {
    const searchTerm = searchInput.value.toLowerCase();
    logDebug('Search term', searchTerm);
    
    filteredProducts = allProducts.filter(product => {
      // Search term filter
      return product.name.toLowerCase().includes(searchTerm) || 
             (product.description && product.description.toLowerCase().includes(searchTerm));
    });
    
    logDebug('Filtered products count', filteredProducts.length);
    
    // Apply sorting
    sortProducts();
    
    // Reset to first page and update UI
    currentPage = 1;
    totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
    renderProducts();
    renderPagination();
    hideLoading();
  }, 300);
}

// Sort products based on selected option
function sortProducts() {
  const sortOption = sortOptions ? sortOptions.value : 'all';
  logDebug('Sorting products by', sortOption);
  
  switch (sortOption) {
    case 'all':
      // Default sorting or no specific sort for "All Products"
      filteredProducts = [...allProducts]; // Reset to original order
      break;
    case 'newest':
      filteredProducts.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : 0;
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : 0;
        return dateB - dateA;
      });
      break;
    case 'price-low':
      filteredProducts.sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));
      break;
    case 'price-high':
      filteredProducts.sort((a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0));
      break;
    case 'name-asc':
      filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      // Default sorting (newest first)
      filteredProducts.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : 0;
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : 0;
        return dateB - dateA;
      });
  }
  
  logDebug('Products sorted');
}

// Replace the confirmDeleteProduct function with this simplified version
function confirmDeleteProduct(productId, productName) {
  if (isLoading) return;
  
  logDebug('Opening delete modal for product', { id: productId, name: productName });
  
  // Find product details
  const product = allProducts.find(p => p.id === productId);
  if (!product) {
    logDebug('Product not found for deletion', productId);
    return;
  }
  
  // Get the existing modal from HTML
  const modal = document.getElementById('deleteModal');
  if (!modal) {
    logDebug('Delete modal not found in the document');
    openModal('Could not open delete dialog');
    return;
  }
  
  // Set product details in modal
  document.getElementById('deleteProductName').textContent = product.name;
  
  const imageElement = document.getElementById('deleteProductImage');
  const imageUrl = product.imageUrls?.[0] || product.imageUrl || 'images/placeholder-product.jpg';
  imageElement.src = imageUrl;
  imageElement.onerror = function() {
    this.src = 'images/placeholder-product.jpg';
  };
  
  document.getElementById('deleteProductPrice').textContent = `₱${(parseFloat(product.price) || 0).toFixed(2)}`;
  document.getElementById('deleteProductCategory').textContent = product.category || 'No Category';
  
  // Setup modal event listeners (only once)
  if (!modal.hasListenersSetup) {
    setupModalEventListeners(modal);
    modal.hasListenersSetup = true;
  }
  
  // Set click handler for confirm button
  const confirmButton = document.getElementById('confirmDelete');
  if (confirmButton) {
    // Remove existing event listeners (prevent duplicates)
    const newConfirmButton = confirmButton.cloneNode(true);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
    
    // Add new event listener
    newConfirmButton.addEventListener('click', () => {
      closeModal(modal);
      deleteProduct(productId);
    });
  }
  
  // Open modal
  modal.style.display = 'block';
}

// Simplified setup modal event listeners function
function setupModalEventListeners(modal) {
  logDebug('Setting up modal event listeners');
  
  // Close modal when clicking on X
  const closeButton = modal.querySelector('.close-modal');
  if (closeButton) {
    closeButton.addEventListener('click', () => closeModal(modal));
  }
  
  // Close modal when clicking on Cancel button
  const cancelButton = modal.querySelector('#cancelDelete');
  if (cancelButton) {
    cancelButton.addEventListener('click', () => closeModal(modal));
  }
  
  // Close modal when clicking outside of it
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal(modal);
    }
  });
  
  // Close modal when pressing Escape key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.style.display === 'block') {
      closeModal(modal);
    }
  });
}

// Close modal function
function closeModal(modal) {
  logDebug('Closing delete modal');
  
  // Add fade-out animation
  modal.style.opacity = '0';
  setTimeout(() => {
    modal.style.display = 'none';
    modal.style.opacity = '1'; // Reset opacity for next use
  }, 300);
}

// Add these functions to admin_view_products.js

// Show success modal with message
function showSuccessModal(message = 'Product deleted successfully') {
  logDebug('Showing success modal', message);
  
  const successModal = document.getElementById('successModal');
  const successMessage = document.getElementById('successMessage');
  
  if (!successModal || !successMessage) {
    logDebug('Success modal elements not found, falling back to alert');
    alert(message);
    return;
  }
  
  // Set the message
  successMessage.textContent = message;
  
  // Show the modal
  successModal.style.display = 'block';
  
  // Setup event listeners if not already set
  if (!successModal.hasListenersSetup) {
    setupSuccessModalListeners(successModal);
    successModal.hasListenersSetup = true;
  }
}

// Set up success modal event listeners
function setupSuccessModalListeners(modal) {
  logDebug('Setting up success modal event listeners');
  
  // Close on OK button click
  const okButton = document.getElementById('successOkButton');
  if (okButton) {
    okButton.addEventListener('click', () => closeSuccessModal(modal));
  }
  
  // Close modal when pressing Escape key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.style.display === 'block') {
      closeSuccessModal(modal);
    }
  });
  
  // Auto-close after 3 seconds
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeSuccessModal(modal);
    }
  });
}

// Close success modal with animation
function closeSuccessModal(modal) {
  logDebug('Closing success modal');
  
  const modalContent = modal.querySelector('.success-modal-content');
  
  // Add fade-out animations
  modal.classList.add('fade-out');
  if (modalContent) modalContent.classList.add('fade-out');
  
  // Hide after animation completes
  setTimeout(() => {
    modal.style.display = 'none';
    modal.classList.remove('fade-out');
    if (modalContent) modalContent.classList.remove('fade-out');
  }, 300);
}

// Replace your current deleteProduct function with this one
async function deleteProduct(productId) {
  logDebug('Deleting product', productId);
  showLoading('Deleting product...');
  
  try {
    await deleteDoc(doc(db, "products", productId));
    logDebug('Product deleted from Firestore');
    
    // Remove from local arrays
    allProducts = allProducts.filter(p => p.id !== productId);
    filteredProducts = filteredProducts.filter(p => p.id !== productId);
    
    // Update total pages
    totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
    
    // If current page is now empty and not the first page, go to previous page
    if (currentPage > 1 && (currentPage - 1) * PRODUCTS_PER_PAGE >= filteredProducts.length) {
      currentPage--;
      logDebug('Moved to previous page after deletion', currentPage);
    }
    
    // Re-render UI
    renderProducts();
    renderPagination();
    hideLoading();
    
    showSuccessModal('Product deleted successfully');
  } catch (error) {
    logDebug('Error deleting product', error);
    console.error("Error deleting product:", error);
    openModal('Error deleting product: ' + error.message);
    hideLoading();
  }
}

// Add event listeners for search and filters
if (searchInput) {
  searchInput.addEventListener('input', debounce(filterProducts, 300));
  logDebug('Search input event listener added');
}

if (sortOptions) {
  sortOptions.addEventListener('change', filterProducts);
  logDebug('Sort options event listener added');
}

// Debounce function to limit how often a function can be called
function debounce(func, delay) {
  let timeoutId;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
}

// Log initial script load
logDebug('admin_view_products.js loaded');