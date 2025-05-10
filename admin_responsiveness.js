// JavaScript to enhance responsive features

document.addEventListener('DOMContentLoaded', function() {
    
    
    // Add viewport meta tag if not present
    if (!document.querySelector('meta[name="viewport"]')) {
      const metaViewport = document.createElement('meta');
      metaViewport.name = 'viewport';
      metaViewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(metaViewport);
    }
    
    // Responsive tables
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
      const wrapper = document.createElement('div');
      wrapper.classList.add('table-responsive');
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
    
    // Responsive image loading
    function loadResponsiveImages() {
      const images = document.querySelectorAll('img[data-src]');
      images.forEach(img => {
        const screenWidth = window.innerWidth;
        let srcToUse = img.dataset.srcMobile;
        
        if (screenWidth > 768 && img.dataset.srcTablet) {
          srcToUse = img.dataset.srcTablet;
        }
        
        if (screenWidth > 1200 && img.dataset.srcDesktop) {
          srcToUse = img.dataset.srcDesktop;
        }
        
        if (screenWidth > 1920 && img.dataset.srcTv) {
          srcToUse = img.dataset.srcTv;
        }
        
        if (srcToUse) {
          img.src = srcToUse;
        } else {
          img.src = img.dataset.src;
        }
      });
    }
    
    // Call initially and on resize
    loadResponsiveImages();
    window.addEventListener('resize', loadResponsiveImages);
    
    // Detect device type
    function detectDeviceType() {
      const width = window.innerWidth;
      
      if (width >= 1921) {
        document.body.setAttribute('data-device', 'tv');
      } else if (width >= 1441) {
        document.body.setAttribute('data-device', 'desktop');
      } else if (width >= 1201) {
        document.body.setAttribute('data-device', 'laptop');
      } else if (width >= 769) {
        document.body.setAttribute('data-device', 'tablet');
      } else {
        document.body.setAttribute('data-device', 'mobile');
      }
    }
    
    // Call initially and on resize
    detectDeviceType();
    window.addEventListener('resize', detectDeviceType);
    
    // Handle orientation changes
    window.addEventListener('orientationchange', function() {
      // Small delay to ensure new dimensions are calculated
      setTimeout(() => {
        detectDeviceType();
        loadResponsiveImages();
      }, 200);
    });
    
    // Adjust content height for consistent UX
    function adjustContentHeight() {
      const main = document.querySelector('.main');
      if (main) {
        main.style.minHeight = `${window.innerHeight}px`;
      }
    }
    
    adjustContentHeight();
    window.addEventListener('resize', adjustContentHeight);
    
    // Responsive navigation menu
    function handleResponsiveMenu() {
      const width = window.innerWidth;
      const sidebarItems = document.querySelectorAll('.sidebar a');
      
      if (width <= 768) {
        sidebarItems.forEach(item => {
          // Store the original text if not already stored
          if (!item.dataset.originalText) {
            item.dataset.originalText = item.textContent.trim();
          }
          
          // Show only the icon
          const textSpan = item.querySelector('span');
          if (textSpan) {
            textSpan.style.display = 'none';
          }
        });
      } else {
        sidebarItems.forEach(item => {
          // Restore the original text
          if (item.dataset.originalText) {
            const textSpan = item.querySelector('span');
            if (textSpan) {
              textSpan.style.display = '';
            }
          }
        });
      }
    }
    
    handleResponsiveMenu();
    window.addEventListener('resize', handleResponsiveMenu);
    
    // Form validation for mobile (larger touch targets)
    const formInputs = document.querySelectorAll('input, select, textarea, button');
    
    formInputs.forEach(input => {
      input.addEventListener('invalid', function(e) {
        // Add specific class for mobile styling
        if (window.innerWidth <= 768) {
          input.classList.add('mobile-invalid');
        }
      });
      
      input.addEventListener('input', function() {
        input.classList.remove('mobile-invalid');
      });
    });
  });
  
  // Debounced resize handler for performance
  function debounce(func, wait = 200) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // Apply the debounce function to heavy resize handlers
  window.addEventListener('resize', debounce(function() {
    // Place heavy resize operations here
    // For example: complex chart redraws or grid recalculations
    
    // Adjust chart container heights
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
      if (window.innerWidth <= 480) {
        container.style.height = '250px';
      } else if (window.innerWidth <= 768) {
        container.style.height = '300px';
      } else {
        container.style.height = '350px';
      }
    });
  }, 250));