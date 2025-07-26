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
