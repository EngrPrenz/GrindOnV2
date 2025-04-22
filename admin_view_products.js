import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  startAfter,
  limit,
  where
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
const db = getFirestore(app);
const auth = getAuth(app);

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

// Check authentication state
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    adminNameElement.textContent = user.displayName || user.email.split('@')[0];
    loadProducts();
  } else {
    // User is signed out, redirect to login
    window.location.href = 'login.html';
  }
});

// Show loading animation
function showLoading() {
  isLoading = true;
  productsGrid.innerHTML = `
    <div class="loading-animation">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading products...</p>
    </div>
  `;
  
  // Disable all pagination buttons during loading
  const buttons = pagination.querySelectorAll('.page-button');
  buttons.forEach(button => {
    button.disabled = true;
    button.classList.add('loading');
    if (!button.querySelector('.fa-spinner')) {
      button.insertAdjacentHTML('beforeend', '<i class="fas fa-spinner fa-spin"></i>');
    }
  });
}

// Hide loading animation
function hideLoading() {
  isLoading = false;
  
  // Re-enable pagination buttons
  const buttons = pagination.querySelectorAll('.page-button');
  buttons.forEach(button => {
    button.disabled = false;
    button.classList.remove('loading');
    const spinner = button.querySelector('.fa-spinner');
    if (spinner) {
      spinner.remove();
    }
  });
}

// Load products from Firestore
async function loadProducts() {
  try {
    showLoading();
    
    const productsRef = collection(db, "products");
    const querySnapshot = await getDocs(productsRef);
    
    // Clear products array
    allProducts = [];
    
    // Populate products array
    querySnapshot.forEach((doc) => {
      allProducts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Set initial filtered products
    filteredProducts = [...allProducts];
    
    // Set total pages
    totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
    
    // Render products and pagination
    renderProducts();
    renderPagination();
    
    hideLoading();
    
  } catch (error) {
    console.error("Error loading products: ", error);
    productsGrid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-circle"></i>
        <p>Error loading products. Please try again later.</p>
      </div>
    `;
    hideLoading();
  }
}

// Navigate to a specific page
function goToPage(page) {
  if (page < 1 || page > totalPages || page === currentPage || isLoading) return;
  
  showLoading();
  
  // Use setTimeout to show the loading animation
  setTimeout(() => {
    currentPage = page;
    renderProducts();
    renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    hideLoading();
  }, 300);
}

// Render products for current page
function renderProducts() {
  // Start and end index for current page
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  
  // Get products for current page
  const productsToShow = filteredProducts.slice(startIndex, endIndex);
  
  // Clear products grid
  productsGrid.innerHTML = '';
  
  // Check if there are products
  if (productsToShow.length === 0) {
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
        <img src="${imageUrl}" alt="${product.name}">
        <div class="product-status ${stockClass}">${stockStatus}</div>
      </div>
      <div class="product-details">
        <h3 class="product-title">${product.name}</h3>
        <div class="product-category">${product.category || ''}</div>
        <div class="product-price">₱${product.price.toFixed(2)}</div>
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
    
    // Add event listeners for buttons only
    productCard.querySelector('.edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      window.location.href = `admin_edit_product.html?id=${product.id}`;
    });
    
    productCard.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      confirmDeleteProduct(product.id, product.name);
    });
    
    // Note: Removed the click event for the entire card
    
    productsGrid.appendChild(productCard);
  });
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
// Render pagination buttons
function renderPagination() {
  // Clear pagination
  pagination.innerHTML = '';
  
  // Don't show pagination if there's only one page
  if (totalPages <= 1) return;
  
  // Create previous button
  const prevButton = document.createElement('button');
  prevButton.className = `page-button prev ${currentPage === 1 ? 'disabled' : ''}`;
  prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener('click', () => {
    if (currentPage > 1 && !isLoading) {
      showLoading();
      setTimeout(() => {
        currentPage--;
        renderProducts();
        renderPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        hideLoading();
      }, 300);
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
        showLoading();
        setTimeout(() => {
          currentPage = i;
          renderProducts();
          renderPagination();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          hideLoading();
        }, 300);
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
      showLoading();
      setTimeout(() => {
        currentPage++;
        renderProducts();
        renderPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        hideLoading();
      }, 300);
    }
  });
  pagination.appendChild(nextButton);
}

  

// Filter and search products
function filterProducts() {
  if (isLoading) return;
  
  showLoading();
  
  // Use setTimeout to show the loading animation
  setTimeout(() => {
    const searchTerm = searchInput.value.toLowerCase();
    
    filteredProducts = allProducts.filter(product => {
      // Search term filter
      return product.name.toLowerCase().includes(searchTerm) || 
             (product.description && product.description.toLowerCase().includes(searchTerm));
    });
    
    // Apply sorting
    sortProducts();
    
    // Reset to first page and update UI
    currentPage = 1;
    totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
    renderProducts();
    renderPagination();
    hideLoading();
  }, 500); // Slight delay to show loading animation
}

// Sort products based on selected option
function sortProducts() {
  const sortOption = sortOptions.value;
  
  switch (sortOption) {
    case 'all':
      // Default sorting or no specific sort for "All Products"
      // You can choose to maintain the original order or use a default sort
      filteredProducts = [...allProducts]; // Reset to original order
      break;
    case 'newest':
      filteredProducts.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
      break;
    case 'price-low':
      filteredProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      break;
    case 'price-high':
      filteredProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      break;
    case 'name-asc':
      filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      // Default sorting (newest first)
      filteredProducts.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
  }
}
// Confirm and delete product
function confirmDeleteProduct(productId, productName) {
  if (isLoading) return;
  
  if (confirm(`Are you sure you want to delete "${productName}"?`)) {
    deleteProduct(productId);
  }
}

// Delete product from Firestore
async function deleteProduct(productId) {
  showLoading();
  
  try {
    await deleteDoc(doc(db, "products", productId));
    
    // Remove from local arrays
    allProducts = allProducts.filter(p => p.id !== productId);
    filteredProducts = filteredProducts.filter(p => p.id !== productId);
    
    // Update total pages
    totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
    
    // If current page is now empty and not the first page, go to previous page
    if (currentPage > 1 && (currentPage - 1) * PRODUCTS_PER_PAGE >= filteredProducts.length) {
      currentPage--;
    }
    
    // Re-render UI
    renderProducts();
    renderPagination();
    hideLoading();
    
    // Show success message
    alert('Product deleted successfully');
  } catch (error) {
    console.error("Error deleting product: ", error);
    alert('Error deleting product. Please try again.');
    hideLoading();
  }
}

// Add event listeners for search and filters
searchInput.addEventListener('input', debounce(filterProducts, 300));
sortOptions.addEventListener('change', filterProducts);

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