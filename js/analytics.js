// Google Analytics Configuration
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', 'G-02JK84S8NH');

// Additional GA4 configuration
gtag('config', 'GA_MEASUREMENT_ID', {
  page_title: document.title,
  page_location: window.location.href,
  custom_map: {'dimension1': 'school_section'}
});

// Track school section interactions
document.addEventListener('click', function(e) {
  if (e.target.matches('a[href^="#"]')) {
    const section = e.target.getAttribute('href').replace('#', '');
    gtag('event', 'section_view', {
      'school_section': section,
      'event_category': 'navigation'
    });
  }
});