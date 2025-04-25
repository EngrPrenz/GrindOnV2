// page-transition.js - Implement the same loading animation as shop.js for page transitions
// with minimum display time to prevent it from disappearing too quickly

// Configuration
const MIN_LOADING_TIME = 800; // Minimum time in milliseconds to show the loading animation

// Keep track of when loading started
let loadingStartTime = 0;
let loadingTimer = null;

// Function to create loading overlay if it doesn't exist
function createPageLoadingOverlay() {
  let loadingOverlay = document.querySelector('.page-loading-overlay');
  if (!loadingOverlay) {
    loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'page-loading-overlay';
    loadingOverlay.innerHTML = `
      <div class="fa-spinner-wrapper">
        <i class="fa fa-spinner fa-spin fa-3x"></i>
        <p>Loading page...</p>
      </div>
    `;
    document.body.appendChild(loadingOverlay);
  }
  return loadingOverlay;
}

// Function to show loading animation
function showPageLoading() {
  // Clear any existing timers
  if (loadingTimer) {
    clearTimeout(loadingTimer);
    loadingTimer = null;
  }
  
  // Record the start time
  loadingStartTime = Date.now();
  
  const loadingOverlay = createPageLoadingOverlay();
  loadingOverlay.classList.add('active');
}

// Function to hide loading animation with minimum display time
function hidePageLoading() {
  const currentTime = Date.now();
  const timeElapsed = currentTime - loadingStartTime;
  
  // If we haven't shown the loader for the minimum time, delay hiding it
  if (timeElapsed < MIN_LOADING_TIME) {
    const remainingTime = MIN_LOADING_TIME - timeElapsed;
    
    // Set a timer to hide after the remaining time
    loadingTimer = setTimeout(() => {
      const loadingOverlay = document.querySelector('.page-loading-overlay');
      if (loadingOverlay) {
        loadingOverlay.classList.remove('active');
      }
      loadingTimer = null;
    }, remainingTime);
  } else {
    // If we've shown it long enough, hide immediately
    const loadingOverlay = document.querySelector('.page-loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.classList.remove('active');
    }
  }
}

// Add CSS for the loading overlay - using similar styling to shop.css
function addPageLoadingStyles() {
  if (!document.getElementById('page-loading-styles')) {
    const style = document.createElement('style');
    style.id = 'page-loading-styles';
    style.textContent = `
      .page-loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.85);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      }
      
      .page-loading-overlay.active {
        display: flex;
      }
      
      .page-loading-overlay .fa-spinner-wrapper {
        text-align: center;
        color: #000;
      }
      
      .page-loading-overlay .fa-spinner-wrapper p {
        margin-top: 10px;
        font-size: 14px;
        color: #333;
      }
    `;
    document.head.appendChild(style);
  }
}

// Add the loading styles when the script loads
addPageLoadingStyles();

// Show loading on page unload
window.addEventListener('beforeunload', () => {
  showPageLoading();
});

// Set up navigation hooks to show loading when navigating away
document.addEventListener('DOMContentLoaded', () => {
  // Create the loading overlay when the DOM is ready
  createPageLoadingOverlay();
  
  // Add event listeners to all links
  const links = document.querySelectorAll('a');
  links.forEach(link => {
    // Skip links that should not trigger loading animation
    if (link.getAttribute('href') === '#' || 
        link.getAttribute('href') === '' || 
        link.getAttribute('href') === null ||
        link.getAttribute('href').startsWith('javascript:') ||
        link.getAttribute('target') === '_blank' ||
        link.hasAttribute('data-no-loading')) {
      return;
    }
    
    link.addEventListener('click', (e) => {
      // Don't show loader for same-page anchors
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) return;
      
      // Show the loading overlay
      showPageLoading();
    });
  });
  
  // Hide loading when page is fully loaded
  if (document.readyState === 'complete') {
    hidePageLoading();
  } else {
    window.addEventListener('load', hidePageLoading);
  }
  
  // Add a slight delay for initial page load to show the loader
  showPageLoading();
  
  // Handle form submissions
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    if (form.getAttribute('target') !== '_blank' && !form.hasAttribute('data-no-loading')) {
      form.addEventListener('submit', () => {
        showPageLoading();
      });
    }
  });
});

// Store animation in localStorage so it persists across pages
function storeLoadingState(isLoading) {
  if (typeof window.localStorage !== 'undefined') {
    localStorage.setItem('pageIsLoading', isLoading ? 'true' : 'false');
  }
}

// Check if we should be showing loading from previous page
function checkStoredLoadingState() {
  if (typeof window.localStorage !== 'undefined') {
    const wasLoading = localStorage.getItem('pageIsLoading') === 'true';
    if (wasLoading) {
      showPageLoading();
      localStorage.removeItem('pageIsLoading');
    }
  }
}

// Call this when the script loads
checkStoredLoadingState();

// Expose the functions globally for manual use
window.showPageLoading = showPageLoading;
window.hidePageLoading = hidePageLoading;