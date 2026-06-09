(function () {
  const STORAGE_KEY = 'mas0ng:timer:state';
  const TICK_MS = 16;

  const els = {
    setup: document.getElementById('timer-setup'),
    app: document.getElementById('timer-app'),
    stage: document.getElementById('timer-stage'),
    modeBadge: document.getElementById('timer-mode-badge'),
    status: document.getElementById('timer-status'),
    modeStopwatch: document.getElementById('timer-mode-stopwatch'),
    modeCountdown: document.getElementById('timer-mode-countdown'),
    displayH: document.getElementById('timer-h'),
    displayM: document.getElementById('timer-m'),
    displayS: document.getElementById('timer-s'),
    displayMs: document.getElementById('timer-ms'),
    countdownSetup: document.getElementById('timer-countdown-setup'),
    cdH: document.getElementById('timer-cd-h'),
    cdM: document.getElementById('timer-cd-m'),
    cdS: document.getElementById('timer-cd-s'),
    cdMs: document.getElementById('timer-cd-ms'),
    progress: document.getElementById('timer-progress'),
    progressBar: document.getElementById('timer-progress-bar'),
    progressLabel: document.getElementById('timer-progress-label'),
    toggle: document.getElementById('timer-toggle'),
    reset: document.getElementById('timer-reset')
  };

  let state = createDefaultState();
  let tickTimer = 0;
  let configured = false;

  boot();

  function createDefaultState() {
    return {
      mode: 'stopwatch',
      theme: 'slate',
      running: false,
      stopwatchTotalMs: 0,
      stopwatchRunningSince: null,
      countdownTargetMs: 5 * 60 * 1000,
      countdownStartedAt: null,
      countdownRemainingMs: null,
      countdownFinished: false,
      durationHours: 0,
      durationMinutes: 5,
      durationSeconds: 0,
      durationMilliseconds: 0
    };
  }

  function boot() {
    state = { ...createDefaultState(), ...loadState() };
    configured = Boolean(loadState());
    applyTheme(state.theme);
    bindEvents();

    if (!configured) {
      showSetup();
      return;
    }

    showApp();
    syncModeUi();
    syncDurationInputs();
    syncToggleLabel();
    updateDisplay();
    if (state.running) startTicking();
  }

  function bindEvents() {
    els.setup?.querySelectorAll('[data-mode]').forEach((button) => {
      button.addEventListener('click', () => chooseInitialMode(button.dataset.mode));
    });

    els.modeStopwatch?.addEventListener('click', () => setMode('stopwatch'));
    els.modeCountdown?.addEventListener('click', () => setMode('countdown'));

    document.querySelectorAll('.timer-theme-option').forEach((button) => {
      button.addEventListener('click', () => setTheme(button.dataset.theme, button));
    });

    [els.cdH, els.cdM, els.cdS, els.cdMs].forEach((input) => {
      input?.addEventListener('change', onDurationChange);
      input?.addEventListener('input', onDurationChange);
    });

    els.toggle?.addEventListener('click', toggleRunning);
    els.reset?.addEventListener('click', resetTimer);

    window.addEventListener('pagehide', persistState);
  }

  function chooseInitialMode(mode) {
    if (mode !== 'stopwatch' && mode !== 'countdown') return;
    state.mode = mode;
    configured = true;
    showApp();
    syncModeUi();
    syncDurationInputs();
    syncToggleLabel();
    updateDisplay();
    persistState();
  }

  function showSetup() {
    document.getElementById('timer-page')?.classList.add('timer-page--setup');
    if (els.setup) els.setup.hidden = false;
    if (els.app) els.app.hidden = true;
  }

  function showApp() {
    document.getElementById('timer-page')?.classList.remove('timer-page--setup');
    if (els.setup) els.setup.hidden = true;
    if (els.app) els.app.hidden = false;
  }

  function setMode(mode) {
    if (mode === state.mode) return;
    pause();
    state.mode = mode;
    state.countdownFinished = false;
    syncModeUi();
    syncDurationInputs();
    syncToggleLabel();
    updateDisplay();
    persistState();
  }

  function syncModeUi() {
    const stopwatchActive = state.mode === 'stopwatch';
    els.modeStopwatch?.classList.toggle('is-active', stopwatchActive);
    els.modeCountdown?.classList.toggle('is-active', !stopwatchActive);
    els.modeStopwatch?.setAttribute('aria-selected', stopwatchActive ? 'true' : 'false');
    els.modeCountdown?.setAttribute('aria-selected', stopwatchActive ? 'false' : 'true');

    if (els.countdownSetup) {
      const showDuration = state.mode === 'countdown' && !state.running && getCountdownRemainingMs() === state.countdownTargetMs;
      els.countdownSetup.hidden = !showDuration;
    }

    if (els.progress) {
      els.progress.hidden = state.mode !== 'countdown';
    }

    if (els.modeBadge) {
      els.modeBadge.textContent = stopwatchActive ? 'Stopwatch' : 'Countdown';
    }

    syncStatusUi();
  }

  function setTheme(theme, button) {
    if (!theme) return;
    state.theme = theme;
    applyTheme(theme);
    document.querySelectorAll('.timer-theme-option').forEach((item) => {
      const active = item === button || item.dataset.theme === theme;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-checked', active ? 'true' : 'false');
    });
    persistState();
  }

  function applyTheme(theme) {
    if (!els.stage) return;
    els.stage.className = `timer-stage theme-${theme || 'slate'}`;
  }

  function syncStatusUi() {
    if (!els.status) return;

    if (state.running) {
      els.status.textContent = 'Running';
      els.status.dataset.state = 'running';
      return;
    }

    if (state.mode === 'countdown' && state.countdownFinished) {
      els.status.textContent = 'Finished';
      els.status.dataset.state = 'finished';
      return;
    }

    const hasProgress = state.mode === 'stopwatch'
      ? state.stopwatchTotalMs > 0
      : getCountdownRemainingMs() < state.countdownTargetMs;

    if (hasProgress) {
      els.status.textContent = 'Paused';
      els.status.dataset.state = 'paused';
      return;
    }

    els.status.textContent = 'Ready';
    els.status.dataset.state = 'idle';
  }

  function onDurationChange() {
    state.durationHours = clampInt(els.cdH?.value, 0, 99);
    state.durationMinutes = clampInt(els.cdM?.value, 0, 59);
    state.durationSeconds = clampInt(els.cdS?.value, 0, 59);
    state.durationMilliseconds = clampInt(els.cdMs?.value, 0, 999);

    if (els.cdH) els.cdH.value = String(state.durationHours);
    if (els.cdM) els.cdM.value = String(state.durationMinutes);
    if (els.cdS) els.cdS.value = String(state.durationSeconds);
    if (els.cdMs) els.cdMs.value = String(state.durationMilliseconds);

    if (!state.running && !state.countdownRemainingMs) {
      state.countdownTargetMs = durationToMs(state);
      state.countdownFinished = false;
      updateDisplay();
    }

    persistState();
  }

  function syncDurationInputs() {
    if (!els.cdH) return;
    els.cdH.value = String(state.durationHours);
    els.cdM.value = String(state.durationMinutes);
    els.cdS.value = String(state.durationSeconds);
    els.cdMs.value = String(state.durationMilliseconds);
    syncModeUi();
  }

  function durationToMs(parts = state) {
    return (
      (parts.durationHours * 3600000) +
      (parts.durationMinutes * 60000) +
      (parts.durationSeconds * 1000) +
      parts.durationMilliseconds
    );
  }

  function getStopwatchElapsedMs() {
    if (!state.running || !state.stopwatchRunningSince) {
      return state.stopwatchTotalMs;
    }
    return state.stopwatchTotalMs + Math.max(0, Date.now() - state.stopwatchRunningSince);
  }

  function getCountdownRemainingMs() {
    if (state.countdownFinished) return 0;
    if (state.mode !== 'countdown') return state.countdownTargetMs;

    if (state.running && state.countdownStartedAt) {
      const elapsed = Date.now() - state.countdownStartedAt;
      return Math.max(0, state.countdownTargetMs - elapsed);
    }

    if (state.countdownRemainingMs != null) {
      return Math.max(0, state.countdownRemainingMs);
    }

    return state.countdownTargetMs;
  }

  function getDisplayMs() {
    if (state.mode === 'stopwatch') {
      return getStopwatchElapsedMs();
    }
    return getCountdownRemainingMs();
  }

  function formatParts(totalMs) {
    const safe = Math.max(0, Math.floor(totalMs));
    const hours = Math.floor(safe / 3600000);
    const minutes = Math.floor((safe % 3600000) / 60000);
    const seconds = Math.floor((safe % 60000) / 1000);
    const milliseconds = safe % 1000;
    return {
      hours,
      minutes,
      seconds,
      milliseconds
    };
  }

  function pad(value, size) {
    return String(value).padStart(size, '0');
  }

  function updateDisplay() {
    const ms = getDisplayMs();
    const parts = formatParts(ms);

    if (els.displayH) els.displayH.textContent = pad(parts.hours, 2);
    if (els.displayM) els.displayM.textContent = pad(parts.minutes, 2);
    if (els.displayS) els.displayS.textContent = pad(parts.seconds, 2);
    if (els.displayMs) els.displayMs.textContent = pad(parts.milliseconds, 3);

    if (state.mode === 'countdown') {
      const elapsed = Math.max(0, state.countdownTargetMs - ms);
      const ratio = state.countdownTargetMs > 0 ? Math.min(1, elapsed / state.countdownTargetMs) : 0;
      if (els.progressBar) els.progressBar.style.width = `${ratio * 100}%`;
      if (els.progressLabel) {
        els.progressLabel.textContent = state.countdownFinished
          ? 'Countdown finished'
          : `${Math.round(ratio * 100)}% elapsed`;
      }
    }

    if (state.mode === 'countdown' && state.running && ms <= 0) {
      finishCountdown();
    }
  }

  function finishCountdown() {
    state.running = false;
    state.countdownFinished = true;
    state.countdownRemainingMs = 0;
    state.countdownStartedAt = null;
    stopTicking();
    syncToggleLabel();
    syncModeUi();
    updateDisplay();
    persistState();
  }

  function toggleRunning() {
    if (state.running) {
      pause();
      return;
    }
    start();
  }

  function start() {
    if (state.mode === 'countdown') {
      if (state.countdownFinished || getCountdownRemainingMs() <= 0) {
        state.countdownTargetMs = durationToMs();
        state.countdownFinished = false;
        state.countdownRemainingMs = null;
      }

      if (state.countdownRemainingMs != null) {
        state.countdownStartedAt = Date.now() - (state.countdownTargetMs - state.countdownRemainingMs);
        state.countdownRemainingMs = null;
      } else {
        state.countdownTargetMs = durationToMs();
        state.countdownStartedAt = Date.now();
      }
    } else {
      state.stopwatchRunningSince = Date.now();
    }

    state.running = true;
    startTicking();
    syncToggleLabel();
    syncModeUi();
    updateDisplay();
    persistState();
  }

  function pause() {
    if (!state.running) return;

    if (state.mode === 'stopwatch') {
      if (state.stopwatchRunningSince) {
        state.stopwatchTotalMs += Math.max(0, Date.now() - state.stopwatchRunningSince);
        state.stopwatchRunningSince = null;
      }
    } else if (state.countdownStartedAt) {
      state.countdownRemainingMs = getCountdownRemainingMs();
      state.countdownStartedAt = null;
    }

    state.running = false;
    stopTicking();
    syncToggleLabel();
    syncModeUi();
    persistState();
  }

  function resetTimer() {
    pause();
    if (state.mode === 'stopwatch') {
      state.stopwatchTotalMs = 0;
      state.stopwatchRunningSince = null;
    } else {
      state.countdownTargetMs = durationToMs();
      state.countdownStartedAt = null;
      state.countdownRemainingMs = null;
      state.countdownFinished = false;
    }
    syncModeUi();
    updateDisplay();
    persistState();
  }

  function syncToggleLabel() {
    if (!els.toggle) return;
    if (state.running) {
      els.toggle.textContent = 'Pause';
      syncStatusUi();
      return;
    }
    if (state.mode === 'countdown' && getCountdownRemainingMs() < state.countdownTargetMs && getCountdownRemainingMs() > 0) {
      els.toggle.textContent = 'Resume';
      syncStatusUi();
      return;
    }
    if (state.mode === 'stopwatch' && state.stopwatchTotalMs > 0) {
      els.toggle.textContent = 'Resume';
      syncStatusUi();
      return;
    }
    els.toggle.textContent = 'Start';
    syncStatusUi();
  }

  function startTicking() {
    stopTicking();
    tickTimer = window.setInterval(updateDisplay, TICK_MS);
  }

  function stopTicking() {
    window.clearInterval(tickTimer);
    tickTimer = 0;
  }

  function persistState() {
    const snapshot = {
      mode: state.mode,
      theme: state.theme,
      running: state.running,
      stopwatchTotalMs: state.stopwatchTotalMs,
      stopwatchRunningSince: state.stopwatchRunningSince,
      countdownTargetMs: state.countdownTargetMs,
      countdownStartedAt: state.countdownStartedAt,
      countdownRemainingMs: state.countdownRemainingMs,
      countdownFinished: state.countdownFinished,
      durationHours: state.durationHours,
      durationMinutes: state.durationMinutes,
      durationSeconds: state.durationSeconds,
      durationMilliseconds: state.durationMilliseconds
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      return undefined;
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }

  function clampInt(value, min, max) {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    if (Number.isNaN(parsed)) return min;
    return Math.min(max, Math.max(min, parsed));
  }
})();