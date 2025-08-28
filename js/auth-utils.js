// Authorization utilities for access control
// This module provides functions to check user permissions and validate access

/**
 * Checks if the current user has admin privileges
 * @returns {boolean} - True if user is authorized as admin
 */
function isAuthorizedAdmin() {
  try {
    // Check if Firebase Auth is available and user is signed in
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
      const user = firebase.auth().currentUser;
      
      // Check if user email is in admin list (you should configure this)
      const adminEmails = [
        'admin@vikaspublicschool.edu',
        // Add more admin emails as needed
      ];
      
      return adminEmails.includes(user.email);
    }
    
    // Fallback: check for admin session in localStorage (less secure)
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession) {
      try {
        const session = JSON.parse(adminSession);
        const now = Date.now();
        // Check if session is valid and not expired (24 hours)
        return session.timestamp && (now - session.timestamp) < 24 * 60 * 60 * 1000;
      } catch (e) {
        localStorage.removeItem('adminSession');
        return false;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking admin authorization:', error);
    return false;
  }
}

/**
 * Checks if the current user can access file operations
 * @returns {boolean} - True if user can access files
 */
function canAccessFiles() {
  // For file access, we allow public access but log the attempt
  if (window.SecurityUtils) {
    console.log('File access requested:', window.SecurityUtils.sanitizeForLogging(window.location.href));
  }
  return true; // Allow public file access for school documents
}

/**
 * Checks if the current user can modify data
 * @returns {boolean} - True if user can modify data
 */
function canModifyData() {
  return isAuthorizedAdmin();
}

/**
 * Validates route access based on current page
 * @param {string} route - The route to validate
 * @returns {boolean} - True if access is allowed
 */
function validateRouteAccess(route) {
  try {
    const safeRoute = window.SecurityUtils ? window.SecurityUtils.sanitizeForLogging(route) : route;
    
    // Admin routes require authorization
    if (route.includes('admin') || route.includes('edit') || route.includes('manage')) {
      const hasAccess = isAuthorizedAdmin();
      if (!hasAccess) {
        console.warn('Unauthorized access attempt to admin route:', safeRoute);
      }
      return hasAccess;
    }
    
    // Public routes are always accessible
    return true;
  } catch (error) {
    console.error('Error validating route access:', error);
    return false; // Deny access on error
  }
}

/**
 * Logs access attempts for security monitoring
 * @param {string} action - The action being attempted
 * @param {string} resource - The resource being accessed
 */
function logAccessAttempt(action, resource) {
  try {
    const timestamp = new Date().toISOString();
    const userAgent = navigator.userAgent;
    const url = window.location.href;
    
    const logEntry = {
      timestamp,
      action: window.SecurityUtils ? window.SecurityUtils.sanitizeForLogging(action) : action,
      resource: window.SecurityUtils ? window.SecurityUtils.sanitizeForLogging(resource) : resource,
      userAgent: window.SecurityUtils ? window.SecurityUtils.sanitizeForLogging(userAgent) : userAgent,
      url: window.SecurityUtils ? window.SecurityUtils.sanitizeForLogging(url) : url
    };
    
    // Log to console (in production, you might want to send to a logging service)
    console.log('Access attempt:', logEntry);
    
    // Store in localStorage for basic audit trail (limited storage)
    const accessLog = JSON.parse(localStorage.getItem('accessLog') || '[]');
    accessLog.push(logEntry);
    
    // Keep only last 50 entries to prevent storage overflow
    if (accessLog.length > 50) {
      accessLog.splice(0, accessLog.length - 50);
    }
    
    localStorage.setItem('accessLog', JSON.stringify(accessLog));
  } catch (error) {
    console.error('Error logging access attempt:', error);
  }
}

// Export functions for use in other modules
window.AuthUtils = {
  isAuthorizedAdmin,
  canAccessFiles,
  canModifyData,
  validateRouteAccess,
  logAccessAttempt
};