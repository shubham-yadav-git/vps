// MPD File Modal - For viewing files in the mandatory public disclosure page
// This is a stand-alone script that adds file viewing capability to the disclosure page

// Wait for document to be ready and then initialize
document.addEventListener('DOMContentLoaded', function() {
  console.log('MPD Modal Script loaded, waiting for DOM content...');
  
  // Try to initialize at different times to handle dynamic content
  setTimeout(() => initMpdModal(), 100);
  setTimeout(() => initMpdModal(), 1000);
  setTimeout(() => initMpdModal(), 2500);
});

// Global flag to prevent double initialization
window.mpdModalInitialized = false;

// Main initialization function
function initMpdModal() {
  // Check if already initialized
  if (window.mpdModalInitialized) {
    console.log('Modal already initialized, skipping...');
    return;
  }
  
  // Check if we're on the mandatory disclosure page by looking for tables
  const tables = document.querySelectorAll('.mpd-table');
  if (!tables || tables.length === 0) {
    console.log('No disclosure tables found yet, will try again later');
    return;
  }

  console.log('Found disclosure tables:', tables.length);
  window.mpdModalInitialized = true;
  
  // Create modal container if it doesn't exist
  let modal = document.getElementById('mpd-file-modal');
  if (!modal) {
    console.log('Creating file viewer modal');
    modal = document.createElement('div');
    modal.id = 'mpd-file-modal';
    modal.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.75);
      z-index: 9999;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    // Create modal content container
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      position: relative;
      background-color: #fff;
      width: 90%;
      max-width: 900px;
      max-height: 90vh;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      transform: scale(0.95);
      transition: transform 0.3s ease;
    `;
    
    // Create modal header
    const modalHeader = document.createElement('div');
    modalHeader.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #e5e7eb;
    `;
    
    // Add title to header
    const modalTitle = document.createElement('h3');
    modalTitle.id = 'mpd-file-modal-title';
    modalTitle.style.cssText = `
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
    `;
    
    // Add close button to header
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 1.5rem;
      line-height: 1;
      color: #6b7280;
      cursor: pointer;
      padding: 0;
      margin: 0;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background-color 0.2s;
    `;
    
    // Create modal body
    const modalBody = document.createElement('div');
    modalBody.id = 'mpd-file-modal-body';
    modalBody.style.cssText = `
      overflow-y: auto;
      padding: 20px;
      flex: 1;
      min-height: 100px;
      display: flex;
      justify-content: center;
      align-items: center;
    `;
    
    // Assemble modal
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeBtn);
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Add event listeners for modal
    closeBtn.addEventListener('click', () => {
      closeFileModal();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeFileModal();
      }
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        closeFileModal();
      }
    });
  }
  
  // Find and add click events to all file links in MPD tables
  const processFileLinks = () => {
    console.log('Scanning for file links in disclosure tables');
    // Wait for tables to be rendered
    setTimeout(() => {
      // Target only links with the file-viewer-link class
      const fileLinks = document.querySelectorAll('.mpd-table td a.file-viewer-link');
      console.log(`Found ${fileLinks.length} regular file links in tables`);
      
      fileLinks.forEach(link => {
        // Skip if already processed
        if (link.getAttribute('data-mpd-processed')) return;
        
        console.log('Adding click handler to file link:', link.textContent);
        link.setAttribute('data-mpd-processed', 'true');
        
        link.addEventListener('click', function(e) {
          e.preventDefault();
          console.log('File link clicked:', this.href);
          openFileModal(this.href, this.textContent.trim());
        });
      });
    }, 1000); // Increased delay to ensure tables are fully rendered
  };
  
  // Add click handlers for PDF links specifically
  const processPDFLinks = () => {
    console.log('Scanning for PDF links in disclosure tables');
    setTimeout(() => {
      const pdfLinks = document.querySelectorAll('.pdf-viewer-link');
      console.log(`Found ${pdfLinks.length} PDF links in tables`);
      
      pdfLinks.forEach(link => {
        // Skip if already processed
        if (link.getAttribute('data-mpd-processed')) return;
        
        console.log('Adding click handler to PDF link:', link);
        link.setAttribute('data-mpd-processed', 'true');
        
        link.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation(); // Prevent any other event handlers
          
          // Get the encoded URL from the data attribute
          const encodedUrl = this.getAttribute('data-file-url');
          if (!encodedUrl) {
            console.error('No encoded file URL found for PDF link');
            return;
          }
          
          // Decode the URL
          try {
            const fileUrl = decodeURIComponent(encodedUrl);
            console.log('PDF link clicked, decoded URL length:', fileUrl.length);
            
            if (fileUrl.length < 100) {
              console.log('Full URL:', fileUrl);
            } else {
              console.log('URL start:', fileUrl.substring(0, 50) + '...');
            }
            
            // Open the modal with the decoded URL
            openFileModal(fileUrl, this.textContent.trim());
          } catch (error) {
            console.error('Error decoding URL:', error);
          }
          
          return false; // Extra prevention of default behavior
        });
      });
    }, 1000);
  };
  
  // Initial processing and set up observer for future updates
  processFileLinks();
  processPDFLinks();
  
  // Set up mutation observer to watch for new tables being added
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        processFileLinks();
        processPDFLinks();
      }
    }
  });
  
  // Start observing the disclosure sections container
  const container = document.getElementById('disclosure-sections');
  if (container) {
    observer.observe(container, { childList: true, subtree: true });
  }
}

// Function to open file modal
function openFileModal(fileUrl, title = 'File Viewer') {
  console.log('Opening file modal for:', title);
  console.log('File URL type:', typeof fileUrl);
  console.log('File URL starts with:', fileUrl.substring(0, 20) + '...');
  
  if (!fileUrl) {
    console.error('No file URL provided to openFileModal');
    return;
  }
  
  const modal = document.getElementById('mpd-file-modal');
  const modalTitle = document.getElementById('mpd-file-modal-title');
  const modalBody = document.getElementById('mpd-file-modal-body');
  
  if (!modal || !modalTitle || !modalBody) {
    console.error('Modal elements not found');
    // Fallback to opening in a new tab
    window.open(fileUrl, '_blank');
    return;
  }
  
  // Set title
  modalTitle.textContent = title;
  
  // Clear previous content
  modalBody.innerHTML = '';
  
  // Make sure the modal is created and visible
  console.log('Modal elements found:', modal.id, modalTitle.id, modalBody.id);
  
  try {
    // Display loading indicator
    modalBody.innerHTML = '<div style="padding:20px;color:#64748b;">Loading content...</div>';
    
    // Validate the file URL
    if (!fileUrl || (fileUrl.startsWith('data:') && fileUrl.length < 30)) {
      throw new Error('Invalid or empty file URL provided');
    }
    
    // Check file type
    const isImage = fileUrl.includes('data:image/') || fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isPDF = fileUrl.includes('data:application/pdf') || fileUrl.toLowerCase().endsWith('.pdf');
    
    // Create appropriate content based on file type
    if (isImage) {
      const img = new Image();
      img.onload = function() {
        modalBody.innerHTML = '';
        modalBody.appendChild(img);
        console.log('Image loaded successfully');
      };
      img.onerror = function() {
        modalBody.innerHTML = '<div style="padding:20px;color:#ef4444;">Error loading image. The file might be too large or corrupted.</div>';
        console.error('Error loading image');
      };
      img.style.cssText = `
        max-width: 100%;
        max-height: 70vh;
        object-fit: contain;
        display: block;
        margin: 0 auto;
      `;
      img.src = fileUrl;
    } else if (isPDF) {
      // For PDF files, provide a download link instead of embedding
      // This avoids the "Not allowed to navigate top frame to data URL" error
      setTimeout(() => {
        modalBody.innerHTML = '';
        
        // Create download container
        const container = document.createElement('div');
        container.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          padding: 30px;
        `;
        
        // Add PDF icon
        const icon = document.createElement('div');
        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M9 15v-2h6v2"></path></svg>';
        icon.style.color = '#dc2626';
        
        // Create a unique blob URL from the data URL to avoid browser restrictions
        let blobUrl = fileUrl;
        let conversionSuccess = false;
        
        // Only convert to blob if it's a data URL (browser restriction applies to data URLs, not regular URLs)
        if (fileUrl.startsWith('data:')) {
          try {
            // Convert data URL to Blob
            console.log('Converting data URL to blob...');
            
            // Split the data URL to get the base64 content
            const parts = fileUrl.split(',');
            if (parts.length < 2) {
              throw new Error('Invalid data URL format');
            }
            
            // Get the MIME type from the data URL
            const mimeMatch = parts[0].match(/:(.*?);/);
            if (!mimeMatch) {
              throw new Error('Could not determine MIME type from data URL');
            }
            const mime = mimeMatch[1];
            console.log('MIME type:', mime);
            
            // Convert base64 to binary
            const base64 = parts[1];
            const binary = atob(base64);
            console.log('Binary data length:', binary.length);
            
            // Create array buffer and view
            const len = binary.length;
            const buffer = new ArrayBuffer(len);
            const view = new Uint8Array(buffer);
            
            // Convert to bytes
            for (let i = 0; i < len; i++) {
              view[i] = binary.charCodeAt(i);
            }
            
            // Create blob and URL
            const blob = new Blob([buffer], { type: mime });
            blobUrl = URL.createObjectURL(blob);
            conversionSuccess = true;
            console.log('Created blob URL for PDF:', blobUrl);
          } catch (err) {
            console.error('Error converting data URL to blob:', err);
            
            // Don't show the error yet, we'll provide alternative download options
            conversionSuccess = false;
            blobUrl = fileUrl; // Keep the original URL as a fallback
          }
        } else {
          // For regular URLs (not data URLs), we can use them directly
          conversionSuccess = true;
        }
        
        // Create message based on conversion success
        const message = document.createElement('p');
        if (conversionSuccess) {
          message.textContent = 'PDF viewer is available. Click the button below to open or download the PDF file.';
        } else {
          message.textContent = 'We encountered an issue preparing this PDF for viewing. Please try the download option below.';
        }
        message.style.cssText = 'text-align: center; color: #4b5563; margin: 0;';
        
        // Create buttons container for multiple options
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = `
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          justify-content: center;
          margin-top: 10px;
        `;
        
        // Common button styles
        const buttonStyles = `
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
        `;
        
        // Option 1: Open in new tab (primary option if conversion successful)
        if (conversionSuccess) {
          const openButton = document.createElement('a');
          openButton.href = blobUrl;
          openButton.target = '_blank';
          openButton.rel = 'noopener';
          openButton.style.cssText = buttonStyles + 'background-color: #3b82f6;';
          openButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg> Open PDF';
          
          openButton.addEventListener('click', function() {
            console.log('Opening PDF in new tab:', blobUrl.substring(0, 30) + '...');
          });
          
          buttonsContainer.appendChild(openButton);
        }
        
        // Option 2: Download the file
        const downloadBtn = document.createElement('a');
        downloadBtn.style.cssText = buttonStyles + 'background-color: #059669;';
        
        if (conversionSuccess) {
          downloadBtn.href = blobUrl;
          downloadBtn.download = 'document.pdf';
          downloadBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download PDF';
        } else {
          // For data URLs, we can use the download attribute directly
          downloadBtn.href = fileUrl;
          downloadBtn.download = 'document.pdf';
          downloadBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download PDF';
        }
        
        downloadBtn.addEventListener('click', function() {
          console.log('Downloading PDF...');
        });
        
        buttonsContainer.appendChild(downloadBtn);
        
        // If blob conversion failed, add a third option - direct data URL (might work in some browsers)
        if (!conversionSuccess && fileUrl.startsWith('data:')) {
          const directOpenButton = document.createElement('a');
          directOpenButton.href = fileUrl;
          directOpenButton.target = '_blank';
          directOpenButton.style.cssText = buttonStyles + 'background-color: #7c3aed;';
          directOpenButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Try Direct Open';
          
          buttonsContainer.appendChild(directOpenButton);
        }
        
        // Clean up blob URL when modal is closed to prevent memory leaks
        if (blobUrl !== fileUrl) {
          modal.addEventListener('hidden', function onHidden() {
            URL.revokeObjectURL(blobUrl);
            modal.removeEventListener('hidden', onHidden);
            console.log('Blob URL revoked');
          }, { once: true });
        }
        
        // Assemble components
        container.appendChild(icon);
        container.appendChild(message);
        container.appendChild(buttonsContainer);
        modalBody.appendChild(container);
        
        console.log('PDF download button created');
      }, 200);
    } else {
      // For other file types, provide a download link
      setTimeout(() => {
        modalBody.innerHTML = '';
        const downloadLink = document.createElement('a');
        downloadLink.href = fileUrl;
        downloadLink.download = title.replace('View ', '') + '.file';
        downloadLink.style.cssText = `
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background-color: #3b82f6;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          transition: background-color 0.2s ease;
        `;
        downloadLink.innerHTML = '<span style="font-size:1.2em;">⬇️</span> Download File';
        downloadLink.onmouseover = () => { downloadLink.style.backgroundColor = '#2563eb'; };
        downloadLink.onmouseout = () => { downloadLink.style.backgroundColor = '#3b82f6'; };
        
        modalBody.appendChild(downloadLink);
      }, 200);
    }
  } catch (error) {
    console.error('Error displaying file:', error);
    modalBody.innerHTML = `<div style="padding:20px;color:#ef4444;">Error: ${error.message}</div>`;
  }
  
  // Show modal with animation
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden'; // Prevent scrolling
  
  // Force reflow to ensure display change takes effect before opacity change
  void modal.offsetWidth;
  
  // Ensure we're actually changing the opacity after display is set to flex
  requestAnimationFrame(() => {
    modal.style.opacity = '1';
    const modalContent = modal.querySelector('div');
    if (modalContent) {
      modalContent.style.transform = 'scale(1)';
    }
    console.log('Modal displayed and animated');
  });
}

// Function to close file modal
function closeFileModal() {
  const modal = document.getElementById('mpd-file-modal');
  if (!modal) return;
  
  console.log('Closing file modal');
  
  // Hide modal with animation
  modal.style.opacity = '0';
  const modalContent = modal.querySelector('div');
  if (modalContent) {
    modalContent.style.transform = 'scale(0.95)';
  }
  
  // Restore scrolling
  document.body.style.overflow = '';
  
  setTimeout(() => {
    modal.style.display = 'none';
    const modalBody = document.getElementById('mpd-file-modal-body');
    if (modalBody) {
      modalBody.innerHTML = '';
    }
    
    // Dispatch a hidden event for cleanup
    modal.dispatchEvent(new Event('hidden'));
  }, 300);
}
