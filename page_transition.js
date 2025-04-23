// Add this to a new file called page-transition.js

// Global variable to track if a page transition is in progress
let isPageTransitioning = false;

// Function to show page transition loading
function showPageTransition() {
  // Prevent multiple transitions
  if (isPageTransitioning) return;
  isPageTransitioning = true;
  
  // Create loading overlay if it doesn't exist
  if (!document.getElementById('pageTransitionOverlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'pageTransitionOverlay';
    overlay.className = 'page-transition-overlay';
    overlay.innerHTML = `
      <div class="page-transition-animation">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading page...</p>
      </div>
    `;
    document.body.appendChild(overlay);
  } else {
    document.getElementById('pageTransitionOverlay').style.display = 'flex';
  }
  
  // Add loading class to body
  document.body.classList.add('page-transitioning');
}

// Function to hide page transition loading
function hidePageTransition() {
  setTimeout(() => {
    const overlay = document.getElementById('pageTransitionOverlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
    document.body.classList.remove('page-transitioning');
    isPageTransitioning = false;
  }, 300); // Short delay to ensure animations complete
}

// Add page transition to all internal links
document.addEventListener('DOMContentLoaded', function() {
  // Get all internal links (excluding external links and anchors)
  const internalLinks = document.querySelectorAll('a:not([href^="http"]):not([href^="#"])');
  
  internalLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // Don't interfere with modified clicks (new tab, etc.)
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      
      const href = this.getAttribute('href');
      
      // Skip if it's a JavaScript link or empty
      if (href.startsWith('javascript:') || href === '') return;
      
      // Show loading animation
      e.preventDefault();
      showPageTransition();
      
      // Navigate after a brief delay (for animation effect)
      setTimeout(() => {
        window.location.href = href;
      }, 300);
    });
  });
  
  // Capture pagination clicks for product list view
  const paginationLinks = document.querySelectorAll('.pagination .page-button');
  paginationLinks.forEach(button => {
    button.addEventListener('click', function() {
      if (this.classList.contains('disabled') || isPageTransitioning) return;
      showPageTransition();
    });
  });
  
  // Handle browser back/forward 
  window.addEventListener('popstate', function() {
    showPageTransition();
  });
  
  // Hide transition when page is fully loaded
  window.addEventListener('load', hidePageTransition);
});

// Function specifically for product pagination
function goToProductPage(page) {
  if (page < 1 || page > totalPages || page === currentPage || isPageTransitioning) return;
  
  showPageTransition();
  
  // Use setTimeout to simulate page load time
  setTimeout(() => {
    currentPage = page;
    renderProducts();
    renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    hidePageTransition();
  }, 500); // Increased delay for more visible effect
}

// Update pagination in admin_view_products.js
function updatePagination() {
  const prevButton = document.querySelector('.page-button.prev');
  const nextButton = document.querySelector('.page-button.next');
  const pageButtons = document.querySelectorAll('.page-button:not(.prev):not(.next)');
  
  if (prevButton) {
    prevButton.addEventListener('click', function() {
      if (currentPage > 1 && !isPageTransitioning) {
        goToProductPage(currentPage - 1);
      }
    });
  }
  
  if (nextButton) {
    nextButton.addEventListener('click', function() {
      if (currentPage < totalPages && !isPageTransitioning) {
        goToProductPage(currentPage + 1);
      }
    });
  }
  
  pageButtons.forEach(button => {
    button.addEventListener('click', function() {
      const pageNum = parseInt(this.textContent);
      if (pageNum !== currentPage && !isPageTransitioning) {
        goToProductPage(pageNum);
      }
    });
  });
}