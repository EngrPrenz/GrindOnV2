document.addEventListener('DOMContentLoaded', function() {
    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        themeToggle.checked = true;
    }

    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    });

    // Profile picture preview
    const profilePictureInput = document.getElementById('profile-picture');
    const currentPicture = document.querySelector('.current-picture img');
    const removePictureBtn = document.getElementById('remove-picture');

    profilePictureInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    currentPicture.src = e.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                alert('Please select an image file');
            }
        }
    });

    removePictureBtn.addEventListener('click', function() {
        currentPicture.src = 'default-avatar.png'; // Set to default avatar
        profilePictureInput.value = ''; // Clear the file input
    });

    // Form submissions
    const profileForm = document.getElementById('profile-form');
    const passwordForm = document.getElementById('password-form');

    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const displayName = formData.get('display-name');
        
        // Validate display name
        if (displayName.trim().length < 3) {
            alert('Display name must be at least 3 characters long');
            return;
        }

        // Here you would typically send the form data to your server
        // For now, we'll just show a success message
        alert('Profile updated successfully');
    });

    passwordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const currentPassword = this.querySelector('[name="current-password"]').value;
        const newPassword = this.querySelector('[name="new-password"]').value;
        const confirmPassword = this.querySelector('[name="confirm-password"]').value;

        // Validate passwords
        if (newPassword.length < 8) {
            alert('New password must be at least 8 characters long');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }

        // Here you would typically send the password data to your server
        // For now, we'll just show a success message
        alert('Password updated successfully');
        this.reset();
    });

    // Page transition effect
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) return;
            
            e.preventDefault();
            const href = this.getAttribute('href');
            
            // Add fade-out effect
            document.body.style.opacity = '0';
            
            setTimeout(() => {
                window.location.href = href;
            }, 300);
        });
    });

    // Add fade-in effect when page loads
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
}); 

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