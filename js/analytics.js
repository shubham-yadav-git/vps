// Google Analytics Configuration
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', 'G-02JK84S8NH');

// Track school section interactions
document.addEventListener('click', function(e) {
  const link = e.target.closest('a[href^="#"]');
  if (link) {
    const section = link.getAttribute('href').replace('#', '');
    gtag('event', 'section_view', {
      'school_section': section,
      'event_category': 'navigation'
    });
  }
});
