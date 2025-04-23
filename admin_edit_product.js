import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC5n40vPlIjXQ25X4NJlr8Z2jRGux0C1Y8",
  authDomain: "grindon-da126.firebaseapp.com",
  projectId: "grindon-da126",
  storageBucket: "grindon-da126.firebasestorage.app",
  messagingSenderId: "606558901364",
  appId: "1:606558901364:web:e39156bea8d403f191ed21"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// DOM Elements
const loadingIndicator = document.getElementById('loadingIndicator');
const editProductForm = document.getElementById('editProductForm');
const productTitle = document.getElementById('productTitle');
const productIdInput = document.getElementById('productId');
const nameInput = document.getElementById('name');
const priceInput = document.getElementById('price');
const descriptionInput = document.getElementById('description');
const currentImagesContainer = document.getElementById('currentImagesContainer');
const colorVariations = document.getElementById('colorVariations');
const addVariationBtn = document.getElementById('addVariationBtn');
const cancelBtn = document.getElementById('cancelBtn');
const adminNameElement = document.getElementById('adminName');

// Variables
let currentProduct = null;
let productId = null;
let originalImageUrls = [];
let newUploadedImageUrls = [];
let imagesToDelete = [];

// Get the product ID from URL parameters
function getProductIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id');
}

// Check authentication state
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    adminNameElement.textContent = user.displayName || user.email.split('@')[0];
    productId = getProductIdFromUrl(); 
    
    if (productId) {
      loadProductData(productId);
    } else {
      showError('No product ID provided. Please go back and select a product.');
      loadingIndicator.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <p>No product ID provided. Please go back and select a product.</p>
      `;
    }
  } else {
    // User is signed out, redirect to login
    window.location.href = 'login.html';
  }
});

// Load product data from Firestore
async function loadProductData(id) {
  try {
    const productRef = doc(db, "products", id);
    const productSnap = await getDoc(productRef);
    
    if (productSnap.exists()) {
      const productData = productSnap.data();
      currentProduct = { id, ...productData };
      
      // Set form values
      nameInput.value = productData.name || '';
      priceInput.value = productData.price || '';
      descriptionInput.value = productData.description || '';
      
      // Set page title
      productTitle.textContent = `Edit: ${productData.name}`;
      
      // Store product ID in hidden input
      productIdInput.value = id;
      
      // Handle images
      originalImageUrls = productData.imageUrls || [];
      
      // Render current images
      renderCurrentImages();
      
      // Render variations
      renderVariations(productData.variations || {});
      
      // Show the form
      loadingIndicator.style.display = 'none';
      editProductForm.style.display = 'block';
    } else {
      showError('Product not found.');
      loadingIndicator.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <p>Product not found. It may have been deleted.</p>
        <a href="admin_view_products.html" class="btn btn-outline mt-3">Back to Products</a>
      `;
    }
  } catch (error) {
    console.error("Error loading product: ", error);
    showError('Error loading product data.');
    loadingIndicator.innerHTML = `
      <i class="fas fa-exclamation-circle"></i>
      <p>Error loading product data. Please try again later.</p>
      <p class="error-details">${error.message}</p>
    `;
  }
}

// Render current product images
function renderCurrentImages() {
  currentImagesContainer.innerHTML = '';
  
  if (originalImageUrls.length === 0) {
    currentImagesContainer.innerHTML = '<p>No images available</p>';
    return;
  }
  
  originalImageUrls.forEach((imageUrl, index) => {
    if (!imagesToDelete.includes(imageUrl)) { // Only show images not marked for deletion
      const imageContainer = document.createElement('div');
      imageContainer.className = 'image-container';
      imageContainer.innerHTML = `
        <img src="${imageUrl}" alt="Product Image ${index + 1}">
        <div class="image-remove" data-url="${imageUrl}">
          <i class="fas fa-times"></i>
        </div>
      `;
      
      // Add event listener for remove button
      imageContainer.querySelector('.image-remove').addEventListener('click', (e) => {
        const urlToRemove = e.currentTarget.getAttribute('data-url');
        imagesToDelete.push(urlToRemove);
        renderCurrentImages(); // Re-render to reflect removal
      });
      
      currentImagesContainer.appendChild(imageContainer);
    }
  });
}

// Render color variations
function renderVariations(variations) {
  colorVariations.innerHTML = '';
  
  if (Object.keys(variations).length === 0) {
    // Add a default variation if none exists
    addColorVariation();
    return;
  }
  
  // Loop through each color variation
  Object.entries(variations).forEach(([color, sizes]) => {
    addColorVariation(color, sizes);
  });
}

// Add a new color variation
function addColorVariation(color = '', sizes = { small: 0, medium: 0, large: 0 }) {
  const variationId = `variation-${Date.now()}`;
  const colorValue = color.toLowerCase();
  
  const variationEl = document.createElement('div');
  variationEl.className = 'variation-row';
  variationEl.id = variationId;
  
  variationEl.innerHTML = `
    <div class="variation-header">
      <div class="variation-title">
        <span class="color-indicator" style="background-color: ${getColorHex(colorValue)};"></span>
        <span>Color Variation</span>
      </div>
      <div class="variation-actions">
        <button type="button" class="variation-btn remove" data-variation="${variationId}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
    <div class="form-row four-columns">
      <div class="form-group">
        <label for="${variationId}-color">Color:</label>
        <input type="text" id="${variationId}-color" placeholder="e.g., Red" value="${color}" 
          oninput="this.closest('.variation-row').querySelector('.color-indicator').style.backgroundColor = this.value" required />
      </div>

      <div class="form-group">
        <label for="${variationId}-small">Small Stock:</label>
        <input type="number" id="${variationId}-small" placeholder="S" value="${sizes.small || 0}" min="0" required />
      </div>

      <div class="form-group">
        <label for="${variationId}-medium">Medium Stock:</label>
        <input type="number" id="${variationId}-medium" placeholder="M" value="${sizes.medium || 0}" min="0" required />
      </div>

      <div class="form-group">
        <label for="${variationId}-large">Large Stock:</label>
        <input type="number" id="${variationId}-large" placeholder="L" value="${sizes.large || 0}" min="0" required />
      </div>
    </div>
  `;
  
  colorVariations.appendChild(variationEl);
  
  // Add event listener for remove button
  variationEl.querySelector('.variation-btn.remove').addEventListener('click', (e) => {
    const variationToRemove = e.currentTarget.getAttribute('data-variation');
    document.getElementById(variationToRemove).remove();
    
    // Check if we need to add a default variation when all are removed
    if (colorVariations.children.length === 0) {
      addColorVariation();
    }
  });
}

// Get color hex code for indicator (simple conversion of common color names)
function getColorHex(colorName) {
  const colorMap = {
    'red': '#f87171',
    'blue': '#60a5fa',
    'green': '#4ade80',
    'yellow': '#fbbf24',
    'purple': '#a78bfa',
    'pink': '#f472b6',
    'black': '#1f2937',
    'white': '#f9fafb',
    'gray': '#9ca3af',
    'orange': '#fb923c',
    'brown': '#a16207',
  };
  
  return colorMap[colorName.toLowerCase()] || colorName;
}

// Show file preview on selection
document.getElementById('uploadImage').addEventListener('change', function() {
  const files = this.files;
  const previewContainer = document.getElementById('imagePreviewContainer');
  previewContainer.innerHTML = '';
  
  if (files.length > 0) {
    for (let file of files) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = document.createElement('img');
        img.src = e.target.result;
        previewContainer.appendChild(img);
      };
      reader.readAsDataURL(file);
    }
  }
});

// Upload new images to ImgBB
document.getElementById('uploadToImgBB').addEventListener('click', async () => {
  const fileInput = document.getElementById('uploadImage');
  const files = fileInput.files;
  
  if (!files.length) {
    alert('⚠️ Please select image(s) first.');
    return;
  }
  
  const uploadBtn = document.getElementById('uploadToImgBB');
  uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
  uploadBtn.disabled = true;
  
  newUploadedImageUrls = [];
  
  try {
    for (let file of files) {
      const base64 = await fileToBase64(file);
      
      const response = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          key: "54d7f9f504ad8667bd240160609fd2b4", // Your ImgBB API key
          image: base64.split(",")[1]
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        newUploadedImageUrls.push(result.data.url);
      } else {
        console.error("Upload failed for one image:", result);
      }
    }
    
    document.getElementById('imageUrl').value = newUploadedImageUrls.join(', ');
    alert('🎉 All images uploaded successfully!');
  } catch (error) {
    console.error("Upload error:", error);
    alert('❌ Error uploading images. Please try again.');
  } finally {
    uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload to ImgBB';
    uploadBtn.disabled = false;
  }
});

// Convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Add event listener for add variation button
addVariationBtn.addEventListener('click', () => {
  addColorVariation();
});

// Add event listener for cancel button
cancelBtn.addEventListener('click', () => {
  window.location.href = 'admin_view_products.html';
});

// Handle form submission
editProductForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Get form values
  const name = nameInput.value.trim();
  const price = parseFloat(priceInput.value);
  const description = descriptionInput.value.trim();
  
  // Validate form
  if (!name || isNaN(price) || price <= 0) {
    alert('⚠️ Please fill all required fields correctly.');
    return;
  }
  
  // Get variations data
  const variations = {};
  const variationRows = colorVariations.querySelectorAll('.variation-row');
  
  variationRows.forEach(row => {
    const variationId = row.id;
    const color = document.getElementById(`${variationId}-color`).value.toLowerCase();
    const small = parseInt(document.getElementById(`${variationId}-small`).value) || 0;
    const medium = parseInt(document.getElementById(`${variationId}-medium`).value) || 0;
    const large = parseInt(document.getElementById(`${variationId}-large`).value) || 0;
    
    // Only add if color name is provided
    if (color) {
      variations[color] = { small, medium, large };
    }
  });
  
  // Update button state and show loading
  const submitBtn = editProductForm.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
  submitBtn.disabled = true;
  
  try {
    // Combine remaining original images with new uploads
    const remainingOriginalUrls = originalImageUrls.filter(url => !imagesToDelete.includes(url));
    const updatedImageUrls = [...remainingOriginalUrls, ...newUploadedImageUrls];
    
    // Create updated product object
    const updatedProduct = {
      name,
      price,
      description,
      imageUrls: updatedImageUrls,
      variations,
      updatedAt: serverTimestamp()
    };
    
    // Update product in Firestore
    await updateDoc(doc(db, "products", productId), updatedProduct);
    
    // Show success message
    const successMessage = document.createElement('div');
    successMessage.className = 'success-banner';
    successMessage.innerHTML = `
      <div>
        <i class="fas fa-check-circle"></i>
        Product updated successfully!
      </div>
      <button type="button" class="close-btn">&times;</button>
    `;
    
    editProductForm.insertAdjacentElement('beforebegin', successMessage);
    
    // Add event listener to close button
    successMessage.querySelector('.close-btn').addEventListener('click', () => {
      successMessage.remove();
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (successMessage.parentNode) {
        successMessage.remove();
      }
    }, 5000);
    
    // Update original image URLs and reset new uploads
    originalImageUrls = updatedImageUrls;
    newUploadedImageUrls = [];
    imagesToDelete = [];
    
    // Update current product
    currentProduct = { ...currentProduct, ...updatedProduct };
    
    // Refresh image display
    renderCurrentImages();
    
    // Clear image previews and URL field
    document.getElementById('imagePreviewContainer').innerHTML = '';
    document.getElementById('imageUrl').value = '';
    document.getElementById('uploadImage').value = '';
    
  } catch (error) {
    console.error("Error updating product:", error);
    alert(`❌ Error updating product: ${error.message}`);
  } finally {
    // Restore button state
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
  }
});

// Helper function to show error
function showError(message) {
  console.error(message);
}

// Theme toggle functionality
document.addEventListener('DOMContentLoaded', function() {
  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;
  
  // Check if user previously set a theme preference
  const currentTheme = localStorage.getItem('theme');
  if (currentTheme === 'dark') {
    body.classList.add('dark-mode');
    themeToggle.checked = true;
  }
  
  // Theme toggle event listener
  themeToggle.addEventListener('change', function() {
    if (this.checked) {
      body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  });
});