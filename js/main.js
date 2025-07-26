// Vikas Public School JS - moved from index.html
function toggleMenu() {
  const menu = document.getElementById("menu");
  const hamburger = document.querySelector(".hamburger");
  const isExpanded = hamburger.getAttribute("aria-expanded") === "true";

  if (isExpanded) {
    menu.classList.remove("show");
    hamburger.setAttribute("aria-expanded", "false");
  } else {
    menu.classList.add("show");
    hamburger.setAttribute("aria-expanded", "true");
  }
}

// Simple form validation and submission handler
function handleSubmit(event) {
  event.preventDefault();

  const name = document.getElementById("name");
  const email = document.getElementById("email");
  const nameError = document.getElementById("name-error");
  const emailError = document.getElementById("email-error");
  let valid = true;

  if (!name.value.trim()) {
    nameError.style.display = "block";
    valid = false;
    name.focus();
  } else {
    nameError.style.display = "none";
  }

  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!email.value.trim() || !emailPattern.test(email.value.trim())) {
    emailError.style.display = "block";
    if (valid) email.focus();
    valid = false;
  } else {
    emailError.style.display = "none";
  }

  if (valid) {
    alert("Thank you for contacting Vikas Public School. We will get back to you shortly.");
    event.target.reset();
  }

  return false;
}

// FAQ toggle functionality
window.addEventListener("DOMContentLoaded", () => {
  const faqButtons = document.querySelectorAll(".faq-question");
  faqButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      // Collapse all others
      faqButtons.forEach((otherBtn) => {
        if (otherBtn !== btn) {
          otherBtn.setAttribute("aria-expanded", "false");
          otherBtn.parentElement.classList.remove("open");
        }
      });
      // Toggle current
      btn.setAttribute("aria-expanded", String(!expanded));
      btn.parentElement.classList.toggle("open", !expanded);
    });
  });
});

// Modal logic for gallery images
document.addEventListener('DOMContentLoaded', function () {
  const modal = document.getElementById('imgModal');
  const modalImg = document.getElementById('modalImg');
  const modalClose = document.getElementById('modalClose');
  const galleryLinks = document.querySelectorAll('.gallery-link');

  galleryLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const imgSrc = link.getAttribute('data-img');
      modalImg.src = imgSrc;
      modal.style.display = 'block';
      modal.focus();
    });
  });

  function closeModal() {
    modal.style.display = 'none';
    modalImg.src = '';
  }

  modalClose.addEventListener('click', closeModal);
  modalClose.addEventListener('keypress', function (e) {
    if (e.key === 'Enter' || e.key === ' ') closeModal();
  });

  // Close modal when clicking outside the image
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });

  // Close modal on Escape key
  document.addEventListener('keydown', function (e) {
    if (modal.style.display === 'block' && e.key === 'Escape') closeModal();
  });
});
