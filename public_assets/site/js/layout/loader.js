(function () {
  const SHOW_DELAY_MS = 420;
  let overlay = null;
  let showTimer = null;
  let visible = false;
  let activeOps = 0;

  function ensureOverlay() {
    if (overlay) return overlay;

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
    document.body.append(overlay);
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

  function show(immediate = false) {
    clearTimeout(showTimer);
    showTimer = null;
    if (visible) return;

    const reveal = () => {
      showTimer = null;
      if (visible) return;
      visible = true;
      ensureOverlay();
      document.documentElement.classList.add('is-loading');
    };

    if (immediate) {
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
      document.documentElement.classList.remove('is-loading');
      return;
    }

    overlay.classList.add('is-done');
    overlay.setAttribute('aria-busy', 'false');
    document.documentElement.classList.remove('is-loading');
    window.setTimeout(() => {
      overlay?.remove();
      overlay = null;
      visible = false;
    }, 360);
  }

  async function runTaskLoop(tasks, immediate) {
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

    async run(tasks) {
      return runTaskLoop(tasks, false);
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
    }
  };
})();