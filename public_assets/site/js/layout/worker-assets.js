(function () {
  const TAILWIND_URL = 'https://cdn.tailwindcss.com';
  const LUCIDE_URL = 'https://unpkg.com/lucide@latest';
  const INTER_FONT_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';

  function hasScript(src) {
    return Boolean(document.querySelector(`script[src="${src}"]`));
  }

  function scriptIsReady(script, src) {
    if (!script) {
      return false;
    }

    if (script.dataset.loaded === 'true') {
      return true;
    }

    const readyState = script.readyState;
    if (readyState === 'complete' || readyState === 'loaded') {
      script.dataset.loaded = 'true';
      return true;
    }

    if (src.includes('lucide') && window.lucide?.createIcons) {
      script.dataset.loaded = 'true';
      return true;
    }

    if (src.includes('tailwindcss') && window.tailwind) {
      script.dataset.loaded = 'true';
      return true;
    }

    return false;
  }

  function loadScript(src) {
    if (hasScript(src)) {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (scriptIsReady(existing, src)) {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        const finish = () => {
          existing.dataset.loaded = 'true';
          resolve();
        };

        existing.addEventListener('load', finish, { once: true });
        existing.addEventListener('error', reject, { once: true });

        window.setTimeout(() => {
          if (scriptIsReady(existing, src)) {
            finish();
          }
        }, 0);
      });
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.addEventListener('load', () => {
        script.dataset.loaded = 'true';
        resolve();
      }, { once: true });
      script.addEventListener('error', reject, { once: true });
      document.head.append(script);
    });
  }

  function loadStylesheet(href) {
    if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.addEventListener('load', resolve, { once: true });
      link.addEventListener('error', reject, { once: true });
      document.head.append(link);
    });
  }

  function applyInterBody() {
    const apply = () => {
      if (!document.body) return;
      document.body.classList.add('font-sans');
      document.body.style.fontFamily = 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    };
    if (document.body) apply();
    else document.addEventListener('DOMContentLoaded', apply, { once: true });
  }

  async function boot(options = {}) {
    const loader = window.MAS0NG_LOADER;
    if (!loader) return;

    const useTailwind = options.tailwind !== false;
    const useLucide = options.lucide !== false;
    const useInterFont = options.interFont !== false;
    const tasks = [];

    if (useInterFont) {
      tasks.push({
        label: 'Inter font',
        detail: INTER_FONT_URL,
        run: async () => {
          if (!document.querySelector('link[rel="preconnect"][href="https://fonts.gstatic.com"]')) {
            const preconnect = document.createElement('link');
            preconnect.rel = 'preconnect';
            preconnect.href = 'https://fonts.gstatic.com';
            preconnect.crossOrigin = 'anonymous';
            document.head.append(preconnect);
          }
          await loadStylesheet(INTER_FONT_URL);
          applyInterBody();
        }
      });
    }

    if (useTailwind) {
      tasks.push({
        label: 'Tailwind CSS',
        detail: TAILWIND_URL,
        run: () => loadScript(TAILWIND_URL)
      });
    }

    if (useLucide) {
      tasks.push({
        label: 'Lucide icons',
        detail: LUCIDE_URL,
        run: () => loadScript(LUCIDE_URL)
      });
    }

    await loader.runBoot(tasks);

    if (useLucide && window.lucide?.createIcons) {
      window.lucide.createIcons();
      window.dispatchEvent(new CustomEvent('mas0ng:lucide-ready'));
    }
  }

  window.MAS0NG_WORKER_ASSETS = { boot };

  const script = document.currentScript;
  if (script?.hasAttribute('data-auto')) {
    window.mas0ngWorkerAssetsReady = boot({
      tailwind: !script.hasAttribute('data-no-tailwind'),
      lucide: !script.hasAttribute('data-no-lucide'),
      interFont: !script.hasAttribute('data-no-inter')
    });
    window.mas0ngLoadDesignLibraries = window.mas0ngWorkerAssetsReady;
  }
})();