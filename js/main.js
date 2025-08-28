// ===== Notice System Initialization (from index.html) =====
function adjustNoticeTickerPosition() {
  try {
    const header = document.querySelector('header');
    const tickerBar = document.getElementById('notice-ticker-bar');
    if (header && tickerBar) {
      const headerHeight = header.offsetHeight;
      document.documentElement.style.setProperty('--calculated-header-height', headerHeight + 'px');
      tickerBar.style.top = headerHeight + 'px';
    }
  } catch (error) {
    if (window.SecurityUtils) {
      console.error('Error adjusting ticker position:', window.SecurityUtils.sanitizeForLogging(error.message));
    }
  }
}

function initializeNoticeSystem() {
  const tickerBar = document.getElementById('notice-ticker-bar');
  const countBadge = document.getElementById('notice-count-badge');
  if (!tickerBar || !countBadge) {
    setTimeout(initializeNoticeSystem, 100);
    return;
  }
  adjustNoticeTickerPosition();
  window.loadNoticesData();
}

window.addEventListener('resize', adjustNoticeTickerPosition);

// Always initialize notice system after DOMContentLoaded (short delay for DOM readiness)
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    initializeNoticeSystem();
  }, 500);
});
// ===== Notice Board System (from index.html, made global) =====
window.noticeState = {
  panelOpen: false,
  notices: [],
  isLoaded: false
};

window.toggleNoticePanel = function() {
  const panel = document.getElementById('notice-panel');
  window.noticeState.panelOpen = !window.noticeState.panelOpen;
  if (window.noticeState.panelOpen) {
    panel.classList.add('open');
    if (!window.noticeState.isLoaded) {
      window.loadNoticesData();
    }
  } else {
    panel.classList.remove('open');
  }
};

window.loadNoticesData = async function() {
  try {
    // Log data access attempt
    if (window.AuthUtils) {
      window.AuthUtils.logAccessAttempt('load_notices', 'notices_data');
    }
    
    window.noticeState.isLoaded = true;
    const cachedEventsData = localStorage.getItem('eventsData');
    const cachedTime = localStorage.getItem('eventsCacheTime');
    const now = Date.now();
    const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache
    let eventsData = [];
    if (cachedEventsData && cachedTime && (now - parseInt(cachedTime)) < CACHE_DURATION) {
      eventsData = JSON.parse(cachedEventsData);
    } else if (typeof firebase !== 'undefined' && firebase.firestore) {
      try {
        const db = firebase.firestore();
        const snapshot = await db.collection('events').orderBy('date', 'desc').limit(20).get();
        eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        localStorage.setItem('eventsData', JSON.stringify(eventsData));
        localStorage.setItem('eventsCacheTime', now.toString());
      } catch (error) {
        eventsData = window.getSampleNoticesData();
      }
    } else {
      eventsData = window.getSampleNoticesData();
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeNotices = eventsData.filter(notice => {
      if (notice.validUntil && notice.validUntil.trim() !== '') {
        const validUntilDate = new Date(notice.validUntil);
        validUntilDate.setHours(23, 59, 59, 999);
        return validUntilDate >= today;
      }
      return true;
    });
    window.noticeState.notices = activeNotices;
    window.updateNoticeTicker(activeNotices);
    window.renderNoticePanel(activeNotices);
  } catch (error) {
    const tickerText = document.getElementById('notice-ticker-text');
    if (tickerText) {
      tickerText.innerHTML = '<span class="ticker-item">📌 Error loading notices</span>';
    }
    if (window.SecurityUtils) {
      console.error('Notice loading error:', window.SecurityUtils.sanitizeForLogging(error.message));
    }
  }
};

window.getSampleNoticesData = function() {
  return [
    {
      id: '1',
      title: 'Mid-term Examination Schedule Released',
      date: '2025-07-27',
      validUntil: '2025-09-30',
      category: 'urgent',
      description: 'Mid-term examinations for all classes will commence from September 15, 2025. Students must prepare according to the detailed schedule available in the admissions section.'
    },
    {
      id: '2',
      title: 'Annual Sports Day - August 15, 2025',
      date: '2025-07-25',
      validUntil: '',
      category: 'events',
      description: 'Join us for a day full of sportsmanship and fun activities for all students. Participation forms available at the sports department.'
    },
    {
      id: '3',
      title: 'Science Exhibition - September 10, 2025',
      date: '2025-07-20',
      validUntil: '',
      category: 'academic',
      description: 'A platform for young innovators to showcase their projects and experiments. Registration deadline: August 25, 2025.'
    },
    {
      id: '4',
      title: 'Parent-Teacher Meeting - October 5, 2025',
      date: '2025-07-18',
      validUntil: '',
      category: 'general',
      description: 'Discuss your child\'s progress and participate in school development feedback sessions. Meeting timings: 9 AM to 4 PM.'
    },
    {
      id: '5',
      title: 'Holiday Notice - Independence Day',
      date: '2025-07-27',
      validUntil: '2025-08-15',
      category: 'urgent',
      description: 'School will remain closed on August 15, 2025, in observance of Independence Day. Regular classes will resume on August 16, 2025.'
    }
  ];
};

window.updateNoticeTicker = function(notices) {
  const tickerText = document.getElementById('notice-ticker-text');
  const countBadge = document.getElementById('notice-count-badge');
  if (!countBadge) return;
  if (notices.length === 0) {
    tickerText.innerHTML = '<span class="ticker-item">📌 No active notices at this time</span>';
    countBadge.textContent = '0';
    countBadge.classList.remove('show');
    return;
  }
  countBadge.textContent = notices.length;
  countBadge.classList.add('show');
  const tickerItems = notices.map(notice => {
    const categoryIcon = window.getCategoryIcon(notice.category);
    const urgentClass = notice.category === 'urgent' ? ' urgent' : '';
    const safeTitle = window.SecurityUtils ? window.SecurityUtils.sanitizeHTML(notice.title) : notice.title;
    return `<span class="ticker-item${urgentClass}">${categoryIcon} ${safeTitle}</span>`;
  }).join('');
  tickerText.innerHTML = tickerItems;
};

window.renderNoticePanel = function(notices) {
  const content = document.getElementById('notice-panel-content');
  if (notices.length === 0) {
    content.innerHTML = '<div class="notice-loading">No active notices at this time</div>';
    return;
  }
  const noticesHtml = notices.map(notice => {
    const formattedDate = window.formatNoticeDate(notice.date);
    const categoryIcon = window.getCategoryIcon(notice.category);
    const maxTitleLength = 80;
    const maxDescriptionLength = 120;
    const titleTruncated = notice.title.length > maxTitleLength;
    const descriptionTruncated = notice.description.length > maxDescriptionLength;
    const showReadMore = titleTruncated || descriptionTruncated;
    const safeTitle = window.SecurityUtils ? window.SecurityUtils.sanitizeHTML(notice.title) : notice.title;
    const safeDescription = window.SecurityUtils ? window.SecurityUtils.sanitizeHTML(notice.description) : notice.description;
    const displayTitle = titleTruncated ? safeTitle.substring(0, maxTitleLength) + '...' : safeTitle;
    const displayDescription = descriptionTruncated ? safeDescription.substring(0, maxDescriptionLength) + '...' : safeDescription;
    const escapedTitle = window.SecurityUtils ? window.SecurityUtils.escapeHTMLAttribute(notice.title) : notice.title.replace(/"/g, '&quot;');
    const escapedDescription = window.SecurityUtils ? window.SecurityUtils.escapeHTMLAttribute(notice.description) : notice.description.replace(/"/g, '&quot;');
    return `
      <div class="notice-item-panel ${notice.category}" data-notice-id="${notice.id}" data-expanded="false">
        <div class="notice-item-header">
          <span class="notice-category ${notice.category}">${categoryIcon} ${notice.category}</span>
          <span class="notice-date">${formattedDate}</span>
        </div>
        <div class="notice-title" data-full-title="${escapedTitle}">${displayTitle}</div>
        <div class="notice-description" data-full-description="${escapedDescription}">${displayDescription}</div>
        ${showReadMore ? `
          <div class="notice-action">
            <button class="notice-read-more-btn">
              <span>Read more</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="notice-read-less-btn" style="display: none;">
              <span>Read less</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M17 7L7 17M7 17H17M7 17V7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
  content.innerHTML = noticesHtml;
  const noticeItems = content.querySelectorAll('.notice-item-panel[data-notice-id]');
  content.addEventListener('click', function(e) {
    const readMoreBtn = e.target.closest('.notice-read-more-btn');
    const readLessBtn = e.target.closest('.notice-read-less-btn');
    if (readMoreBtn && readMoreBtn.style.display !== 'none') {
      e.stopPropagation();
      e.preventDefault();
      const noticeItem = readMoreBtn.closest('.notice-item-panel');
      if (noticeItem) {
        window.toggleNoticeExpansion(noticeItem);
      }
      return;
    }
    if (readLessBtn && readLessBtn.style.display !== 'none') {
      e.stopPropagation();
      e.preventDefault();
      const noticeItem = readLessBtn.closest('.notice-item-panel');
      if (noticeItem) {
        window.toggleNoticeExpansion(noticeItem);
      }
      return;
    }
  });
};

window.toggleNoticeExpansion = function(noticeItem) {
  const titleEl = noticeItem.querySelector('.notice-title');
  const descriptionEl = noticeItem.querySelector('.notice-description');
  const readMoreBtn = noticeItem.querySelector('.notice-read-more-btn');
  const readLessBtn = noticeItem.querySelector('.notice-read-less-btn');
  const currentTitle = titleEl.textContent;
  const currentDescription = descriptionEl.textContent;
  const fullTitle = titleEl.dataset.fullTitle;
  const fullDescription = descriptionEl.dataset.fullDescription;
  const isCurrentlyExpanded = (currentTitle === fullTitle && currentDescription === fullDescription);
  const maxTitleLength = 80;
  const maxDescriptionLength = 120;
  if (isCurrentlyExpanded) {
    const titleTruncated = fullTitle.length > maxTitleLength;
    const descriptionTruncated = fullDescription.length > maxDescriptionLength;
    const newTitle = titleTruncated ? fullTitle.substring(0, maxTitleLength) + '...' : fullTitle;
    const newDescription = descriptionTruncated ? fullDescription.substring(0, maxDescriptionLength) + '...' : fullDescription;
    titleEl.textContent = newTitle;
    descriptionEl.textContent = newDescription;
    titleEl.offsetHeight;
    descriptionEl.offsetHeight;
    noticeItem.classList.remove('expanded');
    noticeItem.dataset.expanded = 'false';
    if (readMoreBtn) readMoreBtn.style.display = 'inline-flex';
    if (readLessBtn) readLessBtn.style.display = 'none';
  } else {
    titleEl.textContent = fullTitle;
    descriptionEl.textContent = fullDescription;
    titleEl.offsetHeight;
    descriptionEl.offsetHeight;
    noticeItem.classList.add('expanded');
    noticeItem.dataset.expanded = 'true';
    if (readMoreBtn) readMoreBtn.style.display = 'none';
    if (readLessBtn) readLessBtn.style.display = 'inline-flex';
  }
};

window.getCategoryIcon = function(category) {
  const icons = {
    urgent: '🚨',
    academic: '📚',
    events: '🎉',
    general: '📋'
  };
  return icons[category] || '📌';
};

window.formatNoticeDate = function(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
};
// Vikas Public School JS - Enhanced mobile menu functionality

// Enhanced mobile menu functionality
function toggleMenu() {
  try {
    const nav = document.getElementById("main-nav");
    const hamburger = document.querySelector(".hamburger");
    
    if (!nav || !hamburger) {
      console.warn('Navigation elements not found');
      return;
    }
    
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
  } catch (error) {
    if (window.SecurityUtils) {
      console.error('Error toggling menu:', window.SecurityUtils.sanitizeForLogging(error.message));
    }
  }
}

// Close mobile menu function
function closeMobileMenu() {
  try {
    const nav = document.getElementById("main-nav");
    const hamburger = document.querySelector(".hamburger");
    
    if (nav && hamburger && nav.classList.contains("show")) {
      nav.classList.remove("show");
      hamburger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = '';
    }
  } catch (error) {
    if (window.SecurityUtils) {
      console.error('Error closing mobile menu:', window.SecurityUtils.sanitizeForLogging(error.message));
    }
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
  
  // Initialize dynamic breadcrumbs
  initializeDynamicBreadcrumbs();
  
  // Initialize reading progress
  initializeReadingProgress();
  
  // Initialize Notice Board
  initializeNoticeBoard();
  
  // Footer address will be loaded by Firebase in index.html
  // No need for separate loading here since Firebase handles it
  
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
    link.addEventListener('click', (e) => {
      // Check route access if AuthUtils is available
      if (window.AuthUtils) {
        const href = link.getAttribute('href');
        if (href && !window.AuthUtils.validateRouteAccess(href)) {
          e.preventDefault();
          console.warn('Access denied to route:', href);
          return;
        }
        window.AuthUtils.logAccessAttempt('navigation', href || 'unknown');
      }
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
      
      // Log navigation attempt
      if (window.AuthUtils) {
        window.AuthUtils.logAccessAttempt('scroll_navigation', href || 'unknown');
      }
      
      if (href.startsWith('#') && href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          // Calculate offset for sticky header
          const header = document.querySelector('header');
          if (header) {
            const headerHeight = header.offsetHeight;
            const targetPosition = target.offsetTop - headerHeight - 20;
            
            window.scrollTo({
              top: targetPosition,
              behavior: 'smooth'
            });
          }
          
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
  try {
    const backToTopBtn = document.getElementById('back-to-top');
    
    // Only add event listener if the button exists
    if (!backToTopBtn) {
      console.log('Back to top button not found on this page, skipping initialization');
      return;
    }
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', function() {
      try {
        if (window.pageYOffset > 300) {
          backToTopBtn.style.display = 'flex';
        } else {
          backToTopBtn.style.display = 'none';
        }
      } catch (error) {
        if (window.SecurityUtils) {
          console.error('Error in scroll handler:', window.SecurityUtils.sanitizeForLogging(error.message));
        }
      }
    });
  } catch (error) {
    if (window.SecurityUtils) {
      console.error('Error initializing back to top:', window.SecurityUtils.sanitizeForLogging(error.message));
    }
  }
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
  
  if (!modal) {
    console.log('Gallery modal not found on this page, skipping initialization');
    return;
  }
  
  const modalImg = modal.querySelector('.modal-content img');
  const modalClose = modal.querySelector('.close-modal');
  const modalPrev = modal.querySelector('.modal-prev');
  const modalNext = modal.querySelector('.modal-next');
  
  if (!modalImg || !modalClose) {
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

// Dynamic Breadcrumb Navigation System
function initializeDynamicBreadcrumbs() {
  const breadcrumbsNav = document.querySelector('.breadcrumbs');
  if (!breadcrumbsNav) return;

  // Section mapping for breadcrumbs
  const sectionMap = {
    'hero': { name: 'Home', parent: null },
    'about': { name: 'About Us', parent: 'hero' },
    'features': { name: 'Why Choose Us', parent: 'about' },
    'academics': { name: 'Academics', parent: 'about' },
    'admissions': { name: 'Admissions', parent: 'academics' },
    'infrastructure': { name: 'Infrastructure', parent: 'about' },
    'gallery': { name: 'Gallery', parent: 'infrastructure' },
    'achievements': { name: 'Achievements', parent: 'about' },
    'events': { name: 'Events & News', parent: 'achievements' },
    'contact': { name: 'Contact Us', parent: 'hero' }
  };

  let currentSection = 'hero';

  function updateBreadcrumbs(sectionId) {
    if (!sectionMap[sectionId] || currentSection === sectionId) return;
    currentSection = sectionId;

    const section = sectionMap[sectionId];
    const breadcrumbsList = breadcrumbsNav.querySelector('ol');
    
    // Clear existing breadcrumbs except home
    breadcrumbsList.innerHTML = `
      <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
        <a itemprop="item" href="#hero" onclick="document.getElementById('hero').scrollIntoView({behavior: 'smooth'})">
          <span itemprop="name">🏠 Home</span>
        </a>
        <meta itemprop="position" content="1" />
      </li>
    `;

    // Add current section if not home
    if (sectionId !== 'hero') {
      const sectionElement = document.getElementById(sectionId);
      const sectionTitle = sectionElement?.querySelector('h2')?.textContent || section.name;
      
      breadcrumbsList.innerHTML += `
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <span itemprop="name" class="current">📍 ${sectionTitle}</span>
          <meta itemprop="position" content="2" />
        </li>
      `;
    }
  }

  // Monitor scroll and update breadcrumbs
  let scrollTimeout;
  window.addEventListener('scroll', function() {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const sections = document.querySelectorAll('section, .hero');
      const scrollPosition = window.pageYOffset;
      let activeSection = 'hero';

      if (scrollPosition < 300) {
        activeSection = 'hero';
      } else {
        sections.forEach(section => {
          const sectionTop = section.offsetTop - 120;
          const sectionHeight = section.offsetHeight;
          const sectionId = section.getAttribute('id');
          
          if (sectionId && scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            activeSection = sectionId;
          }
        });
      }

      updateBreadcrumbs(activeSection);
    }, 100);
  }, { passive: true });

  // Initial update
  updateBreadcrumbs('hero');
}

// Notice Board Functionality
function initializeNoticeBoard() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const noticeItems = document.querySelectorAll('.notice-item');

  // Add click event listeners to filter buttons
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      const filter = this.getAttribute('data-filter');
      
      // Update active button
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Filter notices
      filterNotices(filter, noticeItems);
      
      // Announce filter change for screen readers
      const announcement = filter === 'all' 
        ? 'Showing all notices' 
        : `Showing ${filter} notices`;
      announceToScreenReader(announcement);
    });

    // Add keyboard navigation
    button.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
  });
}

function filterNotices(filter, noticeItems) {
  noticeItems.forEach(item => {
    const category = item.getAttribute('data-category');
    
    if (filter === 'all' || category === filter) {
      item.style.display = 'block';
      item.classList.remove('hidden');
      // Add animation
      setTimeout(() => {
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      }, 50);
    } else {
      item.style.opacity = '0';
      item.style.transform = 'translateY(20px)';
      setTimeout(() => {
        item.style.display = 'none';
        item.classList.add('hidden');
      }, 300);
    }
  });
}

function loadMoreNotices() {
  // This function can be enhanced to load more notices from Firebase
  // For now, it shows a message
  const announcement = 'Loading more notices...';
  announceToScreenReader(announcement);
  
  // Simulate loading - replace with actual Firebase call
  setTimeout(() => {
    announceToScreenReader('No more notices to load');
  }, 1000);
}

function announceToScreenReader(message) {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  const safeMessage = window.SecurityUtils ? window.SecurityUtils.sanitizeHTML(message) : message;
  announcement.textContent = safeMessage;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    if (announcement.parentNode) {
      document.body.removeChild(announcement);
    }
  }, 1000);
}

// Global function for the Load More button
window.loadMoreNotices = loadMoreNotices;

// School Address Database Integration using Firebase
function loadSchoolAddress() {
  // Log data access attempt
  if (window.AuthUtils) {
    window.AuthUtils.logAccessAttempt('load_address', 'school_address');
  }
  
  // Check if Firebase is available (loaded from index.html)
  if (typeof window.db !== 'undefined' && window.db) {
    console.log('Loading school address from Firebase...');
    
    // Load school info from Firebase (same as admin panel structure)
    Promise.all([
      window.db.collection('settings').doc('school-info').get(),
      window.db.collection('settings').doc('contact').get()
    ]).then(([schoolInfoDoc, contactDoc]) => {
      const schoolData = {};
      
      // Get school info data
      if (schoolInfoDoc.exists) {
        const schoolInfo = schoolInfoDoc.data();
        schoolData.name = schoolInfo.name || 'Vikas Public School';
        schoolData.address = schoolInfo.address || '';
        schoolData.phone = schoolInfo.phone || '';
        schoolData.email = schoolInfo.email || '';
      }
      
      // Get contact data (can override school info)
      if (contactDoc.exists) {
        const contactInfo = contactDoc.data();
        if (contactInfo.address) schoolData.address = contactInfo.address;
        if (contactInfo.phone) schoolData.phone = contactInfo.phone;
        if (contactInfo.email) schoolData.email = contactInfo.email;
        schoolData.hours = contactInfo.hours || '';
      }
      
      console.log('School data loaded from Firebase:', schoolData);
      updateAddressDisplay(schoolData);
      
    }).catch(error => {
      const errorMsg = window.SecurityUtils ? window.SecurityUtils.sanitizeForLogging(error.message) : error.message;
      console.error('Error loading school data from Firebase:', errorMsg);
      // Fallback to default values
      updateAddressDisplay({
        name: 'Vikas Public School',
        address: 'School Address, City',
        phone: '+91-XXXXXXXXXX',
        email: 'info@vikaspublicschool.edu'
      });
    });
  } else {
    console.log('Firebase not available, using default address data');
    // Fallback when Firebase is not available
    updateAddressDisplay({
      name: 'Vikas Public School',
      address: 'School Address, City',
      phone: '+91-XXXXXXXXXX',
      email: 'info@vikaspublicschool.edu'
    });
  }
}

function updateAddressDisplay(addressData) {
  try {
    const elements = {
      address: document.getElementById('db-address'),
      cityState: document.getElementById('db-city-state'),
      pincode: document.getElementById('db-pincode'),
      phone: document.getElementById('db-phone'),
      email: document.getElementById('db-email')
    };

    // Update address elements if they exist
    if (elements.address && addressData.address) {
      // For Firebase data, address is stored as a complete address
      // We'll display the full address in the address field
      elements.address.textContent = addressData.address;
    }
    
    // Hide city/state/pincode sections if using Firebase address format
    if (elements.cityState) {
      // If we have separate city/state data, use it; otherwise hide
      if (addressData.city && addressData.state) {
        elements.cityState.textContent = `${addressData.city}, ${addressData.state}`;
      } else {
        // Hide the city-state element if using complete address from Firebase
        const parentBr = elements.cityState.previousElementSibling;
        if (parentBr && parentBr.tagName === 'BR') {
          parentBr.style.display = 'none';
        }
        elements.cityState.style.display = 'none';
      }
    }
    
    if (elements.pincode) {
      if (addressData.pincode) {
        elements.pincode.textContent = addressData.pincode;
      } else {
        // Hide pincode section if not available
        const parentText = elements.pincode.parentNode;
        if (parentText) {
          const textNodes = Array.from(parentText.childNodes).filter(node => 
            node.nodeType === Node.TEXT_NODE && node.textContent.includes('PIN')
          );
          textNodes.forEach(node => node.textContent = '');
        }
        elements.pincode.style.display = 'none';
      }
    }
    
    if (elements.phone && addressData.phone) {
      elements.phone.textContent = addressData.phone;
      elements.phone.href = `tel:${addressData.phone.replace(/[^+\d]/g, '')}`;
    }
    
    if (elements.email && addressData.email) {
      elements.email.textContent = addressData.email;
      elements.email.href = `mailto:${addressData.email}`;
    }
  } catch (error) {
    if (window.SecurityUtils) {
      console.error('Error updating address display:', window.SecurityUtils.sanitizeForLogging(error.message));
    }
  }
}
