// Smooth scroll for internal links (navbar)
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

// Contact form: open email client with pre-filled message (same logique que "Parler à un expert")
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
      "Envoyé depuis le site vitrine LoonTech.",
      "",
      "Vous pouvez aussi nous joindre au +229 97 54 65 21."
    ];

    const body = encodeURIComponent(bodyLines.join("\n"));
    const mailtoLink = `mailto:akoueteyannel662@gmail.com?subject=${encodeURIComponent(
      subject
    )}&body=${body}`;

    window.location.href = mailtoLink;

    feedbackEl.textContent =
      "Votre logiciel de messagerie va s’ouvrir avec un email pré-rempli vers LoonTech.";
  });
}

// Dynamic year in footer
const yearSpan = document.getElementById("year");
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}


