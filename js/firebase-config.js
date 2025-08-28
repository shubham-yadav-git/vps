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

  // Only show hero section when Firestore data is loaded
  function updateHeroSection(heroData) {
    const heroElement = document.querySelector('.hero');
    if (heroElement) {
      const heroSkeleton = heroElement.querySelector('.hero-skeleton');
      const heroActualContent = heroElement.querySelector('.hero-actual-content');
      const heroTitle = heroElement.querySelector('.hero-title');
      const heroSubtitle = heroElement.querySelector('.hero-subtitle');

      // Set content only if Firestore data is present
      if (heroData && heroTitle && heroSubtitle) {
        heroTitle.textContent = heroData.title || '';
        heroSubtitle.textContent = heroData.subtitle || '';
      }

      // Hide skeleton, show actual content only if Firestore data is present
      if (heroSkeleton) {
        heroSkeleton.style.display = 'none';
      }
      if (heroActualContent) {
        if (heroData) {
          heroActualContent.style.display = '';
          heroActualContent.classList.add('loaded');
        } else {
          heroActualContent.style.display = 'none';
        }
      }

      // Handle background image
      if (heroData && heroData.backgroundImage && heroData.backgroundImage.trim() !== '') {
        heroElement.style.setProperty('--hero-bg-image', `url(${heroData.backgroundImage})`);
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
      firebase.initializeApp(firebaseConfig);
      db = firebase.firestore();
      
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
      console.log('Firebase not available, hero section will remain hidden.');
    }
  } else {
    console.log('Firebase not loaded, hero section will remain hidden.');
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

  // Free tier optimized data loading with auto-invalidation
  async function loadDynamicContent() {
    try {
      const now = Date.now();
      const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
      
      // Load faculty data with smart caching
      const facultyCache = localStorage.getItem('facultyData');
      const facultyCacheTime = parseInt(localStorage.getItem('facultyCacheTime'));
      
      if (facultyCache && await shouldUseCache('faculty', facultyCacheTime, now, CACHE_DURATION)) {
        // Use cached data to minimize reads
        console.log('Using cached faculty data');
        updateFacultySection(JSON.parse(facultyCache));
      } else {
        // Fetch fresh data only when needed
        console.log('Fetching fresh faculty data');
        const facultySnapshot = await db.collection('faculty').get();
        const facultyData = facultySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        
        // Cache the data
        localStorage.setItem('facultyData', JSON.stringify(facultyData));
        localStorage.setItem('facultyCacheTime', now.toString());
        
        console.log('Faculty data loaded:', facultyData); // Debug log
        updateFacultySection(facultyData);
      }
      
      // Load testimonials with smart caching
      const testimonialsCache = localStorage.getItem('testimonialsData');
      const testimonialsCacheTime = parseInt(localStorage.getItem('testimonialsCacheTime'));
      
      if (testimonialsCache && await shouldUseCache('testimonials', testimonialsCacheTime, now, CACHE_DURATION)) {
        console.log('Using cached testimonials data');
        updateTestimonialsSection(JSON.parse(testimonialsCache));
      } else {
        console.log('Fetching fresh testimonials data');
        const testimonialsSnapshot = await db.collection('testimonials').get();
        const testimonialsData = testimonialsSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        
        localStorage.setItem('testimonialsData', JSON.stringify(testimonialsData));
        localStorage.setItem('testimonialsCacheTime', now.toString());
        
        updateTestimonialsSection(testimonialsData);
      }
      
      // Load gallery data with smart caching
      const galleryCache = localStorage.getItem('galleryData');
      const galleryCacheTime = parseInt(localStorage.getItem('galleryCacheTime'));
      
      if (galleryCache && await shouldUseCache('gallery', galleryCacheTime, now, CACHE_DURATION)) {
        console.log('Using cached gallery data');
        updateGallerySection(JSON.parse(galleryCache));
      } else {
        console.log('Fetching fresh gallery data');
        const gallerySnapshot = await db.collection('gallery').get();
        const galleryData = gallerySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        
        localStorage.setItem('galleryData', JSON.stringify(galleryData));
        localStorage.setItem('galleryCacheTime', now.toString());
        
        updateGallerySection(galleryData);
      }
      
      // Load events data with smart caching
      const eventsCache = localStorage.getItem('eventsData');
      const eventsCacheTime = parseInt(localStorage.getItem('eventsCacheTime'));
      
      if (eventsCache && await shouldUseCache('events', eventsCacheTime, now, CACHE_DURATION)) {
        console.log('Using cached events data');
        updateEventsSection(JSON.parse(eventsCache));
      } else {
        console.log('Fetching fresh events data');
        const eventsSnapshot = await db.collection('events').get();
        const eventsData = eventsSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        
        localStorage.setItem('eventsData', JSON.stringify(eventsData));
        localStorage.setItem('eventsCacheTime', now.toString());
        
        updateEventsSection(eventsData);
      }
      
      // Load hero section data
      await loadSettingsData('hero', function(heroData) {
        // Only show hero section if Firestore data is loaded
        updateHeroSection(heroData);
      });
      
      // Load about section data
      await loadSettingsData('about', updateAboutSection);
      
      // Load academics section data
      await loadSettingsData('academics', updateAcademicsSection);
      
      // Load logo data
      await loadSettingsData('logo', updateLogoSection);
      
      // Load school info data
      await loadSettingsData('school-info', updateSchoolInfoSection);
      
      // Load contact data
      await loadSettingsData('contact', updateContactSection);
      
      // Load FAQ data
      const faqCache = localStorage.getItem('faqData');
      const faqCacheTime = parseInt(localStorage.getItem('faqCacheTime'));
      
      if (faqCache && await shouldUseCache('faq', faqCacheTime, now, CACHE_DURATION)) {
        console.log('Using cached FAQ data');
        updateFaqSection(JSON.parse(faqCache));
      } else {
        console.log('Fetching fresh FAQ data');
        const faqSnapshot = await db.collection('faq').get();
        const faqData = faqSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        
        localStorage.setItem('faqData', JSON.stringify(faqData));
        localStorage.setItem('faqCacheTime', now.toString());
        
        updateFaqSection(faqData);
      }
      
    } catch (error) {
      console.log('Error loading dynamic content, using static fallback:', error);
    }
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
  
  // Force refresh function for immediate updates
  function forceRefreshContent() {
    console.log('Force refreshing all content...');
    
    // Clear all cache
    localStorage.removeItem('facultyData');
    localStorage.removeItem('facultyCacheTime');
    localStorage.removeItem('testimonialsData');
    localStorage.removeItem('testimonialsCacheTime');
    localStorage.removeItem('galleryData');
    localStorage.removeItem('galleryCacheTime');
    localStorage.removeItem('eventsData');
    localStorage.removeItem('eventsCacheTime');
    localStorage.removeItem('heroData');
    localStorage.removeItem('heroCacheTime');
    localStorage.removeItem('aboutData');
    localStorage.removeItem('aboutCacheTime');
    localStorage.removeItem('academicsData');
    localStorage.removeItem('academicsCacheTime');
    localStorage.removeItem('logoData');
    localStorage.removeItem('logoCacheTime');
    localStorage.removeItem('school-infoData');
    localStorage.removeItem('school-infoCacheTime');
    localStorage.removeItem('contactData');
    localStorage.removeItem('contactCacheTime');
    
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
    localStorage.removeItem('facultyData');
    localStorage.removeItem('facultyCacheTime');
    localStorage.removeItem('testimonialsData');
    localStorage.removeItem('testimonialsCacheTime');
    localStorage.removeItem('galleryData');
    localStorage.removeItem('galleryCacheTime');
    localStorage.removeItem('eventsData');
    localStorage.removeItem('eventsCacheTime');
    localStorage.removeItem('heroData');
    localStorage.removeItem('heroCacheTime');
    localStorage.removeItem('aboutData');
    localStorage.removeItem('aboutCacheTime');
    localStorage.removeItem('academicsData');
    localStorage.removeItem('academicsCacheTime');
    localStorage.removeItem('logoData');
    localStorage.removeItem('logoCacheTime');
    localStorage.removeItem('school-infoData');
    localStorage.removeItem('school-infoCacheTime');
    localStorage.removeItem('contactData');
    localStorage.removeItem('contactCacheTime');
    localStorage.removeItem('faqData');
    localStorage.removeItem('faqCacheTime');
    console.log('All cache cleared! Reload the page to see fresh data.');
  };
});