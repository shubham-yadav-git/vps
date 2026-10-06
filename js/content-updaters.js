// Content Update Functions for Dynamic Loading

// Escape text for safe insertion into HTML content and attribute values
function escapeHTML(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Allow only http(s), image data URLs and relative paths for src/href values
function safeURL(value, fallback) {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  const url = value.trim();
  if (/^data:image\//i.test(url)) return url;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    return /^https?:/i.test(url) ? url : fallback;
  }
  return url;
}

function updateFacultySection(facultyData) {
  const facultyList = document.querySelector('.faculty-list');
  if (facultyList && Array.isArray(facultyData) && facultyData.length > 0) {
    facultyList.innerHTML = facultyData.map(faculty => {
      // Handle both regular URLs and base64 data URLs
      const photoSrc = escapeHTML(safeURL(faculty.photo, 'assets/default-faculty.svg'));
      const safeName = escapeHTML(faculty.name || 'Faculty Member');
      const safeRole = escapeHTML(faculty.role || 'Staff');
      const safeDescription = escapeHTML(faculty.description || '');
      
      return `
      <li class="faculty-member">
        <img src="${photoSrc}" alt="${safeName}" class="faculty-photo" 
             onerror="this.onerror=null; this.src='assets/default-faculty.svg';" />
        <div class="faculty-info">
          <h3>${safeName}</h3>
          <p>${safeRole}${safeDescription ? ' - ' + safeDescription : ''}</p>
        </div>
      </li>
    `;
    }).join('');
  }
}

function updateTestimonialsSection(testimonialsData) {
  const testimonialsList = document.querySelector('.testimonial-list');
  if (testimonialsList && Array.isArray(testimonialsData) && testimonialsData.length > 0) {
    testimonialsList.innerHTML = testimonialsData.map(testimonial => `
      <li class="testimonial-item">
        <div class="testimonial-info">
          <h3>${escapeHTML(testimonial.name)}${testimonial.role ? ', ' + escapeHTML(testimonial.role) : ''}</h3>
          <p>"${escapeHTML(testimonial.text)}"</p>
        </div>
      </li>
    `).join('');
  }
}

function updateGallerySection(galleryData) {
  const gallery = document.querySelector('.gallery');
  if (gallery && Array.isArray(galleryData) && galleryData.length > 0) {
    gallery.innerHTML = galleryData.map(item => {
      // Handle both regular URLs and base64 data URLs
      const imageSrc = escapeHTML(safeURL(item.src, 'assets/gallery7.jpg'));
      const safeAlt = escapeHTML(item.alt || 'Gallery image');
      
      return `
      <a href="#" data-img="${imageSrc}" tabindex="0" role="listitem" class="gallery-link">
        <img src="${imageSrc}" alt="${safeAlt}" 
             onerror="this.onerror=null; this.src='assets/gallery7.jpg';" />
      </a>
    `;
    }).join('');
    
    // Re-attach gallery click events after updating content
    setTimeout(() => {
      if (window.attachGalleryEvents) {
        window.attachGalleryEvents();
      }
    }, 100);
  }
}

// Update functions for admin panel sections
function updateAboutSection(aboutData) {
  const aboutSection = document.getElementById('about');
  if (aboutSection && aboutData) {
    // Update about intro content
    const aboutIntro = aboutSection.querySelector('.about-intro');
    if (aboutIntro && aboutData.content) {
      aboutIntro.textContent = aboutData.content;
    }
    
    // Update leadership profiles
    if (aboutData.leadership && Array.isArray(aboutData.leadership)) {
      aboutData.leadership.forEach((leader, index) => {
        if (!leader || !/^[\w-]+$/.test(leader.id || '')) return;
        const profileCard = aboutSection.querySelector(`.${leader.id}-profile`);
        if (profileCard) {
          // Update image
          const img = profileCard.querySelector('img');
          if (img && leader.image) {
            img.src = safeURL(leader.image, img.src);
            img.alt = `${leader.name}, ${leader.position}`;
          }
          
          // Update name
          const nameElement = profileCard.querySelector('h4');
          if (nameElement && leader.name) {
            nameElement.textContent = leader.name;
          }
          
          // Update position
          const positionElement = profileCard.querySelector('.position');
          if (positionElement && leader.position) {
            positionElement.textContent = leader.position;
          }
          
          // Update description
          const descriptionElement = profileCard.querySelector('.description');
          if (descriptionElement && leader.description) {
            descriptionElement.textContent = leader.description;
          }
        }
      });
    }
    
    // Update highlights
    if (aboutData.highlights && Array.isArray(aboutData.highlights)) {
      const highlightCards = aboutSection.querySelectorAll('.highlight-card');
      aboutData.highlights.forEach((highlight, index) => {
        if (highlightCards[index]) {
          const card = highlightCards[index];
          
          // Update icon
          const iconElement = card.querySelector('.highlight-icon');
          if (iconElement && highlight.icon) {
            iconElement.textContent = highlight.icon;
          }
          
          // Update title
          const titleElement = card.querySelector('h4');
          if (titleElement && highlight.title) {
            titleElement.textContent = highlight.title;
          }
          
          // Update description
          const descElement = card.querySelector('p');
          if (descElement && highlight.description) {
            descElement.textContent = highlight.description;
          }
        }
      });
    }
  }
}

function updateSchoolInfoSection(schoolData) {
  // Update header title if school name is provided
  if (schoolData && schoolData.name) {
    const headerTitle = document.querySelector('header h1');
    if (headerTitle) {
      headerTitle.textContent = schoolData.name;
    }
    
    // Update page title
    document.title = schoolData.name;
  }
  
  // Also update footer address from school info
  updateFooterAddress(schoolData, 'school-info');
}

function updateContactSection(contactData) {
  const contactSection = document.getElementById('contact');
  if (contactSection && contactData) {
    const address = contactSection.querySelector('address');
    if (address) {
      let addressHTML = '';
      
      if (contactData.address) {
        addressHTML += `<p><strong>Address:</strong> ${escapeHTML(contactData.address)}</p>`;
      }
      if (contactData.email) {
        const email = escapeHTML(contactData.email);
        addressHTML += `<p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>`;
      }
      if (contactData.phone) {
        const tel = String(contactData.phone).replace(/[^+\d]/g, '');
        addressHTML += `<p><strong>Phone:</strong> <a href="tel:${tel}">${escapeHTML(contactData.phone)}</a></p>`;
      }
      if (contactData.hours) {
        addressHTML += `<p><strong>Office Hours:</strong> ${escapeHTML(contactData.hours)}</p>`;
      }
      
      // Only update if we have some data
      if (addressHTML) {
        address.innerHTML = addressHTML;
      }
    }
  }
  
  // Also update footer address from contact data
  updateFooterAddress(contactData, 'contact');
}

// Helper function to update footer address from Firebase data
function updateFooterAddress(data, source) {
  if (!data) return;
  
  // Get footer address elements
  const footerAddress = document.getElementById('db-address');
  const footerPhone = document.getElementById('db-phone');
  const footerEmail = document.getElementById('db-email');
  const cityState = document.getElementById('db-city-state');
  const pincode = document.getElementById('db-pincode');
  
  // Update address - Firebase stores complete address in single field
  if (footerAddress && data.address) {
    footerAddress.textContent = data.address;
  }
  
  // Hide city/state/pincode for Firebase data (since address is complete)
  if (cityState) {
    cityState.style.display = 'none';
    const prevBr = cityState.previousElementSibling;
    if (prevBr && prevBr.tagName === 'BR') {
      prevBr.style.display = 'none';
    }
  }
  if (pincode) {
    pincode.style.display = 'none';
    // Hide the " - PIN" text
    const parentNode = pincode.parentNode;
    if (parentNode) {
      const textNodes = Array.from(parentNode.childNodes);
      textNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.includes('PIN')) {
          node.textContent = '';
        }
      });
    }
  }
  
  // Update phone
  if (footerPhone && data.phone) {
    footerPhone.textContent = data.phone;
    footerPhone.href = `tel:${String(data.phone).replace(/[^+\d]/g, '')}`;
  }
  
  // Update email
  if (footerEmail && data.email) {
    footerEmail.textContent = data.email;
    footerEmail.href = `mailto:${data.email}`;
  }
}

function updateEventsSection(eventsData) {
  const noticesList = document.querySelector('.notices-list');

  if (!noticesList || !Array.isArray(eventsData)) return;

  // Hide expired notices and show the newest first
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeNotices = eventsData
    .filter(notice => {
      if (!notice.validUntil) return true;
      const validUntil = new Date(notice.validUntil);
      if (isNaN(validUntil)) return true;
      validUntil.setHours(23, 59, 59, 999);
      return validUntil >= today;
    })
    .sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));

  if (activeNotices.length === 0) {
    noticesList.innerHTML = '<li class="notice-item general" data-category="general"><div class="notice-content"><p>No active notices at this time.</p></div></li>';
    return;
  }

  {
    // Truncation lengths
    const maxTitleLength = 80;
    const maxDescriptionLength = 120;
    noticesList.innerHTML = activeNotices.map((notice, idx) => {
      const rawTitle = String(notice.title || 'Notice');
      const rawDescription = String(notice.description || '');
      const formatDate = (value) => {
        if (!value) return '';
        const date = new Date(value);
        return isNaN(date) ? '' : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      };
      const displayDate = formatDate(notice.date);
      const displayValidUntil = formatDate(notice.validUntil);
      const category = notice.category || 'general';
      // Use category-specific badge class for color control
      let safeCategory = category;
      if (!['urgent', 'academic', 'events', 'general'].includes(category)) {
        safeCategory = 'general';
      }
      const badgeClass = safeCategory === 'general' ? 'notice-badge-general' : `notice-badge-${safeCategory}`;
      const badgeIconMap = {
        urgent: 'fas fa-exclamation-triangle',
        academic: 'fas fa-graduation-cap',
        events: 'fas fa-calendar-alt',
        general: 'fas fa-info-circle'
      };
      const badgeTextMap = {
        urgent: 'Urgent',
        academic: 'Academic',
        events: 'Event',
        general: 'General'
      };
      const badgeIcon = badgeIconMap[safeCategory] || badgeIconMap.general;
      const badgeText = badgeTextMap[safeCategory] || badgeTextMap.general;

      // Truncation logic
      const titleTruncated = rawTitle.length > maxTitleLength;
      const descriptionTruncated = rawDescription.length > maxDescriptionLength;
      const showReadMore = titleTruncated || descriptionTruncated;
      const displayTitle = escapeHTML(titleTruncated ? rawTitle.substring(0, maxTitleLength) + '...' : rawTitle);
      const displayDescription = escapeHTML(descriptionTruncated ? rawDescription.substring(0, maxDescriptionLength) + '...' : rawDescription);
      const safeTitle = escapeHTML(rawTitle);
      const safeDescription = escapeHTML(rawDescription);
      // Unique id for expand/collapse
      const noticeId = `main-notice-${idx}`;
      return `
      <li class="notice-item ${safeCategory}" data-category="${safeCategory}" data-notice-id="${noticeId}" data-expanded="false">
        <div class="main-notice-pin" aria-hidden="true" style="margin: 0 auto 0.3rem auto;"></div>
        <div class="notice-badge ${badgeClass}">
          <i class="${badgeIcon}"></i> ${badgeText}
        </div>
        <div class="notice-content">
          <h3 class="main-notice-title" data-full-title="${safeTitle}">${displayTitle}</h3>
          <div class="notice-meta">
            <span class="notice-date">
              <i class="fas fa-calendar"></i> Posted: ${displayDate || 'N/A'}
            </span>
            ${displayValidUntil ? `
            <span class="notice-valid">
              <i class="fas fa-clock"></i> Valid until: ${displayValidUntil}
            </span>
            ` : ''}
          </div>
          <p class="main-notice-description" data-full-description="${safeDescription}">${displayDescription}</p>
          ${showReadMore ? `
            <div class="main-notice-action">
              <button class="main-notice-read-more-btn" style="display:inline-flex;">
                <span>Read more</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <button class="main-notice-read-less-btn" style="display:none;">
                <span>Read less</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M17 7L7 17M7 17H17M7 17V7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          ` : ''}
        </div>
      </li>
    `;
    }).join('');

    // Add expand/collapse logic for main notice board
    setTimeout(() => {
      const noticeItems = noticesList.querySelectorAll('.notice-item[data-notice-id]');
      noticeItems.forEach(noticeItem => {
        const readMoreBtn = noticeItem.querySelector('.main-notice-read-more-btn');
        const readLessBtn = noticeItem.querySelector('.main-notice-read-less-btn');
        const titleEl = noticeItem.querySelector('.main-notice-title');
        const descEl = noticeItem.querySelector('.main-notice-description');
        if (readMoreBtn) {
          readMoreBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Expand to full
            titleEl.textContent = titleEl.dataset.fullTitle;
            descEl.textContent = descEl.dataset.fullDescription;
            noticeItem.classList.add('expanded');
            noticeItem.dataset.expanded = 'true';
            // Remove any max-height/height restrictions and force reflow
            noticeItem.style.maxHeight = 'none';
            noticeItem.style.height = 'auto';
            noticeItem.style.minHeight = 'unset';
            noticeItem.style.overflow = 'visible';
            // Force a reflow to ensure the browser recalculates layout
            noticeItem.offsetHeight;
            // Optionally, scroll into view if needed
            // noticeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            readMoreBtn.style.display = 'none';
            if (readLessBtn) readLessBtn.style.display = 'inline-flex';
          });
        }
        if (readLessBtn) {
          readLessBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Collapse to truncated
            const fullTitle = titleEl.dataset.fullTitle;
            const fullDesc = descEl.dataset.fullDescription;
            const maxTitleLength = 80;
            const maxDescriptionLength = 120;
            const newTitle = fullTitle.length > maxTitleLength ? fullTitle.substring(0, maxTitleLength) + '...' : fullTitle;
            const newDesc = fullDesc.length > maxDescriptionLength ? fullDesc.substring(0, maxDescriptionLength) + '...' : fullDesc;
            titleEl.textContent = newTitle;
            descEl.textContent = newDesc;
            noticeItem.classList.remove('expanded');
            noticeItem.dataset.expanded = 'false';
            // Remove forced height/overflow/minHeight/maxHeight
            noticeItem.style.height = '';
            noticeItem.style.overflow = '';
            noticeItem.style.minHeight = '';
            noticeItem.style.maxHeight = '';
            readLessBtn.style.display = 'none';
            if (readMoreBtn) readMoreBtn.style.display = 'inline-flex';
          });
        }
      });
      // Re-initialize notice board filtering after updating content
      if (window.initializeNoticeBoard) {
        window.initializeNoticeBoard();
      }
    }, 100);
  }
}

function updateFaqSection(faqData) {
  const faqList = document.querySelector('.faq-list');
  if (faqList && Array.isArray(faqData) && faqData.length > 0) {
    // Sort FAQ data by order field
    const sortedFaqData = faqData.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    faqList.innerHTML = sortedFaqData.map((faq, index) => {
      const safeQuestion = escapeHTML(faq.question);
      const safeAnswer = escapeHTML(faq.answer);
      const faqId = `faq${index + 1}`;
      const btnId = `${faqId}-btn`;
      
      return `
      <li class="faq-item">
        <button class="faq-question" aria-expanded="false" aria-controls="${faqId}" id="${btnId}">
          ${safeQuestion}
        </button>
        <div class="faq-answer" id="${faqId}" role="region" aria-labelledby="${btnId}">
          ${safeAnswer}
        </div>
      </li>
    `;
    }).join('');
    
    // Reinitialize FAQ event listeners for dynamically loaded content
    initializeFaqEventListeners();
  }
}

function initializeFaqEventListeners() {
  const faqButtons = document.querySelectorAll(".faq-question");
  faqButtons.forEach((btn) => {
    // Remove existing event listeners to avoid duplicates
    btn.replaceWith(btn.cloneNode(true));
  });
  
  // Re-query after cloning
  const newFaqButtons = document.querySelectorAll(".faq-question");
  newFaqButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      // Collapse all others
      newFaqButtons.forEach((otherBtn) => {
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
}

function updateAcademicsSection(academicsData) {
  const academicsSection = document.getElementById('academics');
  if (academicsSection && academicsData) {
    // Update description
    const descriptionP = academicsSection.querySelector('p');
    if (descriptionP && academicsData.description) {
      descriptionP.textContent = academicsData.description;
    }
    
    // Update the list items
    const list = academicsSection.querySelector('ul');
    if (list) {
      list.innerHTML = `
        <li><strong>Curriculum:</strong> ${escapeHTML(academicsData.curriculum) || 'CBSE syllabus from Nursery to Class XII.'}</li>
        <li><strong>Special Programs:</strong> ${escapeHTML(academicsData.programs) || 'STEM initiatives, Coding clubs, Language enrichment.'}</li>
        <li><strong>Assessment:</strong> ${escapeHTML(academicsData.assessment) || 'Continuous Evaluation, Project Based Learning, Olympiads preparation.'}</li>
        <li><strong>Extra-Curricular:</strong> ${escapeHTML(academicsData.extracurricular) || 'Art, Music, Dance, Debate, and Sports to nurture talents.'}</li>
      `;
    }
  }
}

function updateLogoSection(logoData) {
  if (logoData) {
    // Update logo image
    const logoImg = document.querySelector('.logo-img');
    if (logoImg && logoData.logoUrl) {
      logoImg.src = safeURL(logoData.logoUrl, logoImg.src);
      logoImg.alt = `${logoData.schoolName || 'School'} Logo`;
    }
    
    // Update school name
    const schoolName = document.querySelector('.school-name');
    if (schoolName && logoData.schoolName) {
      schoolName.textContent = logoData.schoolName;
    }
    
    // Update tagline
    const tagline = document.querySelector('.school-tagline');
    if (tagline && logoData.tagline) {
      tagline.textContent = logoData.tagline;
    }
  }
}