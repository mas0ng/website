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
              200: "#bfdbfe",
              500: "#1688d8",
              600: "#174ea6",
              700: "#1e40af",
              900: "#073b84"
            },
            accent: {
              50: "#ecfdf5",
              100: "#d1fae5",
              500: "#10b981",
              600: "#059669"
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
      overlay.innerHTML = '<div class="mas0ng-style-loader-card"><div class="mas0ng-style-loader-spinner"></div><div class="mas0ng-style-loader-lines"><span></span><span></span></div></div><p class="mas0ng-style-loader-status" data-style-loader-status>' + escapeHtml(currentAsset) + '</p>';
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
    if (path === "/" && new URLSearchParams(window.location.search).get("from") === "index") return true;
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
        background: rgba(2, 6, 23, 0.28);
        backdrop-filter: blur(10px);
        opacity: 1;
        transition: opacity 260ms ease;
        pointer-events: none;
      }
      #mas0ng-style-loader[data-done="true"] { opacity: 0; }
      .mas0ng-style-loader-card {
        min-width: 210px;
        display: flex;
        align-items: center;
        gap: 14px;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 18px;
        background: rgba(8, 17, 31, .92);
        padding: 16px 18px;
        box-shadow: 0 24px 60px rgba(2,6,23,.30);
      }
      .mas0ng-style-loader-spinner {
        width: 34px;
        height: 34px;
        border-radius: 999px;
        border: 3px solid rgba(147, 197, 253, 0.22);
        border-top-color: #38bdf8;
        animation: mas0ngStyleSpin 760ms linear infinite;
      }
      .mas0ng-style-loader-lines {
        width: 120px;
        display: grid;
        gap: 8px;
      }
      .mas0ng-style-loader-lines span {
        height: 10px;
        display: block;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(255,255,255,.10);
      }
      .mas0ng-style-loader-lines span:last-child { width: 72%; }
      .mas0ng-style-loader-status {
        position: fixed;
        left: 16px;
        right: 16px;
        bottom: 24px;
        margin: 0;
        color: rgba(226, 232, 240, 0.72);
        font: 700 12px/1.5 Inter, ui-sans-serif, system-ui, sans-serif;
        text-align: center;
        overflow-wrap: anywhere;
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
      html.mas0ng-style-pending body { cursor: progress; }
    `;
    document.head.append(style);
  }
})();
