// UI Components and Utilities

// Reading Progress Bar
function updateReadingProgress() {
  const progressBar = document.getElementById('reading-progress');
  if (!progressBar) return;
  
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = (scrollTop / scrollHeight) * 100;
  
  progressBar.style.width = Math.min(progress, 100) + '%';
}

// Back to Top functionality
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

// Show/hide back to top button
function toggleBackToTop() {
  const backToTopBtn = document.getElementById('back-to-top');
  if (!backToTopBtn) return;
  
  if (window.pageYOffset > 300) {
    backToTopBtn.style.display = 'flex';
  } else {
    backToTopBtn.style.display = 'none';
  }
}

// Refresh functionality
function showRefreshNotification() {
  const notification = document.createElement('div');
  notification.style.cssText = "position:fixed;top:20px;right:20px;background:#10b981;color:white;padding:12px 20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:10000;font-family:inherit;font-size:14px;opacity:0;transform:translateX(100%);transition:all 0.3s ease;";
  notification.textContent = 'Content refreshed successfully!';
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) notification.parentNode.removeChild(notification);
    }, 300);
  }, 3000);
}

// Initialize UI components
function initializeUIComponents() {
  // Reading progress
  window.addEventListener('scroll', updateReadingProgress);
  
  // Back to top button
  window.addEventListener('scroll', toggleBackToTop);
  
  // Refresh button
  const refreshBtn = document.getElementById('refresh-fab');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function() {
      let refreshed = false;
      if (typeof forceRefreshContent === 'function') {
        try {
          forceRefreshContent();
          refreshed = true;
        } catch (e) {
          refreshed = false;
        }
      }
      if (!refreshed) {
        localStorage.setItem('showRefreshNotification', '1');
        location.reload();
      } else {
        if (typeof showUpdateNotification === 'function') {
          showUpdateNotification('Content refreshed successfully!');
        } else {
          showRefreshNotification();
        }
      }
    });
  }
  
  // Show notification after reload if flag is set
  if (localStorage.getItem('showRefreshNotification') === '1') {
    localStorage.removeItem('showRefreshNotification');
    showRefreshNotification();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeUIComponents);
} else {
  initializeUIComponents();
}

// Make functions globally available
window.scrollToTop = scrollToTop;
window.showRefreshNotification = showRefreshNotification;