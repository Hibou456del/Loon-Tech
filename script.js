// smooth scroll for internal links (navbar)
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const targetId = this.getAttribute("href");
    if (!targetId || targetId === "#") return;

    const targetElement = document.querySelector(targetId);
    if (!targetElement) return;

    e.preventDefault();
    const yOffset = -70;
    const y =
      targetElement.getBoundingClientRect().top + window.pageYOffset + yOffset;

    window.scrollTo({
      top: y,
      behavior: "smooth",
    });
  });
});

// contact form: open email client with pre-filled message (same logique que "Parler à un expert")
const contactForm = document.getElementById("contact-form");
const feedbackEl = document.getElementById("contact-feedback");

if (contactForm && feedbackEl) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("name")?.value || "";
    const email = document.getElementById("email")?.value || "";
    const project = document.getElementById("project")?.value || "";

    const subject =
      "Contact LoonTech - Nouveau message depuis le formulaire";

    const bodyLines = [
      "Nouveau message depuis le site LoonTech :",
      "",
      `Nom / Structure : ${name}`,
      `Email : ${email}`,
      "",
      "Projet :",
      project,
      "",
      "Envoyé depuis le site vitrine LoonTech."
    ];

    feedbackEl.textContent =
      "Merci pour votre message. Nous vous contacterons bientôt.";
  });
}

// Dynamic year in footer
const yearSpan = document.getElementById("year");
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

// Masonry card click animation
document.querySelectorAll('.masonry-card').forEach(card => {
  card.addEventListener('click', () => {
    card.classList.add('clicked');
    setTimeout(() => {
      card.classList.remove('clicked');
    }, 400); // Match animation duration
  });
});

// Theme toggle functionality
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.querySelector('.theme-icon');

if (themeToggle && themeIcon) {
  // Check for saved theme preference or default to light mode
  const currentTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);

  // Update icon based on current theme
  if (currentTheme === 'dark') {
    themeIcon.classList.remove('bi-moon-stars');
    themeIcon.classList.add('bi-sun');
  } else {
    themeIcon.classList.remove('bi-sun');
    themeIcon.classList.add('bi-moon-stars');
  }

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Update icon
    if (newTheme === 'dark') {
      themeIcon.classList.remove('bi-moon-stars');
      themeIcon.classList.add('bi-sun');
    } else {
      themeIcon.classList.remove('bi-sun');
      themeIcon.classList.add('bi-moon-stars');
    }
  });
}

// Footer fade-in animation on scroll
const footerTop = document.querySelector('.footer-top');
if (footerTop) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        footerTop.classList.add('animate');
      }
    });
  }, { threshold: 0.1 });
  observer.observe(footerTop);
}


