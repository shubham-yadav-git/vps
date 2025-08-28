// Format rows for Firebase - ensures consistent array format
function formatRowsForFirebase(rows, fields) {
  if (!Array.isArray(rows) || !Array.isArray(fields)) {
    console.warn('[DEBUG] formatRowsForFirebase called with invalid data:', { rows, fields });
    return [];
  }
  
  const safeRowsLength = window.SecurityUtils ? window.SecurityUtils.sanitizeForLogging(String(rows.length)) : rows.length;
  const safeFieldsLength = window.SecurityUtils ? window.SecurityUtils.sanitizeForLogging(String(fields.length)) : fields.length;
  console.log('[FORMAT] Formatting', safeRowsLength, 'rows with', safeFieldsLength, 'fields');
  
  const formattedRows = rows.map((row, rowIndex) => {
    // If row is already an array, return it
    if (Array.isArray(row)) {
      const safeRowIndex = window.SecurityUtils ? window.SecurityUtils.sanitizeForLogging(String(rowIndex)) : rowIndex;
      const safeRow = window.SecurityUtils ? window.SecurityUtils.sanitizeForLogging(JSON.stringify(row)) : JSON.stringify(row);
      console.log(`[FORMAT] Row ${safeRowIndex} is already an array:`, safeRow);
      return row;
    }
    
    // If row is an object, convert it to array based on field order
    if (typeof row === 'object' && row !== null) {
      const arrayRow = fields.map((field, fieldIndex) => {
        const fieldId = field.id || '';
        const fieldLabel = field.label || '';
        
        // Try to get value by ID first, then by label
        let value = '';
        if (fieldId && row[fieldId] !== undefined) {
          value = row[fieldId];
        } else if (fieldLabel && row[fieldLabel] !== undefined) {
          value = row[fieldLabel];
        }
        
        return value;
      });
      
      const safeRowIndex = window.SecurityUtils ? window.SecurityUtils.sanitizeForLogging(String(rowIndex)) : rowIndex;
      const safeArrayRow = window.SecurityUtils ? window.SecurityUtils.sanitizeForLogging(JSON.stringify(arrayRow)) : JSON.stringify(arrayRow);
      console.log(`[FORMAT] Row ${safeRowIndex} converted from object to array:`, safeArrayRow);
      return arrayRow;
    }
    
    // Fallback for invalid rows
    const safeRowIndex = window.SecurityUtils ? window.SecurityUtils.sanitizeForLogging(String(rowIndex)) : rowIndex;
    console.log(`[FORMAT] Row ${safeRowIndex} is invalid, creating empty row`);
    return Array(fields.length).fill('');
  });
  
  const safeFormattedRows = window.SecurityUtils ? window.SecurityUtils.sanitizeForLogging(JSON.stringify(formattedRows)) : JSON.stringify(formattedRows);
  console.log('[FORMAT] Final formatted rows:', safeFormattedRows);
  return formattedRows;
}

// Fixed save button handler 
function setupSaveSectionHandler() {
  console.log("[DEBUG] Setting up fixed save section handler");
  
  // Find the save button and attach the handler
  const saveSectionBtn = document.getElementById("save-section-data");
  if (!saveSectionBtn) {
    console.warn("[DEBUG] Save button not found");
    return;
  }
  
  // Remove any existing event listeners (if possible)
  const oldElement = saveSectionBtn.cloneNode(true);
  saveSectionBtn.parentNode.replaceChild(oldElement, saveSectionBtn);
  
  // Get the new button
  const newSaveBtn = document.getElementById("save-section-data");
  
  // Add the new event listener
  newSaveBtn.addEventListener("click", function() {
    console.log('[DEBUG] Fixed save handler activated');
    
    // Check authorization for data modification
    if (window.AuthUtils && !window.AuthUtils.canModifyData()) {
      alert('You are not authorized to modify data. Please log in as an administrator.');
      return;
    }
    
    // Log data modification attempt
    if (window.AuthUtils) {
      window.AuthUtils.logAccessAttempt('data_modification', 'disclosure_section');
    }
    
    // Get current section
    const selected = window.disclosureSectionSelected;
    const sectionIndex = window.disclosureSections.findIndex(s => s.id === selected);
    if (sectionIndex === -1) {
      const safeSelected = window.SecurityUtils ? window.SecurityUtils.sanitizeForLogging(selected) : selected;
      console.error(`[DEBUG] Section with ID ${safeSelected} not found`);
      alert('Section not found. Please refresh the page and try again.');
      return;
    }
    
    // Get the current section
    const section = window.disclosureSections[sectionIndex];
    
    // Save to Firebase
    if (!db) {
      alert('Database connection not available.');
      return;
    }

    newSaveBtn.disabled = true;
    newSaveBtn.innerHTML = '<span class="icon">⏳</span> Saving...';
    
    // Ensure all row data is properly structured before saving
    if (section.rows && Array.isArray(section.rows)) {
      // First ensure all fields have IDs
      section.fields.forEach(field => {
        if (!field.id && field.label) {
          field.id = field.label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        }
      });
    }
    
    // Prepare section metadata (without rows)
    const sectionMetadata = { ...section };
    delete sectionMetadata.rows;
    
    // Update metadata for all sections
    const sectionsMetadata = window.disclosureSections.map(s => {
      if (s.id === selected) {
        return { 
          id: selected,
          label: section.label || '',
          enabled: section.enabled !== false,
          fields: section.fields.map(f => ({
            label: f.label || '',
            id: f.id || '',
            type: f.type || 'text'
          }))
        };
      } else {
        const simple = { ...s };
        delete simple.rows;
        return simple;
      }
    });
    
    // Save section metadata to Firestore
    newSaveBtn.innerHTML = '<span class="icon">⏳</span> Saving sections...';
    
    db.collection("settings").doc("disclosure").set({
      sections: sectionsMetadata
    }, { merge: true })
    .then(() => {
      newSaveBtn.innerHTML = '<span class="icon">⏳</span> Saving rows...';
      
      // Delete existing rows for this section
      return db.collection("disclosure_rows")
        .where("sectionId", "==", selected)
        .get();
    })
    .then(snapshot => {
      const safeDocsLength = window.SecurityUtils ? window.SecurityUtils.sanitizeForLogging(String(snapshot.docs.length)) : snapshot.docs.length;
      console.log(`Found ${safeDocsLength} existing rows to delete`);
      
      // Create a batch to delete existing rows
      let deleteBatch = db.batch();
      let deleteCount = 0;
      
      snapshot.docs.forEach(doc => {
        deleteBatch.delete(doc.ref);
        deleteCount++;
        
        // Firestore batches are limited to 500 operations
        if (deleteCount >= 450) {
          // Commit this batch and start a new one
          deleteBatch.commit();
          deleteBatch = db.batch();
          deleteCount = 0;
        }
      });
      
      // Commit any remaining deletes
      return deleteCount > 0 ? deleteBatch.commit() : Promise.resolve();
    })
    .then(() => {
      // Now create documents for each row
      newSaveBtn.innerHTML = '<span class="icon">⏳</span> Saving new rows...';
      
      // Format rows properly
      const formattedRows = formatRowsForFirebase(section.rows || [], section.fields || []);
      
      // Store the formatted rows back to the section
      section.rows = formattedRows;
      
      const safeRowsLength = window.SecurityUtils ? window.SecurityUtils.sanitizeForLogging(String(formattedRows.length)) : formattedRows.length;
      const safeSelected = window.SecurityUtils ? window.SecurityUtils.sanitizeForLogging(selected) : selected;
      console.log(`[DEBUG] Saving ${safeRowsLength} formatted rows for section ${safeSelected}`);
      
      let batch = db.batch();
      let count = 0;
      
      // Add all the formatted rows
      formattedRows.forEach((rowValues, rowIndex) => {
        const rowDocRef = db.collection("disclosure_rows").doc(`${selected}_row_${rowIndex}`);
        
        // Save row data as values array to match what the public page expects
        const docData = {
          sectionId: selected,
          rowIndex: rowIndex,
          values: Array.isArray(rowValues) ? rowValues : []
        };
        
        batch.set(rowDocRef, docData);
        count++;
        
        // Firestore batches are limited to 500 operations
        if (count >= 450) {
          // Commit this batch and start a new one
          batch.commit();
          batch = db.batch();
          count = 0;
        }
      });
      
      // Commit any remaining operations
      return count > 0 ? batch.commit() : Promise.resolve();
    })
    .then(() => {
      newSaveBtn.innerHTML = '<span class="icon">✅</span> Saved!';
      const safeSelected = window.SecurityUtils ? window.SecurityUtils.sanitizeForLogging(selected) : selected;
      const safeRowsLength = window.SecurityUtils ? window.SecurityUtils.sanitizeForLogging(String(section.rows?.length || 0)) : (section.rows?.length || 0);
      console.log(`Successfully saved section ${safeSelected} with ${safeRowsLength} rows`);
      
      // Store updated rows in the global array too
      const idx = window.disclosureSections.findIndex(s => s.id === selected);
      if (idx !== -1) {
        window.disclosureSections[idx].rows = [...section.rows];
      }
      
      setTimeout(() => {
        // Re-render without reloading from Firestore
        renderDisclosureSection();
        
        newSaveBtn.innerHTML = '<span class="icon">💾</span> Save Section Data';
        newSaveBtn.disabled = false;
        showSuccessIndicator('section-save', 'Section data saved successfully');
      }, 1200);
    })
    .catch(err => {
      const errorMsg = window.SecurityUtils ? window.SecurityUtils.sanitizeForLogging(err.message) : err.message;
      console.error("Error saving section data:", errorMsg);
      newSaveBtn.innerHTML = '<span class="icon">❌</span> Error';
      const safeErrorMsg = window.SecurityUtils ? window.SecurityUtils.sanitizeHTML(err.message) : err.message;
      alert('Failed to save: ' + safeErrorMsg);
      setTimeout(() => {
        newSaveBtn.innerHTML = '<span class="icon">💾</span> Save Section Data';
        newSaveBtn.disabled = false;
      }, 2000);
    });
  });
  
  console.log("[DEBUG] Fixed save handler setup complete");
}

// Execute the setup when the document is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log("[DEBUG] DOMContentLoaded - waiting to set up save handler");
  
  // Wait a bit to ensure the original handler is in place
  setTimeout(function() {
    setupSaveSectionHandler();
  }, 1000);
});
