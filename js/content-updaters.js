// Content Update Functions for Dynamic Loading

function updateFacultySection(facultyData) {
  const facultyList = document.querySelector('.faculty-list');
  if (facultyList && facultyData.length > 0) {
    facultyList.innerHTML = facultyData.map(faculty => {
      // Handle both regular URLs and base64 data URLs
      const photoSrc = faculty.photo || 'assets/default-faculty.svg'; // fallback image
      const safeName = (faculty.name || 'Faculty Member').replace(/"/g, '&quot;');
      const safeRole = (faculty.role || 'Staff').replace(/"/g, '&quot;');
      const safeDescription = (faculty.description || '').replace(/"/g, '&quot;');
      
      return `
      <li class="faculty-member">
        <img src="${photoSrc}" alt="${safeName}" class="faculty-photo" 
             onerror="this.src='assets/default-faculty.svg'; console.log('Faculty image failed to load, using fallback');" />
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
  if (testimonialsList && testimonialsData.length > 0) {
    testimonialsList.innerHTML = testimonialsData.map(testimonial => `
      <li class="testimonial-item">
        <div class="testimonial-info">
          <h3>${testimonial.name}, ${testimonial.role}</h3>
          <p>"${testimonial.text}"</p>
        </div>
      </li>
    `).join('');
  }
}

function updateGallerySection(galleryData) {
  const gallery = document.querySelector('.gallery');
  if (gallery && galleryData.length > 0) {
    gallery.innerHTML = galleryData.map(item => {
      // Handle both regular URLs and base64 data URLs
      const imageSrc = item.src || 'assets/gallery7.jpg'; // fallback image
      const safeAlt = (item.alt || 'Gallery image').replace(/"/g, '&quot;');
      
      return `
      <a href="#" data-img="${imageSrc}" tabindex="0" role="listitem" class="gallery-link">
        <img src="${imageSrc}" alt="${safeAlt}" 
             onerror="this.src='assets/gallery7.jpg'; console.log('Gallery image failed to load, using fallback');" />
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
        const profileCard = aboutSection.querySelector(`.${leader.id}-profile`);
        if (profileCard) {
          // Update image
          const img = profileCard.querySelector('img');
          if (img && leader.image) {
            img.src = leader.image;
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
        addressHTML += `<p><strong>Address:</strong> ${contactData.address}</p>`;
      }
      if (contactData.email) {
        addressHTML += `<p><strong>Email:</strong> <a href="mailto:${contactData.email}">${contactData.email}</a></p>`;
      }
      if (contactData.phone) {
        addressHTML += `<p><strong>Phone:</strong> ${contactData.phone}</p>`;
      }
      if (contactData.hours) {
        addressHTML += `<p><strong>Office Hours:</strong> ${contactData.hours}</p>`;
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
  
  console.log(`Updating footer address from ${source}:`, data);
  
  // Get footer address elements
  const footerAddress = document.getElementById('db-address');
  const footerPhone = document.getElementById('db-phone');
  const footerEmail = document.getElementById('db-email');
  const cityState = document.getElementById('db-city-state');
  const pincode = document.getElementById('db-pincode');
  
  // Update address - Firebase stores complete address in single field
  if (footerAddress && data.address) {
    footerAddress.textContent = data.address;
    console.log('Footer address updated');
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
    footerPhone.href = `tel:${data.phone.replace(/[^+\d]/g, '')}`;
    console.log('Footer phone updated');
  }
  
  // Update email
  if (footerEmail && data.email) {
    footerEmail.textContent = data.email;
    footerEmail.href = `mailto:${data.email}`;
    console.log('Footer email updated');
  }
}

function updateEventsSection(eventsData) {
  const noticesList = document.querySelector('.notices-list');

  if (noticesList && eventsData.length > 0) {
    // Truncation lengths
    const maxTitleLength = 80;
    const maxDescriptionLength = 120;
    noticesList.innerHTML = eventsData.map((notice, idx) => {
      const safeTitle = (notice.title || 'Notice').replace(/"/g, '&quot;');
      const safeDate = (notice.date || '').replace(/"/g, '&quot;');
      const safeValidUntil = (notice.validUntil || '').replace(/"/g, '&quot;');
      const safeDescription = (notice.description || '').replace(/"/g, '&quot;');
      const category = notice.category || 'general';
      // Format dates for display
      const displayDate = safeDate ? new Date(safeDate).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      }) : '';
      const displayValidUntil = safeValidUntil ? new Date(safeValidUntil).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      }) : '';
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
      const titleTruncated = notice.title.length > maxTitleLength;
      const descriptionTruncated = notice.description.length > maxDescriptionLength;
      const showReadMore = titleTruncated || descriptionTruncated;
      const displayTitle = titleTruncated ? notice.title.substring(0, maxTitleLength) + '...' : notice.title;
      const displayDescription = descriptionTruncated ? notice.description.substring(0, maxDescriptionLength) + '...' : notice.description;
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
              <i class="fas fa-calendar"></i> Posted: ${displayDate}
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
  if (faqList && faqData.length > 0) {
    // Sort FAQ data by order field
    const sortedFaqData = faqData.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    faqList.innerHTML = sortedFaqData.map((faq, index) => {
      const safeQuestion = (faq.question || '').replace(/"/g, '&quot;');
      const safeAnswer = (faq.answer || '').replace(/"/g, '&quot;');
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
        <li><strong>Curriculum:</strong> ${academicsData.curriculum || 'CBSE syllabus from Nursery to Class XII.'}</li>
        <li><strong>Special Programs:</strong> ${academicsData.programs || 'STEM initiatives, Coding clubs, Language enrichment.'}</li>
        <li><strong>Assessment:</strong> ${academicsData.assessment || 'Continuous Evaluation, Project Based Learning, Olympiads preparation.'}</li>
        <li><strong>Extra-Curricular:</strong> ${academicsData.extracurricular || 'Art, Music, Dance, Debate, and Sports to nurture talents.'}</li>
      `;
    }
  }
}

function updateLogoSection(logoData) {
  if (logoData) {
    // Update logo image
    const logoImg = document.querySelector('.logo-img');
    if (logoImg && logoData.logoUrl) {
      logoImg.src = logoData.logoUrl;
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