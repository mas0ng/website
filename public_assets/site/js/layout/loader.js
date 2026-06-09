(function () {
  const SHOW_DELAY_MS = 0;
  const CRITICAL_CSS = `
html.is-loading { overflow: hidden; }
html.is-loading:not(.has-page-loader)::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(7, 17, 31, 0.82);
}
html.is-loading:not(.has-page-loader)::after {
  content: "";
  position: fixed;
  z-index: 1001;
  top: calc(50% - 23px);
  left: calc(50% - 23px);
  width: 46px;
  height: 46px;
  border-radius: 999px;
  border: 3px solid rgba(255, 255, 255, 0.34);
  border-top-color: #fff;
  animation: mas0ng-loader-spin 0.8s linear infinite;
}
.page-loader {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(7, 17, 31, 0.82);
  transition: opacity 0.35s ease, visibility 0.35s ease;
}
.page-loader.is-done {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}
.page-loader__center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
  width: min(300px, calc(100vw - 64px));
}
.page-loader__spinner {
  width: 46px;
  height: 46px;
  border-radius: 999px;
  border: 3px solid rgba(255, 255, 255, 0.34);
  border-top-color: #fff;
  animation: mas0ng-loader-spin 0.8s linear infinite;
}
.page-loader__track {
  width: 100%;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.34);
  overflow: hidden;
}
.page-loader__bar {
  width: 0%;
  height: 100%;
  border-radius: inherit;
  background: #fff;
  transition: width 0.22s ease;
}
.page-loader__status {
  position: fixed;
  left: 24px;
  right: 24px;
  bottom: 26px;
  margin: 0;
  font-size: 0.8rem;
  font-weight: 500;
  line-height: 1.5;
  text-align: center;
  color: rgba(255, 255, 255, 0.88);
  overflow-wrap: anywhere;
}
@keyframes mas0ng-loader-spin {
  to { transform: rotate(360deg); }
}`;

  if (window.location.hash) {
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }

  let overlay = null;
  let showTimer = null;
  let visible = false;
  let activeOps = 0;
  let primed = false;

  function injectCriticalCss() {
    if (document.getElementById('mas0ng-loader-critical')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'mas0ng-loader-critical';
    style.textContent = CRITICAL_CSS;
    (document.head || document.documentElement).append(style);
  }

  function shouldPrime() {
    if (document.documentElement.dataset.skipLoader !== undefined) {
      return false;
    }

    if (window.location.hash && window.location.hash.length > 1) {
      return false;
    }

    return true;
  }

  function mountOverlayNode(node) {
    const target = document.body || document.documentElement;
    target.append(node);

    if (!document.body) {
      document.addEventListener('DOMContentLoaded', () => {
        if (node.isConnected && document.body && node.parentElement !== document.body) {
          document.body.append(node);
        }
      }, { once: true });
    }
  }

  function ensureOverlay() {
    if (overlay) {
      return overlay;
    }

    overlay = document.createElement('div');
    overlay.className = 'page-loader';
    overlay.id = 'page-loader';
    overlay.setAttribute('aria-live', 'polite');
    overlay.setAttribute('aria-busy', 'true');
    overlay.innerHTML = `
      <div class="page-loader__center">
        <div class="page-loader__spinner" aria-hidden="true"></div>
        <div class="page-loader__track" aria-hidden="true">
          <div class="page-loader__bar" id="loader-bar"></div>
        </div>
      </div>
      <p class="page-loader__status" id="loader-status">Loading…</p>
    `;
    mountOverlayNode(overlay);
    document.documentElement.classList.add('has-page-loader');
    return overlay;
  }

  function formatStatus(detail) {
    if (!detail) return 'Loading…';
    if (/^https?:\/\//.test(detail)) return `Waiting on ${detail}`;
    return detail;
  }

  function setStatus(detail) {
    const status = overlay?.querySelector('#loader-status');
    if (status) status.textContent = formatStatus(detail);
  }

  function setProgress(ratio) {
    const bar = overlay?.querySelector('#loader-bar');
    if (!bar) return;
    bar.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
  }

  function show(immediate = true) {
    clearTimeout(showTimer);
    showTimer = null;
    if (visible) return;

    const reveal = () => {
      showTimer = null;
      if (visible) return;
      visible = true;
      injectCriticalCss();
      ensureOverlay();
      document.documentElement.classList.add('is-loading');
    };

    if (immediate || SHOW_DELAY_MS <= 0) {
      reveal();
      return;
    }

    showTimer = window.setTimeout(reveal, SHOW_DELAY_MS);
  }

  function hide(force = false) {
    clearTimeout(showTimer);
    showTimer = null;
    if (!force && activeOps > 0) return;

    if (!overlay || !visible) {
      document.documentElement.classList.remove('is-loading', 'has-page-loader');
      return;
    }

    overlay.classList.add('is-done');
    overlay.setAttribute('aria-busy', 'false');
    document.documentElement.classList.remove('is-loading', 'has-page-loader');
    window.setTimeout(() => {
      overlay?.remove();
      overlay = null;
      visible = false;
    }, 360);
  }

  function prime() {
    if (primed || !shouldPrime()) {
      return;
    }

    primed = true;
    injectCriticalCss();
    document.documentElement.classList.add('is-loading');
    show(true);
  }

  async function runTaskLoop(tasks, immediate = true) {
    activeOps += 1;
    const started = performance.now();
    show(immediate);

    let done = 0;
    const total = Math.max(1, tasks.length);

    try {
      for (const task of tasks) {
        setStatus(task.detail || task.label);
        await task.run();
        done += 1;
        if (visible) setProgress(done / total);
      }
    } finally {
      const elapsed = performance.now() - started;
      activeOps = Math.max(0, activeOps - 1);
      clearTimeout(showTimer);
      showTimer = null;
      if (visible || elapsed >= SHOW_DELAY_MS || immediate) {
        if (visible) setProgress(1);
        hide(true);
      }
    }
  }

  window.MAS0NG_LOADER = {
    setStatus,
    setProgress,
    show: () => show(true),
    hide: () => hide(true),
    prime,

    async run(tasks) {
      return runTaskLoop(tasks, true);
    },

    async runBoot(tasks) {
      return runTaskLoop(tasks, true);
    },

    async runWhile(message, task) {
      activeOps += 1;
      show(true);
      setStatus(message);
      setProgress(0.35);
      try {
        return await task();
      } finally {
        activeOps = Math.max(0, activeOps - 1);
        setProgress(1);
        hide(true);
      }
    },

    async runQuiet(tasks) {
      for (const task of tasks) {
        await task.run();
      }
    }
  };

  prime();
})();