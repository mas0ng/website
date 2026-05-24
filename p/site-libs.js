(function () {
  const TAILWIND_URL = "https://cdn.tailwindcss.com";
  const LUCIDE_URL = "https://unpkg.com/lucide@latest";
  const FONT_URL = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap";
  let overlay = null;
  let useOverlay = false;
  let currentAsset = "";
  let loaderDone = false;

  preparePendingState();
  window.mas0ngLoadDesignLibraries = window.mas0ngLoadDesignLibraries || loadDesignLibraries();

  async function loadDesignLibraries() {
    configureTailwind();
    applyBaseClasses();
    showLoadingOverlay();

    try {
      await loadFont();
      await loadScriptAsset(TAILWIND_URL, () => hasScript(TAILWIND_URL));
      await loadScriptAsset(LUCIDE_URL, () => Boolean(window.lucide));
      if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
      }
    } catch {
      return undefined;
    } finally {
      window.setTimeout(hideLoadingOverlay, 160);
    }
  }

  function preparePendingState() {
    useOverlay = !shouldSkipOverlay();
    if (!useOverlay) return;
    document.documentElement.classList.add("mas0ng-style-pending");
    injectPendingStyles();
  }

  function configureTailwind() {
    window.tailwind = window.tailwind || {};
    window.tailwind.config = {
      corePlugins: {
        preflight: false
      },
      theme: {
        extend: {
          fontFamily: {
            sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
          },
          colors: {
            brand: {
              50: "#eff6ff",
              100: "#dbeafe",
              500: "#1688d8",
              600: "#174ea6",
              900: "#073b84"
            }
          }
        }
      }
    };
  }

  function hasScript(src) {
    return Boolean(document.querySelector(`script[src="${src}"]`));
  }

  function loadScriptAsset(src, isLoaded) {
    if (isLoaded()) return Promise.resolve();
    return loadScript(src);
  }

  function loadScript(src) {
    setLoadingAsset(src);
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function loadFont() {
    const existing = document.querySelector('link[href="' + FONT_URL + '"]');
    if (existing) return Promise.resolve();
    setLoadingAsset(FONT_URL);
    const preconnect = document.createElement("link");
    preconnect.rel = "preconnect";
    preconnect.href = "https://fonts.gstatic.com";
    preconnect.crossOrigin = "";
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = FONT_URL;
    const loaded = new Promise((resolve, reject) => {
      stylesheet.onload = resolve;
      stylesheet.onerror = reject;
    });
    document.head.append(preconnect, stylesheet);
    return loaded;
  }

  function applyBaseClasses() {
    const apply = () => {
      if (!document.body) return;
      document.body.classList.add("font-sans");
      document.body.style.fontFamily = 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    };
    if (document.body) apply();
    else document.addEventListener("DOMContentLoaded", apply, { once: true });
  }

  function showLoadingOverlay() {
    if (!useOverlay || shouldSkipOverlay()) return;
    const mount = () => {
      if (!document.body || overlay || loaderDone || shouldSkipOverlay()) return;
      overlay = document.createElement("div");
      overlay.id = "mas0ng-style-loader";
      overlay.setAttribute("aria-hidden", "true");
      overlay.innerHTML = '<div class="mas0ng-style-loader-spinner"></div><p class="mas0ng-style-loader-status" data-style-loader-status>' + escapeHtml(currentAsset) + '</p>';
      document.body.append(overlay);
      injectOverlayStyles();
    };

    if (document.body) mount();
    else document.addEventListener("DOMContentLoaded", mount, { once: true });
  }

  function hideLoadingOverlay() {
    document.documentElement.classList.remove("mas0ng-style-pending");
    loaderDone = true;
    if (!overlay) return;
    overlay.dataset.done = "true";
    window.setTimeout(() => {
      overlay?.remove();
      overlay = null;
    }, 260);
  }

  function shouldSkipOverlay() {
    const path = window.location.pathname.replace(/\/index\.html$/, "/");
    if (path === "/") return true;
    if (path === "/p/" && new URLSearchParams(window.location.search).get("from") === "index") return true;
    return Boolean(document.querySelector("#mas0ng-intro-boot, #intro-overlay[data-active='true']"));
  }

  function setLoadingAsset(src) {
    const text = "Loading " + src;
    currentAsset = text;
    const status = overlay?.querySelector("[data-style-loader-status]");
    if (status) status.textContent = text;
    const introStatus = document.querySelector("[data-intro-status]");
    if (introStatus) introStatus.textContent = text;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function injectOverlayStyles() {
    if (document.getElementById("mas0ng-style-loader-css")) return;
    const style = document.createElement("style");
    style.id = "mas0ng-style-loader-css";
    style.textContent = `
      #mas0ng-style-loader {
        position: fixed;
        inset: 0;
        z-index: 2147482500;
        display: grid;
        place-items: center;
        background: linear-gradient(120deg, rgba(239, 246, 255, 0.92), rgba(255, 255, 255, 0.96), rgba(236, 253, 245, 0.9));
        background-size: 220% 220%;
        animation: mas0ngStyleGradient 1.8s ease-in-out infinite;
        opacity: 1;
        transition: opacity 260ms ease;
        pointer-events: none;
      }
      #mas0ng-style-loader[data-done="true"] { opacity: 0; }
      .mas0ng-style-loader-spinner {
        width: 42px;
        height: 42px;
        border-radius: 999px;
        border: 3px solid rgba(23, 78, 166, 0.18);
        border-top-color: #1688d8;
        box-shadow: 0 18px 45px rgba(22, 136, 216, 0.18);
        animation: mas0ngStyleSpin 760ms linear infinite;
      }
      .mas0ng-style-loader-status {
        position: fixed;
        left: 16px;
        right: 16px;
        bottom: 24px;
        margin: 0;
        color: rgba(15, 23, 42, 0.58);
        font: 700 12px/1.5 Inter, ui-sans-serif, system-ui, sans-serif;
        text-align: center;
        overflow-wrap: anywhere;
      }
      @keyframes mas0ngStyleGradient {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      @keyframes mas0ngStyleSpin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.append(style);
  }

  function injectPendingStyles() {
    if (document.getElementById("mas0ng-style-pending-css")) return;
    const style = document.createElement("style");
    style.id = "mas0ng-style-pending-css";
    style.textContent = `
      html.mas0ng-style-pending body > *:not(#mas0ng-style-loader) {
        visibility: hidden !important;
      }
    `;
    document.head.append(style);
  }
})();
