// Main JavaScript for Ambedkarite Buddhist Community Website
// Modern Minimalist Design - Variant 1

// ==================== MOBILE NAVIGATION ====================
document.addEventListener('DOMContentLoaded', function() {
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (navToggle) {
    navToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
      this.textContent = navMenu.classList.contains('active') ? '✕' : '☰';
    });

    // Close menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        navMenu.classList.remove('active');
        navToggle.textContent = '☰';
      });
    });
  }
});

// ==================== STICKY NAVBAR SCROLL EFFECT ====================
window.addEventListener('scroll', function() {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
});

// ==================== TAB FUNCTIONALITY ====================
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetTab = this.dataset.tab;

      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Add active class to clicked button and corresponding content
      this.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
    });
  });
}

// Initialize tabs on page load
document.addEventListener('DOMContentLoaded', initTabs);

// ==================== FILTER FUNCTIONALITY ====================
function initFilters() {
  const filterButtons = document.querySelectorAll('.filter-button');
  const filterItems = document.querySelectorAll('[data-category]');

  if (filterButtons.length === 0) return;

  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      const filterValue = this.dataset.filter;

      // Update active state
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');

      // Filter items
      filterItems.forEach(item => {
        if (filterValue === 'all' || item.dataset.category === filterValue) {
          item.style.display = '';
          item.classList.add('fade-in');
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

// Initialize filters on page load
document.addEventListener('DOMContentLoaded', initFilters);

// ==================== LIGHTBOX GALLERY ====================
function initLightbox() {
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.getElementById('lightbox');

  if (!lightbox) return;

  const lightboxImg = lightbox.querySelector('img');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  const prevBtn = lightbox.querySelector('.lightbox-prev');
  const nextBtn = lightbox.querySelector('.lightbox-next');

  let currentIndex = 0;
  const images = Array.from(galleryItems).map(item => item.querySelector('img').src);

  // Open lightbox
  galleryItems.forEach((item, index) => {
    item.addEventListener('click', function() {
      currentIndex = index;
      showImage(currentIndex);
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  // Close lightbox
  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  closeBtn?.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', function(e) {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // Navigation
  function showImage(index) {
    if (index < 0) index = images.length - 1;
    if (index >= images.length) index = 0;
    currentIndex = index;
    lightboxImg.src = images[index];
  }

  prevBtn?.addEventListener('click', function() {
    showImage(currentIndex - 1);
  });

  nextBtn?.addEventListener('click', function() {
    showImage(currentIndex + 1);
  });

  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (!lightbox.classList.contains('active')) return;

    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
    if (e.key === 'ArrowRight') showImage(currentIndex + 1);
  });
}

// Initialize lightbox on page load
document.addEventListener('DOMContentLoaded', initLightbox);

// ==================== FORM VALIDATION ====================
function validateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    let isValid = true;

    inputs.forEach(input => {
      if (!input.value.trim()) {
        isValid = false;
        input.style.borderColor = '#ef4444';
      } else {
        input.style.borderColor = '';
      }
    });

    // Email validation
    const emailInputs = form.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (input.value && !emailRegex.test(input.value)) {
        isValid = false;
        input.style.borderColor = '#ef4444';
      }
    });

    if (isValid) {
      showSuccessMessage(form);
      form.reset();
    } else {
      alert('Please fill in all required fields correctly.');
    }
  });
}

function showSuccessMessage(form) {
  const message = document.createElement('div');
  message.className = 'success-message';
  message.textContent = 'Form submitted successfully! We will get back to you soon.';
  message.style.cssText = `
    background: #10b981;
    color: white;
    padding: 1rem;
    border-radius: 8px;
    margin-top: 1rem;
    text-align: center;
    animation: fadeIn 0.3s ease;
  `;

  form.appendChild(message);

  setTimeout(() => {
    message.remove();
  }, 5000);
}

// Initialize form validation for all forms
document.addEventListener('DOMContentLoaded', function() {
  const forms = document.querySelectorAll('form');
  forms.forEach((form, index) => {
    if (form.id) {
      validateForm(form.id);
    } else {
      form.id = `form-${index}`;
      validateForm(form.id);
    }
  });
});

// ==================== PROGRESS BAR ANIMATION ====================
function animateProgressBars() {
  const progressBars = document.querySelectorAll('.progress-fill');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const targetWidth = entry.target.dataset.progress;
        entry.target.style.width = targetWidth + '%';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  progressBars.forEach(bar => {
    bar.style.width = '0%';
    observer.observe(bar);
  });
}

// Initialize progress bar animations
document.addEventListener('DOMContentLoaded', animateProgressBars);

// ==================== SMOOTH SCROLL ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href === '#') return;

    e.preventDefault();
    const target = document.querySelector(href);

    if (target) {
      const offsetTop = target.offsetTop - 80; // Account for sticky navbar
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  });
});

// ==================== DONATION AMOUNT SELECTION ====================
function initDonationForm() {
  const amountButtons = document.querySelectorAll('.amount-button');
  const customAmountInput = document.getElementById('custom-amount');

  if (amountButtons.length === 0) return;

  amountButtons.forEach(button => {
    button.addEventListener('click', function() {
      amountButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');

      if (customAmountInput) {
        customAmountInput.value = '';
      }
    });
  });

  if (customAmountInput) {
    customAmountInput.addEventListener('input', function() {
      if (this.value) {
        amountButtons.forEach(btn => btn.classList.remove('active'));
      }
    });
  }
}

// Initialize donation form
document.addEventListener('DOMContentLoaded', initDonationForm);

// ==================== FADE IN ON SCROLL ====================
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('.card, .stat-item, .tier-card');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-up');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  animatedElements.forEach(el => {
    observer.observe(el);
  });
}

// Initialize scroll animations
document.addEventListener('DOMContentLoaded', initScrollAnimations);

// ==================== COUNTDOWN TIMER FOR EVENTS ====================
function initCountdowns() {
  const countdownElements = document.querySelectorAll('[data-countdown]');

  countdownElements.forEach(element => {
    const targetDate = new Date(element.dataset.countdown).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        element.textContent = 'Event Started!';
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

      element.textContent = `${days}d ${hours}h ${minutes}m`;
    };

    updateCountdown();
    setInterval(updateCountdown, 60000); // Update every minute
  });
}

// Initialize countdowns
document.addEventListener('DOMContentLoaded', initCountdowns);

// ==================== ACTIVE PAGE HIGHLIGHT ====================
document.addEventListener('DOMContentLoaded', function() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-menu a');

  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
});
