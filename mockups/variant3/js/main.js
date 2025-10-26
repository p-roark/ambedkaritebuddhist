// Variant 3: Interactive JavaScript

// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const mobileMenu = document.querySelector('.mobile-menu');
const body = document.body;

if (hamburger) {
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
  });
}

// Close mobile menu when clicking on a link
const mobileLinks = document.querySelectorAll('.mobile-menu a');
mobileLinks.forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
    hamburger.classList.remove('active');
  });
});

// Header Scroll Effect
let lastScroll = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;

  if (currentScroll > 100) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }

  lastScroll = currentScroll;
});

// Scroll Reveal Animation
const revealElements = document.querySelectorAll('.reveal');

const revealOnScroll = () => {
  const windowHeight = window.innerHeight;

  revealElements.forEach(element => {
    const elementTop = element.getBoundingClientRect().top;
    const revealPoint = 100;

    if (elementTop < windowHeight - revealPoint) {
      element.classList.add('active');
    }
  });
};

if (revealElements.length > 0) {
  window.addEventListener('scroll', revealOnScroll);
  revealOnScroll(); // Initial check
}

// Filter Functionality
const filterButtons = document.querySelectorAll('.filter-btn');
const filterableItems = document.querySelectorAll('[data-category]');

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;

    // Update active button
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    // Filter items
    filterableItems.forEach(item => {
      if (filter === 'all' || item.dataset.category === filter) {
        item.style.display = 'block';
        item.style.animation = 'fadeIn 0.5s ease';
      } else {
        item.style.display = 'none';
      }
    });
  });
});

// Tab Functionality
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const targetTab = button.dataset.tab;

    // Update active button
    tabButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    // Show target content
    tabContents.forEach(content => {
      if (content.id === targetTab) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
  });
});

// Lightbox Gallery
const galleryItems = document.querySelectorAll('.gallery-item');
const lightbox = document.querySelector('.lightbox');
const lightboxImage = document.querySelector('.lightbox-image');
const lightboxClose = document.querySelector('.lightbox-close');

galleryItems.forEach(item => {
  item.addEventListener('click', () => {
    const imgSrc = item.querySelector('img').src;
    lightboxImage.src = imgSrc;
    lightbox.classList.add('active');
    body.style.overflow = 'hidden';
  });
});

if (lightboxClose) {
  lightboxClose.addEventListener('click', () => {
    lightbox.classList.remove('active');
    body.style.overflow = 'auto';
  });
}

if (lightbox) {
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.classList.remove('active');
      body.style.overflow = 'auto';
    }
  });
}

// Form Validation
const forms = document.querySelectorAll('form');

forms.forEach(form => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Basic validation
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    let isValid = true;

    inputs.forEach(input => {
      if (!input.value.trim()) {
        isValid = false;
        input.style.borderColor = 'red';
      } else {
        input.style.borderColor = '';
      }
    });

    if (isValid) {
      // Show success message
      alert('Form submitted successfully! (This is a mockup - no data is actually sent)');
      form.reset();
    } else {
      alert('Please fill in all required fields.');
    }
  });
});

// Progress Bar Animation
const progressBars = document.querySelectorAll('.progress-fill');

const animateProgress = () => {
  progressBars.forEach(bar => {
    const targetWidth = bar.dataset.progress;
    const rect = bar.getBoundingClientRect();

    if (rect.top < window.innerHeight && rect.bottom > 0) {
      bar.style.width = targetWidth + '%';
    }
  });
};

if (progressBars.length > 0) {
  window.addEventListener('scroll', animateProgress);
  window.addEventListener('load', animateProgress);
  animateProgress(); // Initial check
}

// Counter Animation
const counters = document.querySelectorAll('.stat-number');

const animateCounter = (counter) => {
  const target = parseInt(counter.dataset.target);
  const duration = 2000; // 2 seconds
  const increment = target / (duration / 16); // 60fps
  let current = 0;

  const updateCounter = () => {
    current += increment;
    if (current < target) {
      counter.textContent = Math.floor(current);
      requestAnimationFrame(updateCounter);
    } else {
      counter.textContent = target;
    }
  };

  updateCounter();
};

const observeCounters = () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
        animateCounter(entry.target);
        entry.target.classList.add('counted');
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => observer.observe(counter));
};

if (counters.length > 0) {
  observeCounters();
}

// Smooth Scroll for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href !== '#' && href !== '#!') {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  });
});

// Active Navigation Link
const navLinks = document.querySelectorAll('.nav-menu a');
const currentPage = window.location.pathname.split('/').pop() || 'index.html';

navLinks.forEach(link => {
  const linkPage = link.getAttribute('href');
  if (linkPage === currentPage) {
    link.classList.add('active');
  }
});

// Search Functionality (if search exists)
const searchInput = document.querySelector('.search-input');
const searchableItems = document.querySelectorAll('[data-searchable]');

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();

    searchableItems.forEach(item => {
      const text = item.textContent.toLowerCase();
      if (text.includes(searchTerm)) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  });
}

// Donation Amount Selection
const donationButtons = document.querySelectorAll('.donation-amount-btn');
const customAmountInput = document.querySelector('#custom-amount');

donationButtons.forEach(button => {
  button.addEventListener('click', () => {
    donationButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    if (customAmountInput) {
      customAmountInput.value = '';
    }
  });
});

if (customAmountInput) {
  customAmountInput.addEventListener('input', () => {
    donationButtons.forEach(btn => btn.classList.remove('active'));
  });
}

// Event Registration Modal (if exists)
const registerButtons = document.querySelectorAll('.btn-register');
const modal = document.querySelector('.modal');
const modalClose = document.querySelector('.modal-close');

registerButtons.forEach(button => {
  button.addEventListener('click', (e) => {
    e.preventDefault();
    if (modal) {
      modal.classList.add('active');
      body.style.overflow = 'hidden';
    }
  });
});

if (modalClose) {
  modalClose.addEventListener('click', () => {
    modal.classList.remove('active');
    body.style.overflow = 'auto';
  });
}

// Tooltip Functionality
const tooltips = document.querySelectorAll('[data-tooltip]');

tooltips.forEach(element => {
  element.addEventListener('mouseenter', (e) => {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = element.dataset.tooltip;
    document.body.appendChild(tooltip);

    const rect = element.getBoundingClientRect();
    tooltip.style.position = 'absolute';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
  });

  element.addEventListener('mouseleave', () => {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  });
});

// Back to Top Button
const backToTop = document.querySelector('.back-to-top');

if (backToTop) {
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 500) {
      backToTop.style.display = 'flex';
    } else {
      backToTop.style.display = 'none';
    }
  });

  backToTop.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// Newsletter Form
const newsletterForm = document.querySelector('.newsletter-form');

if (newsletterForm) {
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = newsletterForm.querySelector('input[type="email"]').value;

    if (email) {
      alert('Thank you for subscribing! (This is a mockup - no data is actually sent)');
      newsletterForm.reset();
    }
  });
}

// Initialize on page load
window.addEventListener('load', () => {
  // Remove loading screen if exists
  const loader = document.querySelector('.loader');
  if (loader) {
    loader.style.display = 'none';
  }

  // Trigger initial animations
  revealOnScroll();
  animateProgress();
});

// Keyboard Accessibility
document.addEventListener('keydown', (e) => {
  // Close modals with Escape key
  if (e.key === 'Escape') {
    if (lightbox && lightbox.classList.contains('active')) {
      lightbox.classList.remove('active');
      body.style.overflow = 'auto';
    }
    if (modal && modal.classList.contains('active')) {
      modal.classList.remove('active');
      body.style.overflow = 'auto';
    }
    if (mobileMenu && mobileMenu.classList.contains('active')) {
      mobileMenu.classList.remove('active');
      hamburger.classList.remove('active');
    }
  }
});

console.log('Ambedkarite Buddhist Community - Variant 3 Loaded ✨');
