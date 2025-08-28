// Notice Board System - Ticker and Panel Functionality

// Notice Ticker Bar & Panel Functionality
window.noticeState = {
  panelOpen: false,
  notices: [],
  isLoaded: false
};

function toggleNoticePanel() {
  const panel = document.getElementById('notice-panel');
  
  window.noticeState.panelOpen = !window.noticeState.panelOpen;
  
  if (window.noticeState.panelOpen) {
    panel.classList.add('open');
    
    // Load notices if not already loaded
    if (!window.noticeState.isLoaded) {
      loadNoticesData();
    }
  } else {
    panel.classList.remove('open');
  }
}

async function loadNoticesData() {
  try {
    window.noticeState.isLoaded = true;
    
    // Use the same Firebase data that the main page uses
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
        
        // Cache the data
        localStorage.setItem('eventsData', JSON.stringify(eventsData));
        localStorage.setItem('eventsCacheTime', now.toString());
      } catch (error) {
        console.warn('Firebase error for notices, using sample data:', error);
        eventsData = getSampleNoticesData();
      }
    } else {
      eventsData = getSampleNoticesData();
    }
    
    // Filter and sort notices (show only recent and active ones)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for proper comparison
    console.log('Today\'s date (start of day):', today.toISOString());
    
    const activeNotices = eventsData.filter(notice => {
      if (notice.validUntil && notice.validUntil.trim() !== '') {
        const validUntilDate = new Date(notice.validUntil);
        validUntilDate.setHours(23, 59, 59, 999); // Set to end of day
        const isValid = validUntilDate >= today;
        console.log(`Notice "${notice.title}": validUntil=${notice.validUntil}, parsed date=${validUntilDate.toISOString()}, isValid=${isValid}`);
        return isValid;
      }
      console.log(`Notice "${notice.title}": no validUntil or empty, including`);
      return true;
    });
    
    console.log(`Total notices: ${eventsData.length}, Active notices: ${activeNotices.length}`);
    console.log('Active notices:', activeNotices.map(n => n.title));
    
    window.noticeState.notices = activeNotices;
    updateNoticeTicker(activeNotices);
    renderNoticePanel(activeNotices);
    
  } catch (error) {
    console.error('Error loading notices:', error);
    const tickerText = document.getElementById('notice-ticker-text');
    tickerText.innerHTML = '<span class="ticker-item">📌 Error loading notices</span>';
  }
}

function getSampleNoticesData() {
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
}

function updateNoticeTicker(notices) {
  const tickerText = document.getElementById('notice-ticker-text');
  const countBadge = document.getElementById('notice-count-badge');
  
  console.log(`updateNoticeTicker called with ${notices.length} notices`);
  console.log('countBadge element:', countBadge);
  
  if (!countBadge) {
    console.error('notice-count-badge element not found!');
    return;
  }
  
  if (notices.length === 0) {
    tickerText.innerHTML = '<span class="ticker-item">📌 No active notices at this time</span>';
    countBadge.textContent = '0';
    countBadge.classList.remove('show');
    console.log('Set badge to 0, removed show class');
    return;
  }
  
  // Update count badge
  countBadge.textContent = notices.length;
  countBadge.classList.add('show');
  console.log(`Set badge count to: ${notices.length}, added show class`);
  console.log('Badge classes:', countBadge.classList.toString());
  
  // Create ticker items
  const tickerItems = notices.map(notice => {
    const categoryIcon = getCategoryIcon(notice.category);
    const urgentClass = notice.category === 'urgent' ? ' urgent' : '';
    return `<span class="ticker-item${urgentClass}">${categoryIcon} ${notice.title}</span>`;
  }).join('');
  
  tickerText.innerHTML = tickerItems;
}

function renderNoticePanel(notices) {
  const content = document.getElementById('notice-panel-content');
  
  if (notices.length === 0) {
    content.innerHTML = '<div class="notice-loading">No active notices at this time</div>';
    return;
  }
  
  const noticesHtml = notices.map(notice => {
    const formattedDate = formatNoticeDate(notice.date);
    const categoryIcon = getCategoryIcon(notice.category);
    
    // Create truncated versions for display
    const maxTitleLength = 80;
    const maxDescriptionLength = 120;
    
    const titleTruncated = notice.title.length > maxTitleLength;
    const descriptionTruncated = notice.description.length > maxDescriptionLength;
    const showReadMore = titleTruncated || descriptionTruncated;
    
    const displayTitle = titleTruncated ? notice.title.substring(0, maxTitleLength) + '...' : notice.title;
    const displayDescription = descriptionTruncated ? notice.description.substring(0, maxDescriptionLength) + '...' : notice.description;
    
    return `
      <div class="notice-item-panel ${notice.category}" data-notice-id="${notice.id}" data-expanded="false">
        <div class="notice-item-header">
          <span class="notice-category ${notice.category}">${categoryIcon} ${notice.category}</span>
          <span class="notice-date">${formattedDate}</span>
        </div>
        <div class="notice-title" data-full-title="${notice.title.replace(/"/g, '&quot;')}">${displayTitle}</div>
        <div class="notice-description" data-full-description="${notice.description.replace(/"/g, '&quot;')}">${displayDescription}</div>
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
  
  // Add click event listeners to notice items in panel (different class than main notices)
  const noticeItems = content.querySelectorAll('.notice-item-panel[data-notice-id]');
  console.log('Found notice items in panel:', noticeItems.length);
  
  // Add click event handlers for expansion only
  content.addEventListener('click', function(e) {
    // Check if clicked on read more or read less button (only if visible)
    const readMoreBtn = e.target.closest('.notice-read-more-btn');
    const readLessBtn = e.target.closest('.notice-read-less-btn');
    // Only respond to clicks on visible buttons
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
    // No modal opening - cards only expand/collapse
    // Users can read full content by clicking "Read more"
  });
}

// Function to toggle notice expansion - moved outside renderNoticePanel
window.toggleNoticeExpansion = function(noticeItem) {
  const titleEl = noticeItem.querySelector('.notice-title');
  const descriptionEl = noticeItem.querySelector('.notice-description');
  const readMoreBtn = noticeItem.querySelector('.notice-read-more-btn');
  const readLessBtn = noticeItem.querySelector('.notice-read-less-btn');
  
  // Check if currently showing full content by comparing with stored full content
  const currentTitle = titleEl.textContent;
  const currentDescription = descriptionEl.textContent;
  const fullTitle = titleEl.dataset.fullTitle;
  const fullDescription = descriptionEl.dataset.fullDescription;
  
  const isCurrentlyExpanded = (currentTitle === fullTitle && currentDescription === fullDescription);
  
  console.log('Current state check:');
  console.log('Current title:', currentTitle);
  console.log('Full title:', fullTitle);
  console.log('Current description:', currentDescription);
  console.log('Full description:', fullDescription);
  console.log('Is currently expanded:', isCurrentlyExpanded);
  
  if (isCurrentlyExpanded) {
    // Currently showing full content - collapse to truncated
    const maxTitleLength = 80;
    const maxDescriptionLength = 120;
    
    const titleTruncated = fullTitle.length > maxTitleLength;
    const descriptionTruncated = fullDescription.length > maxDescriptionLength;
    
    const newTitle = titleTruncated ? fullTitle.substring(0, maxTitleLength) + '...' : fullTitle;
    const newDescription = descriptionTruncated ? fullDescription.substring(0, maxDescriptionLength) + '...' : fullDescription;
    
    console.log('Setting new title:', newTitle);
    console.log('Setting new description:', newDescription);
    
    titleEl.textContent = newTitle;
    descriptionEl.textContent = newDescription;
    
    // Force a reflow to ensure DOM updates
    titleEl.offsetHeight;
    descriptionEl.offsetHeight;
    
    noticeItem.classList.remove('expanded');
    noticeItem.dataset.expanded = 'false';
    if (readMoreBtn) {
      readMoreBtn.style.display = 'inline-flex';
      console.log('Showing read more button');
    }
    if (readLessBtn) {
      readLessBtn.style.display = 'none';
      console.log('Hiding read less button');
    }
    
    console.log('After update - Title:', titleEl.textContent);
    console.log('After update - Description:', descriptionEl.textContent);
    console.log('Collapsed to truncated view');
  } else {
    // Currently showing truncated content - expand to full
    console.log('Setting full title:', fullTitle);
    console.log('Setting full description:', fullDescription);
    
    titleEl.textContent = fullTitle;
    descriptionEl.textContent = fullDescription;
    
    // Force a reflow to ensure DOM updates
    titleEl.offsetHeight;
    descriptionEl.offsetHeight;
    
    noticeItem.classList.add('expanded');
    noticeItem.dataset.expanded = 'true';
    if (readMoreBtn) {
      readMoreBtn.style.display = 'none';
      console.log('Hiding read more button');
    }
    if (readLessBtn) {
      readLessBtn.style.display = 'inline-flex';
      console.log('Showing read less button');
    }
    
    console.log('After update - Title:', titleEl.textContent);
    console.log('After update - Description:', descriptionEl.textContent);
    console.log('Expanded to full view');
  }
}

function getCategoryIcon(category) {
  const icons = {
    urgent: '🚨',
    academic: '📚',
    events: '🎉',
    general: '📋'
  };
  return icons[category] || '📌';
}

function formatNoticeDate(dateString) {
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
}

// Show notice details in modal
function showNoticeDetails(noticeId) {
  console.log('showNoticeDetails called with:', noticeId);
  console.log('Available notices:', window.noticeState.notices);
  
  const notice = window.noticeState.notices.find(n => n.id === noticeId);
  if (!notice) {
    console.log('Notice not found:', noticeId);
    return;
  }

  console.log('Found notice:', notice);
  const modal = document.getElementById('notice-modal');
  const modalBody = document.getElementById('notice-modal-body');
  const modalTitle = document.getElementById('notice-modal-title');

  if (!modal || !modalBody || !modalTitle) {
    console.log('Modal elements not found');
    return;
  }

  modalTitle.textContent = 'Notice Details';

  const categoryIcon = getCategoryIcon(notice.category);
  const formattedDate = formatNoticeDate(notice.date);
  
  modalBody.innerHTML = `
    <div class="notice-modal-category ${notice.category}">${categoryIcon} ${notice.category}</div>
    <div class="notice-modal-date">📅 ${formattedDate}</div>
    <div class="notice-modal-title">${notice.title}</div>
    <div class="notice-modal-description">${notice.description}</div>
    ${notice.validUntil ? `<div style="margin-top: 1rem; padding: 1rem; background: var(--border-light); border-radius: 8px; font-size: 0.9rem; color: var(--text-secondary);">
      <strong>📍 Valid Until:</strong> ${formatNoticeDate(notice.validUntil)}
    </div>` : ''}
  `;

  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
  console.log('Modal should be visible now');
}

// Close notice modal
function closeNoticeModal() {
  const modal = document.getElementById('notice-modal');
  modal.classList.remove('show');
  document.body.style.overflow = '';
}

// Navigate to notice board section
function goToNoticeBoard() {
  closeNoticeModal();
  toggleNoticePanel(); // Close notice panel if open
  
  // Scroll to events section (which contains the notice board)
  const noticesSection = document.getElementById('events');
  if (noticesSection) {
    noticesSection.scrollIntoView({ behavior: 'smooth' });
    
    // Update active navigation
    setTimeout(() => {
      updateActiveNavigation('events');
    }, 500);
  }
}

// Close panel when clicking outside
document.addEventListener('click', function(event) {
  const panel = document.getElementById('notice-panel');
  const bellIcon = document.querySelector('.notice-bell-icon');
  const viewAllBtn = document.querySelector('.notice-view-all');
  
  if (window.noticeState.panelOpen && 
      !panel.contains(event.target) && 
      !bellIcon.contains(event.target) &&
      !viewAllBtn.contains(event.target)) {
    toggleNoticePanel();
  }

  // Close notice modal when clicking outside
  const modal = document.getElementById('notice-modal');
  const modalContent = document.querySelector('.notice-modal-content');
  
  if (modal && modal.classList.contains('show') && 
      modalContent && !modalContent.contains(event.target)) {
    closeNoticeModal();
  }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    const modal = document.getElementById('notice-modal');
    if (modal && modal.classList.contains('show')) {
      closeNoticeModal();
    }
  }
});

// Initialize notice system on page load
function initializeNoticeSystem() {
  // Check if DOM elements exist before loading
  const tickerBar = document.getElementById('notice-ticker-bar');
  const countBadge = document.getElementById('notice-count-badge');
  
  if (!tickerBar || !countBadge) {
    console.warn('Notice system DOM elements not ready, retrying in 100ms');
    setTimeout(initializeNoticeSystem, 100);
    return;
  }
  
  // Calculate and set header height for sticky positioning
  adjustNoticeTickerPosition();
  
  console.log('Notice system initializing - DOM elements found');
  loadNoticesData();
}

// Function to adjust notice ticker position based on header height
function adjustNoticeTickerPosition() {
  const header = document.querySelector('header');
  const tickerBar = document.getElementById('notice-ticker-bar');
  
  if (header && tickerBar) {
    const headerHeight = header.offsetHeight;
    console.log('Calculated header height:', headerHeight + 'px');
    
    // Set CSS custom property for header height
    document.documentElement.style.setProperty('--calculated-header-height', headerHeight + 'px');
    
    // Apply the calculated height to the ticker bar (directly below header)
    tickerBar.style.top = headerHeight + 'px';
  }
}

// Recalculate on window resize
window.addEventListener('resize', adjustNoticeTickerPosition);

// Initialize notice system when page loads
setTimeout(() => {
  initializeNoticeSystem();
}, 1000);

// Make toggle function globally available
window.toggleNoticePanel = toggleNoticePanel;