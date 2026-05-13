const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const header = document.querySelector("[data-header]");
const contactForm = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");
const revealItems = document.querySelectorAll(".reveal");
const tiltCards = document.querySelectorAll(".tilt-card");

function closeNav() {
  document.body.classList.remove("nav-open");
  navToggle?.setAttribute("aria-expanded", "false");
}

function updateHeader() {
  header?.classList.toggle("is-scrolled", window.scrollY > 18);
}

function updatePointer(event) {
  document.body.style.setProperty("--mx", `${event.clientX}px`);
  document.body.style.setProperty("--my", `${event.clientY}px`);
}

navToggle?.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

nav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    closeNav();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeNav();
  }
});

window.addEventListener("scroll", () => {
  updateHeader();
}, { passive: true });

window.addEventListener("mousemove", updatePointer, { passive: true });
window.addEventListener("mouseleave", () => {
  document.body.style.setProperty("--mx", "-9999px");
  document.body.style.setProperty("--my", "-9999px");
});

updateHeader();

const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.16 }
);

revealItems.forEach((item) => revealObserver.observe(item));

tiltCards.forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    card.style.setProperty("--tilt-x", `${y * -5}deg`);
    card.style.setProperty("--tilt-y", `${x * 6}deg`);
  });

  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
  });
});

contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = contactForm.querySelector("button[type='submit']");
  const originalText = submitButton?.textContent || "Send enquiry";

  setFormStatus("Sending...");
  submitButton?.setAttribute("disabled", "true");
  if (submitButton) {
    submitButton.textContent = "Sending...";
  }

  try {
    const response = await fetch(contactForm.action, {
      method: "POST",
      body: new FormData(contactForm),
      headers: { Accept: "application/json" },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Something went wrong. Please email mason@mas0ng.com.");
    }

    contactForm.reset();
    window.turnstile?.reset();
    setFormStatus(result.message || "Thanks, I will get back to you soon.");
  } catch (error) {
    setFormStatus(error.message || "Something went wrong. Please email mason@mas0ng.com.", true);
    window.turnstile?.reset();
  } finally {
    submitButton?.removeAttribute("disabled");
    if (submitButton) {
      submitButton.textContent = originalText;
    }
  }
});

function setFormStatus(message, isError = false) {
  if (!formStatus) {
    return;
  }

  formStatus.textContent = message;
  formStatus.classList.toggle("is-error", isError);
}
