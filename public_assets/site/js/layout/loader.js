(function () {
  const SHOW_DELAY_MS = 420;
  let overlay = null;
  let showTimer = null;
  let visible = false;

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

  function setStatus(detail) {
    const status = overlay?.querySelector('#loader-status');
    if (status) status.textContent = detail ? `Waiting on ${detail}` : 'Loading…';
  }

  function setProgress(ratio) {
    const bar = overlay?.querySelector('#loader-bar');
    if (!bar) return;
    bar.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
  }

  function show() {
    if (visible) return;
    visible = true;
    ensureOverlay();
    document.documentElement.classList.add('is-loading');
  }

  function hide() {
    clearTimeout(showTimer);
    showTimer = null;
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

  window.MAS0NG_LOADER = {
    async run(tasks) {
      const started = performance.now();
      showTimer = window.setTimeout(show, SHOW_DELAY_MS);

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
        clearTimeout(showTimer);
        if (visible || elapsed >= SHOW_DELAY_MS) {
          if (visible) setProgress(1);
          hide();
        }
      }
    }
  };
})();