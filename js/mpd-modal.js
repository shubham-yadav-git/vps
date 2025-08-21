// MPD File Modal - For viewing files in the mandatory public disclosure page
document.addEventListener('DOMContentLoaded', function() {
  // Create modal container if it doesn't exist
  let modal = document.getElementById('mpd-file-modal');
  if (!modal) {
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
      padding: 16px 20px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    // Create modal title
    const modalTitle = document.createElement('h3');
    modalTitle.id = 'mpd-file-modal-title';
    modalTitle.style.cssText = `
      margin: 0;
      font-size: 1.25rem;
      color: #0f172a;
    `;
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #64748b;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.3s ease;
    `;
    closeBtn.onmouseover = () => { closeBtn.style.color = '#ef4444'; };
    closeBtn.onmouseout = () => { closeBtn.style.color = '#64748b'; };
    
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
    // Wait for tables to be rendered
    setTimeout(() => {
      document.querySelectorAll('.mpd-table td a[href^="data:"], .mpd-table td a[href^="http"]').forEach(link => {
        // Skip if already processed
        if (link.getAttribute('data-mpd-processed')) return;
        
        link.setAttribute('data-mpd-processed', 'true');
        link.addEventListener('click', (e) => {
          e.preventDefault();
          openFileModal(link.href, link.textContent.trim());
        });
      });
    }, 500);
  };
  
  // Initial processing and set up observer for future updates
  processFileLinks();
  
  // Set up mutation observer to watch for new tables being added
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        processFileLinks();
      }
    }
  });
  
  // Start observing the disclosure sections container
  const container = document.getElementById('disclosure-sections');
  if (container) {
    observer.observe(container, { childList: true, subtree: true });
  }
});

// Function to open file modal
function openFileModal(fileUrl, title = 'File Viewer') {
  const modal = document.getElementById('mpd-file-modal');
  const modalTitle = document.getElementById('mpd-file-modal-title');
  const modalBody = document.getElementById('mpd-file-modal-body');
  
  if (!modal || !modalTitle || !modalBody) return;
  
  // Set title
  modalTitle.textContent = title;
  
  // Clear previous content
  modalBody.innerHTML = '';
  
  // Check file type
  const isImage = fileUrl.includes('data:image/') || fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPDF = fileUrl.includes('data:application/pdf') || fileUrl.endsWith('.pdf');
  
  // Create appropriate content based on file type
  if (isImage) {
    const img = document.createElement('img');
    img.src = fileUrl;
    img.style.cssText = `
      max-width: 100%;
      max-height: 70vh;
      object-fit: contain;
    `;
    modalBody.appendChild(img);
  } else if (isPDF) {
    const embed = document.createElement('embed');
    embed.src = fileUrl;
    embed.type = 'application/pdf';
    embed.style.cssText = `
      width: 100%;
      height: 70vh;
    `;
    modalBody.appendChild(embed);
  } else {
    // For other file types, provide a download link
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
  }
  
  // Show modal with animation
  modal.style.display = 'flex';
  setTimeout(() => {
    modal.style.opacity = '1';
    modal.querySelector('div').style.transform = 'scale(1)';
  }, 10);
}

// Function to close file modal
function closeFileModal() {
  const modal = document.getElementById('mpd-file-modal');
  if (!modal) return;
  
  // Hide modal with animation
  modal.style.opacity = '0';
  modal.querySelector('div').style.transform = 'scale(0.95)';
  
  setTimeout(() => {
    modal.style.display = 'none';
    document.getElementById('mpd-file-modal-body').innerHTML = '';
  }, 300);
}
