// Security utilities for input sanitization and validation
// This module provides functions to sanitize user inputs and prevent XSS/injection attacks

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string safe for DOM insertion
 */
function sanitizeHTML(input) {
  if (typeof input !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Sanitizes input for logging to prevent log injection
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string safe for logging
 */
function sanitizeForLogging(input) {
  if (typeof input !== 'string') return String(input);
  
  return input
    .replace(/[\r\n]/g, ' ')  // Remove line breaks
    .replace(/[<>]/g, '')     // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .substring(0, 200);       // Limit length
}

/**
 * Validates and sanitizes URLs
 * @param {string} url - The URL to validate
 * @returns {string|null} - Sanitized URL or null if invalid
 */
function sanitizeURL(url) {
  if (typeof url !== 'string') return null;
  
  try {
    // Allow data URLs for PDFs and images, but validate them
    if (url.startsWith('data:')) {
      if (url.startsWith('data:application/pdf') || url.startsWith('data:image/')) {
        return url;
      }
      return null;
    }
    
    const urlObj = new URL(url);
    if (['http:', 'https:', 'mailto:', 'tel:'].includes(urlObj.protocol)) {
      return url;
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Escapes HTML attributes to prevent attribute injection
 * @param {string} input - The input string to escape
 * @returns {string} - Escaped string safe for HTML attributes
 */
function escapeHTMLAttribute(input) {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Export functions for use in other modules
window.SecurityUtils = {
  sanitizeHTML,
  sanitizeForLogging,
  sanitizeURL,
  escapeHTMLAttribute
};