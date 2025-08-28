// Function to ensure rows are properly formatted for Firebase 
function formatRowsForFirebase(rows, fields) {
  if (!Array.isArray(rows) || !Array.isArray(fields)) {
    console.warn('[DEBUG] formatRowsForFirebase called with invalid data:', { rows, fields });
    return [];
  }
  
  console.log('[FORMAT] Formatting', rows.length, 'rows with', fields.length, 'fields');
  
  const formattedRows = rows.map((row, rowIndex) => {
    // If row is already an array, return it
    if (Array.isArray(row)) {
      console.log(`[FORMAT] Row ${rowIndex} is already an array:`, row);
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
          console.log(`[FORMAT] Row ${rowIndex}, Field ${fieldIndex} (${fieldLabel}): Using ID value: ${value}`);
        } else if (fieldLabel && row[fieldLabel] !== undefined) {
          value = row[fieldLabel];
          console.log(`[FORMAT] Row ${rowIndex}, Field ${fieldIndex} (${fieldLabel}): Using label value: ${value}`);
        }
        
        return value;
      });
      
      console.log(`[FORMAT] Row ${rowIndex} converted from object to array:`, arrayRow);
      return arrayRow;
    }
    
    // Fallback for invalid rows
    console.log(`[FORMAT] Row ${rowIndex} is invalid, creating empty row`);
    return Array(fields.length).fill('');
  });
  
  console.log('[FORMAT] Final formatted rows:', formattedRows);
  return formattedRows;
}

// Test the function
console.log('[DEBUG] Testing formatRowsForFirebase:');

const testFields = [
  { label: 'Name', id: 'name' },
  { label: 'Age', id: 'age' },
  { label: 'City', id: 'city' }
];

const testRows = [
  ['John', '25', 'New York'],         // Array row
  { name: 'Alice', age: '30', city: 'London' },  // Object with IDs
  { Name: 'Bob', Age: '40', City: 'Paris' }      // Object with labels
];

console.log('[DEBUG] Formatted rows:', formatRowsForFirebase(testRows, testFields));
