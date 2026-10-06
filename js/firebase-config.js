// Firebase Configuration and Dynamic Content Loading
document.addEventListener('DOMContentLoaded', function() {
  // Clear any potentially cached hero data that might be causing issues
  localStorage.removeItem('heroData');
  localStorage.removeItem('heroCacheTime');
  
  // Also clear any other cached data that might interfere
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes('hero')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));

  // Show Firestore hero data when available, otherwise the static default content
  function updateHeroSection(heroData) {
    const heroElement = document.querySelector('.hero');
    if (heroElement) {
      const heroSkeleton = heroElement.querySelector('.hero-skeleton');
      const heroActualContent = heroElement.querySelector('.hero-actual-content');
      const heroTitle = heroElement.querySelector('.hero-title');
      const heroSubtitle = heroElement.querySelector('.hero-subtitle');

      if (heroData && heroTitle && heroSubtitle) {
        if (heroData.title) heroTitle.textContent = heroData.title;
        if (heroData.subtitle) heroSubtitle.textContent = heroData.subtitle;
      }

      // Hide skeleton, show actual content only if Firestore data is present
      if (heroSkeleton) {
        heroSkeleton.style.display = 'none';
      }
      if (heroActualContent) {
        heroActualContent.style.display = '';
        heroActualContent.classList.add('loaded');
      }

      // Handle background image
      if (heroData && heroData.backgroundImage && heroData.backgroundImage.trim() !== '') {
        heroElement.style.setProperty('--hero-bg-image', `url("${heroData.backgroundImage.replace(/["\\\n]/g, '')}")`);
        heroElement.classList.add('has-custom-image');
      } else {
        heroElement.classList.remove('has-custom-image');
        heroElement.style.removeProperty('--hero-bg-image');
      }
    }
  }
  
  // Firebase configuration for free tier
  const firebaseConfig = {
    apiKey: "AIzaSyDZH0ZcGAtrILqdRdI5dIhZCUA0eAJzRpE",
    authDomain: "vpschool-918d6.firebaseapp.com",
    projectId: "vpschool-918d6",
    storageBucket: "vpschool-918d6.firebasestorage.app",
    messagingSenderId: "290237090155",
    appId: "1:290237090155:web:90356cb12d25d5a0a8a42e",
    measurementId: "G-02JK84S8NH"
  };
  
  // Initialize Firebase for main website
  let db;
  if (typeof firebase !== 'undefined') {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.firestore();
      window.db = db;
      
      // Enable offline persistence for free tier efficiency
      db.enablePersistence({ synchronizeTabs: true })
        .then(() => {
          console.log('Firebase persistence enabled - optimized for free tier!');
        })
        .catch(() => {
          console.log('Persistence not available in this browser');
        });
      
      console.log('Firebase initialized for main website');
      
      // Load dynamic content efficiently
      loadDynamicContent();
    } catch (error) {
      console.log('Firebase not available, using static content.');
      updateHeroSection(null);
    }
  } else {
    console.log('Firebase not loaded, using static content.');
    updateHeroSection(null);
  }
  
  // Enhanced cache checking function
  async function shouldUseCache(type, cachedTime, now, CACHE_DURATION) {
    // First check if cache is within time limit
    if (!cachedTime || (now - cachedTime >= CACHE_DURATION)) {
      return false;
    }
    
    try {
      // Check if admin has invalidated this cache
      const cacheDoc = await db.collection('cache').doc(type).get();
      if (cacheDoc.exists) {
        const cacheInfo = cacheDoc.data();
        const lastUpdated = cacheInfo.lastUpdated;
        
        // If admin updated content after our cache, invalidate it
        if (lastUpdated > cachedTime) {
          console.log(`Cache invalidated for ${type} - admin updated content`);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.log(`Error checking cache invalidation for ${type}, using time-based cache:`, error);
      return (now - cachedTime < CACHE_DURATION);
    }
  }

  // Load a whole collection with smart caching; failures are isolated per collection
  async function loadCollectionData(collection, updateFunction, now, CACHE_DURATION) {
    try {
      const cache = localStorage.getItem(`${collection}Data`);
      const cacheTime = parseInt(localStorage.getItem(`${collection}CacheTime`));

      if (cache && await shouldUseCache(collection, cacheTime, now, CACHE_DURATION)) {
        updateFunction(JSON.parse(cache));
        return;
      }

      const snapshot = await db.collection(collection).get();
      const data = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));

      localStorage.setItem(`${collection}Data`, JSON.stringify(data));
      localStorage.setItem(`${collection}CacheTime`, now.toString());

      updateFunction(data);
    } catch (error) {
      console.log(`Error loading ${collection} data, keeping static content:`, error);
    }
  }

  // Free tier optimized data loading with auto-invalidation
  async function loadDynamicContent() {
    const now = Date.now();
    const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

    // Hero first so the top of the page is never left blank
    await loadSettingsData('hero', updateHeroSection);

    await Promise.all([
      loadCollectionData('faculty', updateFacultySection, now, CACHE_DURATION),
      loadCollectionData('testimonials', updateTestimonialsSection, now, CACHE_DURATION),
      loadCollectionData('gallery', updateGallerySection, now, CACHE_DURATION),
      loadCollectionData('events', updateEventsSection, now, CACHE_DURATION),
      loadCollectionData('faq', updateFaqSection, now, CACHE_DURATION),
      loadSettingsData('about', updateAboutSection),
      loadSettingsData('academics', updateAcademicsSection),
      loadSettingsData('logo', updateLogoSection),
      loadSettingsData('school-info', updateSchoolInfoSection),
      loadSettingsData('contact', updateContactSection)
    ]);
  }
  
  // Helper function to load settings data (hero, about, school-info, contact)
  async function loadSettingsData(type, updateFunction) {
    try {
      const now = Date.now();
      const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
      
      const cacheKey = `${type}Data`;
      const cacheTimeKey = `${type}CacheTime`;
      
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTime = parseInt(localStorage.getItem(cacheTimeKey));
      
      if (cachedData && await shouldUseCache(type, cacheTime, now, CACHE_DURATION)) {
        console.log(`Using cached ${type} data`);
        updateFunction(JSON.parse(cachedData));
      } else {
        console.log(`Fetching fresh ${type} data`);
        const docSnapshot = await db.collection('settings').doc(type).get();
        
        if (docSnapshot.exists) {
          const data = docSnapshot.data();
          
          // Cache the data
          localStorage.setItem(cacheKey, JSON.stringify(data));
          localStorage.setItem(cacheTimeKey, now.toString());
          
          updateFunction(data);
        } else {
          console.log(`No ${type} data found in database, using fallback`);
          // Still call the update function with null/undefined data to handle fallbacks
          updateFunction(null);
        }
      }
    } catch (error) {
      console.log(`Error loading ${type} data, using fallback:`, error);
      // Call update function with null data to handle fallbacks
      updateFunction(null);
    }
  }
  
  const CACHED_CONTENT_TYPES = [
    'faculty', 'testimonials', 'gallery', 'events', 'faq',
    'hero', 'about', 'academics', 'logo', 'school-info', 'contact'
  ];

  function clearCachedContent() {
    CACHED_CONTENT_TYPES.forEach(type => {
      localStorage.removeItem(`${type}Data`);
      localStorage.removeItem(`${type}CacheTime`);
    });
  }

  // Force refresh function for immediate updates
  function forceRefreshContent() {
    console.log('Force refreshing all content...');
    
    clearCachedContent();
    
    // Reload content
    loadDynamicContent();
    
    // Show user feedback
    showUpdateNotification('Content refreshed successfully!');
  }
  
  // Show update notification
  function showUpdateNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      z-index: 1000;
      font-family: inherit;
      font-size: 14px;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Hide and remove notification
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
  
  // Add keyboard shortcut for force refresh (Ctrl+Shift+R)
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
      e.preventDefault();
      forceRefreshContent();
    }
  });
  
  // Make functions globally available
  window.forceRefreshContent = forceRefreshContent;
  window.showUpdateNotification = showUpdateNotification;
  
  // Helper function to clear cache for testing (call from browser console)
  window.clearDynamicContentCache = function() {
    clearCachedContent();
    console.log('All cache cleared! Reload the page to see fresh data.');
  };
});