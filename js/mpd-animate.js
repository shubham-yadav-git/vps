// GSAP animation for smooth section entrance and table fade-in
window.addEventListener('DOMContentLoaded', function() {
  if (typeof gsap === 'undefined') return;

  // Animate all .mpd-section on scroll into view
  document.querySelectorAll('.mpd-section').forEach(function(section, i) {
    gsap.set(section, {opacity: 0, y: 40});
    gsap.to(section, {
      scrollTrigger: {
        trigger: section,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
      opacity: 1,
      y: 0,
      duration: 0.7,
      delay: i * 0.08,
      ease: 'power2.out'
    });
  });

  // Animate tables inside sections
  document.querySelectorAll('.mpd-section .mpd-table').forEach(function(table) {
    gsap.set(table, {opacity: 0, y: 20});
    gsap.to(table, {
      scrollTrigger: {
        trigger: table,
        start: 'top 90%',
        toggleActions: 'play none none none',
      },
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power1.out'
    });
  });
});
