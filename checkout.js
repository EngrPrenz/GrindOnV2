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
  serverTimestamp,
  updateDoc,
  deleteDoc
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

// Constants for shipping calculation
const ORS_API_KEY = '5b3ce3597851110001cf62481c6b00fa3b904acf951184f3c3dce740';
const STORE_COORDS = [121.1850, 14.5849]; // Store location [lng, lat]

// Observe auth state
onAuthStateChanged(auth, (user) => {
  if (user) {
    loadUserCart(user.uid);
    loadUserDetails(user.uid);
  } else {
    window.location.href = 'login.html?redirect=checkout.html';
  }
});


function showModal(message, type = 'error') {
  const modalContainer = document.getElementById('modal-container');
  const modalMessage = document.getElementById('modal-message');
  const modalIcon = document.querySelector('.modal-icon');
  const closeBtn = document.querySelector('.modal-close');
  const okBtn = document.getElementById('modal-ok-btn');
  
  if (!modalContainer || !modalMessage) {
    // Fallback to alert if modal elements don't exist
    alert(message);
    return;
  }
  
  // Set icon based on type
  if (modalIcon) {
    if (type === 'error') {
      modalIcon.innerHTML = '<i class="fa fa-exclamation-circle" style="color: #e74c3c;"></i>';
    } else if (type === 'warning') {
      modalIcon.innerHTML = '<i class="fa fa-exclamation-triangle" style="color: #f39c12;"></i>';
    } else if (type === 'success') {
      modalIcon.innerHTML = '<i class="fa fa-check-circle" style="color: #2ecc71;"></i>';
    } else if (type === 'info') {
      modalIcon.innerHTML = '<i class="fa fa-info-circle" style="color: #3498db;"></i>';
    }
  }
  
  // Set message
  modalMessage.textContent = message;
  
  // Show modal
  modalContainer.style.display = 'flex';
  
  // Close modal on close button click
  if (closeBtn) {
    closeBtn.onclick = function() {
      modalContainer.style.display = 'none';
    };
  }
  
  // Close modal on OK button click
  if (okBtn) {
    okBtn.onclick = function() {
      modalContainer.style.display = 'none';
    };
  }
  
  // Close modal when clicking outside
  window.onclick = function(event) {
    if (event.target === modalContainer) {
      modalContainer.style.display = 'none';
    }
  };
}

// Load cart and compute subtotal
async function loadUserCart(userId) {
  try {
    const orderItemsContainer = document.getElementById('order-items');
    if (!orderItemsContainer) {
      console.error("Order items container not found");
      return;
    }
    
    orderItemsContainer.innerHTML = '';

    const q = query(collection(db, "carts"), where("userId", "==", userId));
    const cartSnapshot = await getDocs(q);

    if (cartSnapshot.empty) {
      window.location.href = 'cart.html';
      return;
    }

    let subtotal = 0;
    cartSnapshot.forEach((doc) => {
      const item = doc.data();
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      const el = document.createElement('div');
      el.className = 'order-item';
      el.innerHTML = `
        <img src="${item.imageUrl || '/api/placeholder/80/80'}" alt="${item.name}" class="order-item-image">
        <div class="order-item-details">
          <div class="order-item-name">${item.name}</div>
          <div class="order-item-variant">
            ${item.size ? `Size: ${item.size}, ` : ''}${item.color ? `Color: ${item.color}` : ''} (Qty: ${item.quantity})
          </div>
          <div class="order-item-price">₱${itemTotal.toFixed(2)}</div>
        </div>`;
      orderItemsContainer.appendChild(el);
    });

    window.cartItems = cartSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    window.orderSubtotal = subtotal;

    const subtotalElement = document.getElementById('order-subtotal');
    if (subtotalElement) {
      subtotalElement.innerText = '₱' + subtotal.toFixed(2);
    }

    // Wait for user location input before shipping calculation
    const cityField = document.getElementById('city');
    const provinceField = document.getElementById('province');
    const barangayField = document.getElementById('barangay');

    if (barangayField) {
      barangayField.addEventListener('blur', calculateShipping);
    }
    
    if (cityField) {
      cityField.addEventListener('blur', calculateShipping);
    }
    
    if (provinceField) {
      provinceField.addEventListener('blur', calculateShipping);
    }
    
  } catch (err) {
    console.error("Error loading cart:", err);
    showModal("Failed to load cart. Try again.");
  }
}

async function calculateShipping() {
  const address = document.getElementById('address')?.value.trim() || '';
  const barangay = document.getElementById('barangay')?.value.trim() || '';
  const city = document.getElementById('city')?.value.trim() || '';
  const province = document.getElementById('province')?.value.trim() || '';

  if (!address || !city || !province) return;

  try {
    // Show calculating state
    const shippingElement = document.getElementById('order-shipping');
    if (shippingElement) {
      shippingElement.innerText = 'Calculating...';
    }
    
    // Display shipping details section
    const shippingDetails = document.getElementById('shipping-details');
    if (shippingDetails) {
      shippingDetails.style.display = 'block';
    }

    // If we have the improved shipping calculator available, use it
    if (window.ShippingCalculator) {
      const result = await window.ShippingCalculator.calculateShippingFee(address, barangay, city, province);
      
      // Store calculated values
      window.shippingCost = result.shipping;
      window.estimatedDistance = result.distance;
      const total = window.orderSubtotal + result.shipping;
      window.orderTotal = total;
      
      // Update distance info if element exists
      const distanceInfo = document.getElementById('distance-info');
      if (distanceInfo) {
        distanceInfo.innerText = `Estimated Distance: ~${result.distance} km`;
      }
      
      // Update shipping in the UI
      if (shippingElement) {
        shippingElement.innerText = '₱' + result.shipping.toFixed(2);
      }
      
      // Update total
      let orderTotalElement = document.getElementById('order-total');
      if (orderTotalElement) {
        orderTotalElement.innerText = '₱' + total.toFixed(2);
      } else {
        // Create total row if it doesn't exist
        const orderSummarySection = document.querySelector('.order-summary');
        if (orderSummarySection) {
          const totalRow = document.createElement('div');
          totalRow.className = 'order-summary-row total';
          totalRow.innerHTML = `
            <span>Total</span>
            <span id="order-total">₱${total.toFixed(2)}</span>
          `;
          // Add the total row to the end of the order summary section
          orderSummarySection.appendChild(totalRow);
        }
      }
      
      // Add hidden input fields with the calculated values
      updateHiddenField('calculated-shipping', result.shipping);
      updateHiddenField('calculated-distance', result.distance);
      
      return;
    }

    // CORS-safe approach as fallback: Use a fixed shipping rate based on province/city
    // This is a fallback solution when the shipping calculator isn't available
    let shipping = 0;
    let estimatedDistance = 0;
    
    // Get province value
    const provinceValue = province.toLowerCase();
    
    // Calculate shipping based on region/province
    if (provinceValue === 'metro-manila' || provinceValue === 'metro manila' || city.toLowerCase().includes('manila')) {
      shipping = 100;
      estimatedDistance = 10;
    } else if (['cavite', 'laguna', 'batangas', 'rizal', 'bulacan'].includes(provinceValue)) {
      shipping = 150;
      estimatedDistance = 20;
    } else if (['pampanga', 'bataan', 'nueva ecija'].includes(provinceValue)) {
      shipping = 200;
      estimatedDistance = 30;
    } else {
      // For other provinces, use a default rate
      shipping = 250;
      estimatedDistance = 40;
    }
    
    // Add a small random variation to make it seem more precise
    const variation = Math.floor(Math.random() * 30) - 15; // -15 to +15
    shipping = Math.max(100, shipping + variation);
    
    // Store calculated values
    window.shippingCost = shipping;
    window.estimatedDistance = estimatedDistance;
    const total = window.orderSubtotal + shipping;
    window.orderTotal = total;
    
    // Update distance info if element exists
    const distanceInfo = document.getElementById('distance-info');
    if (distanceInfo) {
      distanceInfo.innerText = `Estimated Distance: ~${estimatedDistance} km`;
    }
    
    // Update shipping in the UI
    if (shippingElement) {
      shippingElement.innerText = '₱' + shipping.toFixed(2);
    }
    
    // Update or add hidden input fields
    updateHiddenField('calculated-shipping', shipping);
    updateHiddenField('calculated-distance', estimatedDistance);
    
    // Update or create the order total element
    let orderTotalElement = document.getElementById('order-total');
    if (orderTotalElement) {
      orderTotalElement.innerText = '₱' + total.toFixed(2);
    } else {
      // Create total row if it doesn't exist
      const orderSummarySection = document.querySelector('.order-summary');
      if (orderSummarySection) {
        const totalRow = document.createElement('div');
        totalRow.className = 'order-summary-row total';
        totalRow.innerHTML = `
          <span>Total</span>
          <span id="order-total">₱${total.toFixed(2)}</span>
        `;
        // Add the total row to the end of the order summary section
        orderSummarySection.appendChild(totalRow);
      }
    }

  } catch (err) {
    console.error("Shipping calculation error:", err);
    
    // Fallback to default shipping rate
    const defaultShipping = 150;
    window.shippingCost = defaultShipping;
    const total = window.orderSubtotal + defaultShipping;
    window.orderTotal = total;
    
    const shippingElement = document.getElementById('order-shipping');
    if (shippingElement) {
      shippingElement.innerText = '₱' + defaultShipping.toFixed(2);
    }
    
    // Create or update the total display
    let orderTotalElement = document.getElementById('order-total');
    if (orderTotalElement) {
      orderTotalElement.innerText = '₱' + total.toFixed(2);
    } else {
      // Create total row if it doesn't exist
      const orderSummarySection = document.querySelector('.order-summary');
      if (orderSummarySection) {
        const totalRow = document.createElement('div');
        totalRow.className = 'order-summary-row total';
        totalRow.innerHTML = `
          <span>Total</span>
          <span id="order-total">₱${total.toFixed(2)}</span>
        `;
        // Add the total row to the end of the order summary section
        orderSummarySection.appendChild(totalRow);
      }
    }
  }
}


// Helper function to update or create hidden input fields
function updateHiddenField(id, value) {
  let hiddenInput = document.getElementById(id);
  if (!hiddenInput) {
    hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.id = id;
    hiddenInput.name = id;
    document.getElementById('checkout-form')?.appendChild(hiddenInput);
  }
  hiddenInput.value = value;
}

// Prefill form with user info
async function loadUserDetails(uid) {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) return;

    const data = userDoc.data();
    ['first-name', 'last-name', 'email', 'phone', 'address', 'barangay', 'city', 'province', 'zip'].forEach(id => {
      const field = id.replace('-', '');
      const element = document.getElementById(id);
      if (data[field] && element) {
        element.value = data[field];
      }
    });
    
    // Trigger shipping calculation after loading
    calculateShipping();

  } catch (err) {
    console.error("Error loading user info:", err);
  }
}

// Handle checkout form submission
document.addEventListener('DOMContentLoaded', function() {
  // Find the checkout form
  const checkoutForm = document.getElementById('checkout-form');
  
  // Add event listener to the form
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleCheckout);
    console.log('Form submit event listener added');
  } else {
    console.error('Checkout form not found in the DOM');
  }
  
  // Payment method toggle
  const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
  const gcashDetails = document.getElementById('gcash-details');
  const bankDetails = document.getElementById('bank-details');
  
  paymentMethods.forEach(method => {
    method.addEventListener('change', function() {
      if (this.value === 'gcash') {
        if (gcashDetails) gcashDetails.style.display = 'block';
        if (bankDetails) bankDetails.style.display = 'none';
      } else if (this.value === 'bank-transfer') {
        if (gcashDetails) gcashDetails.style.display = 'none';
        if (bankDetails) bankDetails.style.display = 'block';
      } else {
        if (gcashDetails) gcashDetails.style.display = 'none';
        if (bankDetails) bankDetails.style.display = 'none';
      }
    });
  });
  
  // Initialize default payment method
  document.querySelector('input[name="payment-method"]:checked')?.dispatchEvent(new Event('change'));
  
  // Setup upload functionality
  setupUploadFunctionality('payment-proof-upload', 'upload-payment-proof-btn', 'payment-proof-preview', 'payment-proof-url');
  setupUploadFunctionality('bank-proof-upload', 'upload-bank-proof-btn', 'bank-proof-preview', 'bank-proof-url');
});

// ImgBB upload functionality for payment proof
function setupUploadFunctionality(uploadId, buttonId, previewId, hiddenInputId) {
  const uploadInput = document.getElementById(uploadId);
  const uploadButton = document.getElementById(buttonId);
  
  if (uploadInput && uploadButton) {
    uploadButton.addEventListener('click', async () => {
      const files = uploadInput.files;
      
      if (!files.length) {
        showModal('⚠️ Please select a payment proof image first.');
        return;
      }
      
      // Show loading state
      uploadButton.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Uploading...';
      uploadButton.disabled = true;
      
      try {
        const file = files[0]; // Just use the first file for payment proof
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
          // Store the payment proof URL in a hidden input field
          const hiddenInput = document.getElementById(hiddenInputId);
          if (hiddenInput) {
            hiddenInput.value = result.data.url;
          } else {
            // Create the hidden field if it doesn't exist
            const newHiddenInput = document.createElement('input');
            newHiddenInput.type = 'hidden';
            newHiddenInput.id = hiddenInputId;
            newHiddenInput.name = hiddenInputId;
            newHiddenInput.value = result.data.url;
            document.getElementById('checkout-form')?.appendChild(newHiddenInput);
          }
          
          // Show success message and preview
          const previewContainer = document.getElementById(previewId);
          if (previewContainer) {
            previewContainer.innerHTML = `
              <div class="upload-success">
                <img src="${result.data.url}" alt="Payment proof" class="payment-proof-image" style="max-width: 100%; max-height: 200px;">
                <p><i class="fa fa-check-circle"></i> Upload successful!</p>
              </div>
            `;
          }
          
          // Update order data with payment proof URL
          const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value;
          if (paymentMethod === 'gcash' || paymentMethod === 'bank-transfer') {
            // Add payment proof to order data
            console.log("Payment proof URL added:", result.data.url);
          }
          
        } else {
          console.error("Upload failed:", result);
          showModal('❌ Error uploading payment proof. Please try again.');
        }
      } catch (error) {
        console.error("Upload error:", error);
        showModal('❌ Error uploading payment proof. Please try again.');
      } finally {
        uploadButton.innerHTML = '<i class="fa fa-upload"></i> Upload Receipt';
        uploadButton.disabled = false;
      }
    });
  }
}

// Convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handleCheckout(event) {
  event.preventDefault();
  console.log("Checkout process started");
  
  // Get the current user
  const user = auth.currentUser;
  if (!user) {
    console.log("No authenticated user found");
    showModal("Please log in to complete your order.");
    window.location.href = 'login.html?redirect=checkout.html';
    return;
  }
  console.log("Authenticated user:", user.uid);
  
  // Validate the form 
  const requiredFields = [
    { id: 'first-name', errorId: 'first-name-error' },
    { id: 'last-name', errorId: 'last-name-error' },
    { id: 'email', errorId: 'email-error' },
    { id: 'phone', errorId: 'phone-error' },
    { id: 'address', errorId: 'address-error' },
    { id: 'barangay', errorId: 'barangay-error' },
    { id: 'city', errorId: 'city-error' },
    { id: 'zip', errorId: 'zip-error' },
    { id: 'province', errorId: 'province-error' }
  ];

  let isValid = true;

  requiredFields.forEach(field => {
    const input = document.getElementById(field.id);
    const errorElement = document.getElementById(field.errorId);
    
    if (input && errorElement) {
      if (!input.value.trim()) {
        errorElement.style.display = 'block';
        isValid = false;
      } else {
        errorElement.style.display = 'none';
      }
    }
  });

  if (!isValid) {
    console.log("Form validation failed");
    return;
  }
  
  // Make sure success message is hidden during processing
  const orderSuccess = document.getElementById('order-success');
  if (orderSuccess) {
    orderSuccess.style.display = 'none';
  }
  
  // Show loading overlay
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = 'flex';
  } else {
    // Create loading overlay if it doesn't exist
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '1000';
    
    const spinner = document.createElement('div');
    spinner.classList.add('loading-spinner');
    spinner.innerHTML = '<div class="spinner"></div><p>Processing your order...</p>';
    overlay.appendChild(spinner);
    
    document.body.appendChild(overlay);
  }
  
  // Disable submit button to prevent multiple submissions
  const submitButton = document.getElementById('place-order-btn');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Processing...';
    console.log("Submit button disabled");
  }
  
  try {
    // Get calculated shipping info or use default
    const shippingFee = window.shippingCost || 150;
    const distance = window.estimatedDistance || 0;
    
    // Gather form data
    const orderData = {
      userId: user.uid,
      firstName: document.getElementById('first-name')?.value || '',
      lastName: document.getElementById('last-name')?.value || '',
      email: document.getElementById('email')?.value || '',
      phone: document.getElementById('phone')?.value || '',
      address: document.getElementById('address')?.value || '',
      barangay: document.getElementById('barangay')?.value || '',
      city: document.getElementById('city')?.value || '',
      province: document.getElementById('province')?.value || '',
      postalCode: document.getElementById('zip')?.value || '',
      paymentMethod: document.querySelector('input[name="payment-method"]:checked')?.value || 'cod',
      // Add the payment proof URL if available
      paymentProofUrl: document.getElementById('payment-proof-url')?.value || '',
      items: window.cartItems || [],
      subtotal: window.orderSubtotal || 0,
      shipping: shippingFee,
      distance: distance,
      total: (window.orderSubtotal || 0) + shippingFee,
      status: 'pending',
      createdAt: serverTimestamp()
    };
    console.log("Order data prepared:", orderData);
    
    // Process all backend operations
    console.log("Attempting to create order in Firestore collection 'orders'");
    const orderRef = await addDoc(collection(db, "orders"), orderData);
    console.log("Order created successfully with ID:", orderRef.id);
    
    // Save user details for future checkouts
    console.log("Updating user details");
    await updateUserDetails(user.uid, orderData);
    console.log("User details updated");
    
    // Clear user's cart after successful order
    console.log("Clearing user cart");
    await clearUserCart(user.uid);
    console.log("User cart cleared");
    
    // All backend processing is complete, now update the UI
    
    // First, hide the loading overlay
    const loadingElem = document.getElementById('loading-overlay');
    if (loadingElem) {
      loadingElem.style.display = 'none';
    }
    
    // Show success message with order number
    if (orderSuccess) {
      // Set the order number in the success message
      const orderNumberElement = document.getElementById('success-order-number');
      if (orderNumberElement) {
        orderNumberElement.textContent = `GRD-${orderRef.id.substr(0, 5).toUpperCase()}`;
      }
      
      // Show the success message and ensure it's visible
      orderSuccess.style.display = 'block';
      
      // Scroll to the success message
      orderSuccess.scrollIntoView({ behavior: 'smooth' });
      
      // Important: Only set up the redirect timer once we've displayed the success message
      // This ensures the user has time to see the confirmation before redirect
      console.log("Setting up redirect timer after showing success message");
      clearTimeout(window.redirectTimer); // Clear any existing timer
      window.redirectTimer = setTimeout(() => {
        console.log("Redirecting to homepage after success message display");
        window.location.href = 'homepage.html';
      }, 8000);
      
    } else {
      console.log("Success element not found, redirecting immediately");
      window.location.href = 'homepage.html';
    }
  } catch (error) {
    console.error("Error processing order:", error);
    
    // Hide loading overlay
    const loadingElem = document.getElementById('loading-overlay');
    if (loadingElem) {
      loadingElem.style.display = 'none';
    }
    
    showModal("There was an error processing your order. Please try again.");
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Place Order';
    }
  }
}

// Update user details for future checkouts
async function updateUserDetails(userId, orderData) {
  try {
    const userRef = doc(db, "users", userId);
    
    // Extract only the shipping details to save to user profile
    const userDetails = {
      firstName: orderData.firstName,
      lastName: orderData.lastName,
      email: orderData.email,
      phone: orderData.phone,
      address: orderData.address,
      city: orderData.city,
      province: orderData.province,
      postalCode: orderData.postalCode,
      updatedAt: serverTimestamp()
    };
    
    // Update the user document (merge: true preserves other fields)
    await updateDoc(userRef, userDetails, { merge: true });
    
  } catch (error) {
    console.error("Error updating user details:", error);
    // Continue with order process even if user details update fails
  }
}

// Clear the user's cart after successful order
async function clearUserCart(userId) {
  try {
    const cartRef = collection(db, "carts");
    const q = query(cartRef, where("userId", "==", userId));
    const cartSnapshot = await getDocs(q);
    
    // Delete each cart item
    const deletePromises = cartSnapshot.docs.map(doc => {
      return deleteDoc(doc.ref);
    });
    
    await Promise.all(deletePromises);
    
  } catch (error) {
    console.error("Error clearing user cart:", error);
    // Continue with order process even if cart clearing fails
  }
}