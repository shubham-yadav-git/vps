/**
 * Helper function to clean Firestore data by removing nested arrays and complex objects
 * This prevents the "Nested arrays are not supported" error in Firestore
 */

/**
 * Clean an object to make it Firestore-safe by converting nested objects to strings
 * @param {Object} obj - The object to clean
 * @returns {Object} - A Firestore-safe version of the object
 */
function cleanForFirestore(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // If it's an array, map through its items
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (Array.isArray(item)) {
        // Convert nested arrays to JSON strings to avoid Firestore nested array error
        return JSON.stringify(item);
      } else if (item && typeof item === 'object') {
        // Clean nested objects
        return cleanForFirestore(item);
      } else {
        return item;
      }
    });
  }

  // For regular objects
  const result = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (Array.isArray(value)) {
        // Handle arrays (potentially containing nested arrays or objects)
        result[key] = value.map(item => {
          if (Array.isArray(item)) {
            // Convert nested arrays to strings
            return JSON.stringify(item);
          } else if (item && typeof item === 'object') {
            // Clean nested objects
            return cleanForFirestore(item);
          } else {
            return item;
          }
        });
      } else if (value && typeof value === 'object') {
        // Clean nested objects
        result[key] = cleanForFirestore(value);
      } else {
        // Primitive values are kept as is
        result[key] = value;
      }
    }
  }
  
  return result;
}

/**
 * Clean sections for Firestore by removing rows and cleaning any nested arrays
 * @param {Array} sections - Array of section objects
 * @param {String} [currentSectionId] - ID of the current section being edited
 * @returns {Array} - Firestore-safe sections array
 */
function cleanSectionsForFirestore(sections, currentSectionId = null) {
  if (!Array.isArray(sections)) {
    console.error('[CLEAN] sections is not an array:', sections);
    return [];
  }
  
  console.log(`[CLEAN] Cleaning ${sections.length} sections for Firestore`);
  
  return sections.map(section => {
    // Skip null or non-object sections
    if (!section || typeof section !== 'object') {
      return section;
    }
    
    // Create a copy of the section without rows
    const cleanSection = { ...section };
    delete cleanSection.rows;
    
    // If this is the current section, log the cleaning
    if (currentSectionId && section.id === currentSectionId) {
      console.log(`[CLEAN] Cleaning current section: ${section.id}`);
    }
    
    // Clean the section object to make it Firestore-safe
    return cleanForFirestore(cleanSection);
  });
}
