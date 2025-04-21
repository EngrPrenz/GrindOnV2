// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    initTheme();
    
    // Initialize circle progress bars
    initCircleProgress();
    
    // Add event listener for theme toggle
    document.getElementById('themeToggle').addEventListener('change', toggleTheme);
  });
  
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
    
    // Update progress circles based on theme
    updateProgressCircles();
  }
  
  // Toggle theme function
  function toggleTheme() {
    const themeToggle = document.getElementById('themeToggle');
    
    if (themeToggle.checked) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
    
    // Update progress circles based on theme
    updateProgressCircles();
  }
  
  // Initialize circle progress bars
  function initCircleProgress() {
    const progressCircles = document.querySelectorAll('.progress-circle');
    
    progressCircles.forEach(circle => {
      const value = circle.getAttribute('data-value');
      circle.style.setProperty('--value', value + '%');
    });
  }
  
  // Update progress circles based on theme
  function updateProgressCircles() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const progressCircles = document.querySelectorAll('.progress-circle');
    
    progressCircles.forEach(circle => {
      const value = circle.getAttribute('data-value');
      const circleBackground = isDarkMode 
        ? `conic-gradient(var(--primary-color) 0% ${value}%, #2d3748 ${value}% 100%)`
        : `conic-gradient(var(--primary-color) 0% ${value}%, #e2e8f0 ${value}% 100%)`;
      
      circle.style.background = circleBackground;
    });
  }