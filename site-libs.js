(function () {
  const TAILWIND_URL = "https://cdn.tailwindcss.com";
  const LUCIDE_URL = "https://unpkg.com/lucide@latest";
  const FONT_URL = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap";
  let overlay = null;
  let useOverlay = false;
  let currentAsset = "";
  let loaderDone = false;
  let loaderTextTimer = null;

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
      overlay.setAttribute("role", "status");
      overlay.setAttribute("aria-live", "polite");
      overlay.innerHTML = '<div class="mas0ng-style-loader-stage"><div class="mas0ng-style-loader-mark" aria-hidden="true"><span></span><span></span><span></span></div><p class="mas0ng-style-loader-word" data-style-loader-word>Loading.</p></div>';
      document.body.append(overlay);
      injectOverlayStyles();
      startLoaderTextLoop();
    };

    if (document.body) mount();
    else document.addEventListener("DOMContentLoaded", mount, { once: true });
  }

  function hideLoadingOverlay() {
    document.documentElement.classList.remove("mas0ng-style-pending");
    loaderDone = true;
    stopLoaderTextLoop();
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

  function startLoaderTextLoop() {
    const word = overlay?.querySelector("[data-style-loader-word]");
    if (!word || loaderTextTimer) return;
    const states = ["Loading.", "Loading..", "Loading..."];
    let index = 0;
    word.textContent = states[index];
    loaderTextTimer = window.setInterval(() => {
      index = (index + 1) % states.length;
      word.textContent = states[index];
    }, 420);
  }

  function stopLoaderTextLoop() {
    if (!loaderTextTimer) return;
    window.clearInterval(loaderTextTimer);
    loaderTextTimer = null;
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
        overflow: hidden;
        background:
          linear-gradient(90deg, rgba(56, 189, 248, 0.08) 1px, transparent 1px),
          linear-gradient(180deg, rgba(56, 189, 248, 0.06) 1px, transparent 1px),
          radial-gradient(circle at 22% 24%, rgba(56, 189, 248, 0.18), transparent 360px),
          radial-gradient(circle at 78% 18%, rgba(34, 197, 94, 0.12), transparent 330px),
          linear-gradient(180deg, #07111f 0%, #0b1525 100%);
        background-size: 48px 48px, 48px 48px, auto, auto, auto;
        opacity: 1;
        transition: opacity 260ms ease;
        pointer-events: none;
      }
      #mas0ng-style-loader[data-done="true"] { opacity: 0; }
      .mas0ng-style-loader-stage {
        display: grid;
        place-items: center;
        gap: 22px;
        transform: translateY(-8px);
      }
      .mas0ng-style-loader-mark {
        width: 116px;
        height: 116px;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        align-items: end;
        gap: 8px;
        border: 1px solid rgba(255,255,255,.13);
        border-radius: 28px;
        background: rgba(8, 17, 31, .76);
        padding: 24px;
        box-shadow: 0 28px 80px rgba(2,6,23,.36), inset 0 1px 0 rgba(255,255,255,.08);
        animation: mas0ngStyleFloat 1800ms ease-in-out infinite;
        backdrop-filter: blur(18px);
      }
      .mas0ng-style-loader-mark span {
        display: block;
        border-radius: 999px;
        background: linear-gradient(180deg, #dbeafe 0%, #38bdf8 58%, #22c55e 100%);
        box-shadow: 0 0 26px rgba(56, 189, 248, .32);
        animation: mas0ngStyleBars 980ms ease-in-out infinite;
      }
      .mas0ng-style-loader-mark span:nth-child(1) { height: 34px; animation-delay: -180ms; }
      .mas0ng-style-loader-mark span:nth-child(2) { height: 62px; animation-delay: -60ms; }
      .mas0ng-style-loader-mark span:nth-child(3) { height: 46px; animation-delay: -300ms; }
      .mas0ng-style-loader-word {
        margin: 0;
        min-width: 126px;
        color: #f8fbff;
        font: 900 24px/1.1 Inter, ui-sans-serif, system-ui, sans-serif;
        letter-spacing: 0;
        text-align: center;
        text-shadow: 0 14px 38px rgba(2,6,23,.48);
      }
      @keyframes mas0ngStyleFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      @keyframes mas0ngStyleBars {
        0%, 100% { transform: scaleY(.72); opacity: .72; }
        50% { transform: scaleY(1.08); opacity: 1; }
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
