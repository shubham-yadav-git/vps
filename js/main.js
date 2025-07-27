// Vikas Public School JS - Enhanced mobile menu functionality

// Enhanced mobile menu functionality
function toggleMenu() {
  const nav = document.getElementById("main-nav");
  const hamburger = document.querySelector(".hamburger");
  const isExpanded = hamburger.getAttribute("aria-expanded") === "true";

  if (isExpanded) {
    nav.classList.remove("show");
    hamburger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = ''; // Re-enable scrolling
  } else {
    nav.classList.add("show");
    hamburger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }
}

// Close mobile menu function
function closeMobileMenu() {
  const nav = document.getElementById("main-nav");
  const hamburger = document.querySelector(".hamburger");
  
  if (nav && nav.classList.contains("show")) {
    nav.classList.remove("show");
    hamburger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = '';
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
  // Clean up any old theme data from localStorage
  localStorage.removeItem('theme');
  
  // Initialize back to top button
  initializeBackToTop();
  
  // Initialize navigation scroll indicators
  initializeNavScrollIndicators();
  
  // Initialize section highlighting
  initializeSectionHighlighting();
  
  // Initialize reading progress
  initializeReadingProgress();
  
  // Close menu when clicking outside
  document.addEventListener('click', function(event) {
    const nav = document.getElementById("main-nav");
    const hamburger = document.querySelector(".hamburger");
    const headerActions = document.querySelector(".header-actions");
    
    if (nav && nav.classList.contains("show") && 
        !nav.contains(event.target) && 
        !hamburger.contains(event.target) &&
        !headerActions.contains(event.target)) {
      closeMobileMenu();
    }
  });
  
  // Close menu when clicking nav links
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMobileMenu();
    });
  });
  
  // Handle escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeMobileMenu();
    }
  });
  
  // Enhanced smooth scroll for anchor links
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href.startsWith('#') && href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          // Calculate offset for sticky header
          const headerHeight = document.querySelector('header').offsetHeight;
          const targetPosition = target.offsetTop - headerHeight - 20;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
          
          // Close mobile menu after clicking
          closeMobileMenu();
          
          // Update URL without jumping
          history.pushState(null, null, href);
        }
      }
    });
  });
});

// Back to top functionality
function initializeBackToTop() {
  const backToTopBtn = document.getElementById('back-to-top');
  
  // Show/hide button based on scroll position
  window.addEventListener('scroll', function() {
    if (window.pageYOffset > 300) {
      backToTopBtn.style.display = 'flex';
    } else {
      backToTopBtn.style.display = 'none';
    }
  });
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

// Enhanced Navigation scroll indicators with page context awareness
function initializeNavScrollIndicators() {
  const navMenu = document.querySelector('.nav-menu');
  const mainNav = document.querySelector('.main-nav');
  
  if (!navMenu || !mainNav) return;
  
  function updateScrollIndicators() {
    const scrollLeft = navMenu.scrollLeft;
    const scrollWidth = navMenu.scrollWidth;
    const clientWidth = navMenu.clientWidth;
    const maxScroll = scrollWidth - clientWidth;
    
    // Get page scroll position for context awareness
    const pageScrollPosition = window.pageYOffset;
    const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
    const isAtTop = pageScrollPosition < 200; // At top of page
    const isAtBottom = pageScrollPosition > pageHeight - 200; // Near bottom of page
    
    // Context-aware indicator logic
    // Show left indicator if we can scroll left AND not at bottom of page
    if (scrollLeft > 5 && !isAtBottom) {
      mainNav.classList.add('scrollable-left');
    } else {
      mainNav.classList.remove('scrollable-left');
    }
    
    // Show right indicator if we can scroll right AND not at top of page
    if (scrollLeft < maxScroll - 5 && !isAtTop) {
      mainNav.classList.add('scrollable-right');
    } else {
      mainNav.classList.remove('scrollable-right');
    }
  }
  
  // Update indicators on navigation scroll
  navMenu.addEventListener('scroll', updateScrollIndicators, { passive: true });
  
  // Update indicators on page scroll for context awareness
  window.addEventListener('scroll', updateScrollIndicators, { passive: true });
  
  // Update indicators on resize
  window.addEventListener('resize', () => {
    setTimeout(updateScrollIndicators, 100);
  });
  
  // Initial update
  setTimeout(updateScrollIndicators, 100);
}

// Enhanced Section highlighting functionality with auto-scrolling navigation
function initializeSectionHighlighting() {
  const sections = document.querySelectorAll('section, .hero');
  const navLinks = document.querySelectorAll('.nav-link');
  const navMenu = document.querySelector('.nav-menu');
  let isScrolling = false;
  
  function highlightCurrentSection() {
    let currentSection = '';
    const scrollPosition = window.pageYOffset;
    
    // Check if we're at the top (hero section) - expanded range for better detection
    if (scrollPosition < 300) {
      currentSection = 'hero';
    } else {
      // Find the current section based on scroll position
      sections.forEach(section => {
        const sectionTop = section.offsetTop - 120; // Reduced offset for earlier triggering
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (sectionId && scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          currentSection = sectionId;
        }
      });
    }
    
    // Fallback: if no section detected and we're not at top, use the first visible section
    if (!currentSection && scrollPosition >= 300) {
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionId = section.getAttribute('id');
        
        if (sectionId && scrollPosition >= sectionTop - 200) {
          if (!currentSection) currentSection = sectionId;
        }
      });
    }
    
    // Update navigation highlighting
    let activeLink = null;
    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href === `#${currentSection}` || (currentSection === 'hero' && href === '#hero')) {
        link.classList.add('active');
        activeLink = link;
      }
    });
    
    // Auto-scroll navigation to show active item with a small delay for smoother experience
    if (activeLink && navMenu) {
      // Use setTimeout to debounce rapid scroll events
      clearTimeout(window.navScrollTimeout);
      window.navScrollTimeout = setTimeout(() => {
        autoScrollNavigation(activeLink);
      }, 50);
    }
  }
  
  function autoScrollNavigation(activeLink) {
    // Auto-scroll navigation for all screen sizes where horizontal scrolling might be needed
    if (navMenu.scrollWidth > navMenu.clientWidth) {
      const navMenuRect = navMenu.getBoundingClientRect();
      const activeLinkRect = activeLink.getBoundingClientRect();
      const activeHref = activeLink.getAttribute('href');
      
      // Special handling for Home (hero) section - ensure it's visible but not hidden under logo
      if (activeHref === '#hero') {
        // Calculate minimum scroll to show Home link properly
        const homeLink = activeLink;
        const homeLinkRect = homeLink.getBoundingClientRect();
        const navMenuLeft = navMenuRect.left;
        
        // If Home link is partially hidden on the left, scroll just enough to show it
        if (homeLinkRect.left < navMenuLeft + 50) { // 50px buffer from logo
          navMenu.scrollTo({
            left: Math.max(0, navMenu.scrollLeft - (navMenuLeft + 60 - homeLinkRect.left)),
            behavior: 'smooth'
          });
        }
        return;
      }
      
      // Special handling for Contact (last item) - scroll to end
      if (activeHref === '#contact') {
        navMenu.scrollTo({
          left: navMenu.scrollWidth - navMenu.clientWidth,
          behavior: 'smooth'
        });
        return;
      }
      
      // For middle items, center them in the navigation
      const navMenuCenter = navMenuRect.width / 2;
      const activeLinkCenter = activeLinkRect.left - navMenuRect.left + (activeLinkRect.width / 2);
      
      // Calculate how much we need to scroll to center the active link
      const scrollOffset = activeLinkCenter - navMenuCenter;
      
      // Smooth scroll the navigation menu
      navMenu.scrollTo({
        left: navMenu.scrollLeft + scrollOffset,
        behavior: 'smooth'
      });
    }
  }
  
  function throttledHighlightSection() {
    if (!isScrolling) {
      requestAnimationFrame(() => {
        highlightCurrentSection();
        isScrolling = false;
      });
      isScrolling = true;
    }
  }
  
  // Enhanced throttled scroll handler for smoother navigation updates
  let scrollTimeout;
  function handleScroll() {
    throttledHighlightSection();
    
    // Also update after scrolling stops for accuracy
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      highlightCurrentSection();
    }, 150);
  }
  
  // Initial highlight
  highlightCurrentSection();
  
  // Update on scroll with enhanced throttling for better performance
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Update on resize to recalculate positions
  window.addEventListener('resize', () => {
    setTimeout(highlightCurrentSection, 100);
  });
}

// Reading progress functionality
function initializeReadingProgress() {
  const progressBar = document.getElementById('reading-progress');
  
  function updateProgress() {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    
    progressBar.style.width = scrollPercent + '%';
  }
  
  window.addEventListener('scroll', updateProgress);
}

// Simple form validation and submission handler
function handleSubmit(event) {
  event.preventDefault();

  const name = document.getElementById("name");
  const email = document.getElementById("email");
  const nameError = document.getElementById("name-error");
  const emailError = document.getElementById("email-error");
  let valid = true;

  if (!name.value.trim()) {
    nameError.style.display = "block";
    valid = false;
    name.focus();
  } else {
    nameError.style.display = "none";
  }

  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!email.value.trim() || !emailPattern.test(email.value.trim())) {
    emailError.style.display = "block";
    if (valid) email.focus();
    valid = false;
  } else {
    emailError.style.display = "none";
  }

  if (valid) {
    // Create success notification
    showNotification("Thank you for contacting Vikas Public School. We will get back to you shortly.", "success");
    event.target.reset();
  }

  return false;
}

// Enhanced notification system
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? 'var(--success-color)' : 'var(--primary-color)'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-lg);
    z-index: 10000;
    font-family: inherit;
    font-size: 0.9rem;
    max-width: 300px;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Show notification
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Hide and remove notification
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 4000);
}

// FAQ toggle functionality
window.addEventListener("DOMContentLoaded", () => {
  const faqButtons = document.querySelectorAll(".faq-question");
  faqButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      // Collapse all others
      faqButtons.forEach((otherBtn) => {
        if (otherBtn !== btn) {
          otherBtn.setAttribute("aria-expanded", "false");
          otherBtn.parentElement.classList.remove("open");
        }
      });
      // Toggle current
      btn.setAttribute("aria-expanded", String(!expanded));
      btn.parentElement.classList.toggle("open", !expanded);
    });
  });
});

// Modal logic for gallery images - Updated to handle dynamic content
document.addEventListener('DOMContentLoaded', function () {
  initializeGalleryModal();
});

function initializeGalleryModal() {
  const modal = document.querySelector('.gallery-modal');
  const modalImg = modal.querySelector('.modal-content img');
  const modalClose = modal.querySelector('.close-modal');
  const modalPrev = modal.querySelector('.modal-prev');
  const modalNext = modal.querySelector('.modal-next');
  
  if (!modal || !modalImg || !modalClose) {
    console.log('Gallery modal elements not found');
    return;
  }

  // Function to attach events to gallery links
  function attachGalleryEvents() {
    const galleryLinks = document.querySelectorAll('.gallery-link');
    let currentIndex = 0;
    const totalImages = galleryLinks.length;
    
    galleryLinks.forEach((link, index) => {
      // Remove existing listeners to prevent duplicates
      link.removeEventListener('click', handleGalleryClick);
      link.addEventListener('click', (e) => handleGalleryClick(e, index));
    });

    // Navigation functions
    function showImage(index) {
      currentIndex = index;
      const imgSrc = galleryLinks[index].querySelector('img').src;
      modalImg.src = imgSrc;
      
      // Update navigation buttons visibility
      if (modalPrev) modalPrev.style.display = index === 0 ? 'none' : 'flex';
      if (modalNext) modalNext.style.display = index === totalImages - 1 ? 'none' : 'flex';
    }

    // Add navigation event listeners
    if (modalPrev) {
      modalPrev.addEventListener('click', () => {
        if (currentIndex > 0) showImage(currentIndex - 1);
      });
    }

    if (modalNext) {
      modalNext.addEventListener('click', () => {
        if (currentIndex < totalImages - 1) showImage(currentIndex + 1);
      });
    }
  }

  function handleGalleryClick(e, index) {
    e.preventDefault();
    modal.classList.add('active');
    const imgSrc = e.currentTarget.querySelector('img').src;
    modalImg.src = imgSrc;
    modalImg.onload = () => {
      modal.querySelector('.modal-content').style.opacity = '1';
    };
  }

  function closeModal() {
    modal.classList.remove('active');
    setTimeout(() => {
      modalImg.src = '';
      modal.querySelector('.modal-content').style.opacity = '0';
    }, 300);
  }

  // Attach close events (only once)
  modalClose.removeEventListener('click', closeModal);
  modalClose.addEventListener('click', closeModal);
  
  modalClose.removeEventListener('keypress', handleCloseKeypress);
  modalClose.addEventListener('keypress', handleCloseKeypress);

  function handleCloseKeypress(e) {
    if (e.key === 'Enter' || e.key === ' ') closeModal();
  }

  // Close modal when clicking outside the image
  modal.removeEventListener('click', handleModalClick);
  modal.addEventListener('click', handleModalClick);

  function handleModalClick(e) {
    if (e.target === modal) closeModal();
  }

  // Close modal on Escape key
  document.removeEventListener('keydown', handleEscapeKey);
  document.addEventListener('keydown', handleEscapeKey);

  function handleEscapeKey(e) {
    if (modal.style.display === 'block' && e.key === 'Escape') closeModal();
  }

  // Initial attachment
  attachGalleryEvents();
  
  // Make attachGalleryEvents globally available for Firebase updates
  window.attachGalleryEvents = attachGalleryEvents;
}
