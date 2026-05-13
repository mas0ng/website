const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const header = document.querySelector("[data-header]");
const contactForm = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");

function closeNav() {
  document.body.classList.remove("nav-open");
  navToggle?.setAttribute("aria-expanded", "false");
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

const headerObserver = new IntersectionObserver(
  ([entry]) => {
    header?.classList.toggle("is-scrolled", !entry.isIntersecting);
  },
  { threshold: 0 }
);

const main = document.querySelector("main");
if (main) {
  headerObserver.observe(main);
}

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
