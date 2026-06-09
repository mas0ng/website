(function () {
  const STORAGE_KEY = 'mas0ng:timer:state';
  const TICK_MS = 16;

  const els = {
    setup: document.getElementById('timer-setup'),
    app: document.getElementById('timer-app'),
    stage: document.getElementById('timer-stage'),
    recover: document.getElementById('timer-recover'),
    recoverHint: document.getElementById('timer-recover-hint'),
    settingsToggle: document.getElementById('timer-settings-toggle'),
    settings: document.getElementById('timer-settings'),
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
    reset: document.getElementById('timer-reset'),
    fullscreen: document.getElementById('timer-fullscreen'),
    fullscreenLabel: document.getElementById('timer-fullscreen-label'),
    fullscreenIconEnter: document.querySelector('.timer-fs-btn__icon--enter'),
    fullscreenIconExit: document.querySelector('.timer-fs-btn__icon--exit')
  };

  let state = createDefaultState();
  let savedState = null;
  let tickTimer = 0;
  let settingsOpen = false;

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
    savedState = loadState();
    state = createDefaultState();
    bindEvents();
    showSetup();
  }

  function bindEvents() {
    els.setup?.querySelectorAll('.timer-setup__choice[data-mode]').forEach((button) => {
      button.addEventListener('click', () => chooseInitialMode(button.dataset.mode));
    });

    els.recover?.addEventListener('click', recoverSession);

    els.settingsToggle?.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleSettings();
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
    els.fullscreen?.addEventListener('click', toggleBrowserFullscreen);
    document.addEventListener('fullscreenchange', syncFullscreenUi);

    document.addEventListener('click', (event) => {
      if (!settingsOpen) return;
      const target = event.target;
      if (target instanceof Node && els.settings?.contains(target)) return;
      if (target instanceof Node && els.settingsToggle?.contains(target)) return;
      closeSettings();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && settingsOpen) {
        closeSettings();
      }
    });

    window.addEventListener('pagehide', persistState);
  }

  function chooseInitialMode(mode) {
    if (mode !== 'stopwatch' && mode !== 'countdown') return;
    state = {
      ...createDefaultState(),
      mode,
      theme: savedState?.theme || 'slate'
    };
    enterApp();
    persistState();
  }

  function recoverSession() {
    if (!savedState) return;
    state = { ...createDefaultState(), ...savedState };
    enterApp();
  }

  function enterApp() {
    closeSettings();
    showApp();
    applyTheme(state.theme);
    syncThemeUi();
    syncModeUi();
    syncDurationInputs();
    syncToggleLabel();
    updateDisplay();
    if (state.running) startTicking();
    persistState();
  }

  function showSetup() {
    const page = document.getElementById('timer-page');
    page?.classList.add('timer-page--setup');
    page?.classList.remove('timer-page--active');
    clearThemes();
    closeSettings();
    if (els.setup) els.setup.hidden = false;
    if (els.app) els.app.hidden = true;

    const canRecover = Boolean(savedState);
    if (els.recover) els.recover.hidden = !canRecover;

    if (els.recoverHint && canRecover) {
      const modeLabel = savedState.mode === 'countdown' ? 'Countdown' : 'Stopwatch';
      const statusLabel = savedState.running ? 'running' : 'saved';
      els.recoverHint.textContent = `Continue your ${modeLabel.toLowerCase()} session (${statusLabel})`;
    }
  }

  function showApp() {
    const page = document.getElementById('timer-page');
    page?.classList.remove('timer-page--setup');
    page?.classList.add('timer-page--active');
    if (els.setup) els.setup.hidden = true;
    if (els.app) els.app.hidden = false;
  }

  function toggleSettings() {
    if (settingsOpen) {
      closeSettings();
      return;
    }
    openSettings();
  }

  function openSettings() {
    settingsOpen = true;
    if (els.settings) els.settings.hidden = false;
    els.settingsToggle?.setAttribute('aria-expanded', 'true');
    els.settingsToggle?.setAttribute('aria-label', 'Close settings');
    els.stage?.classList.add('is-settings-open');
  }

  function closeSettings() {
    settingsOpen = false;
    if (els.settings) els.settings.hidden = true;
    els.settingsToggle?.setAttribute('aria-expanded', 'false');
    els.settingsToggle?.setAttribute('aria-label', 'Open settings');
    els.stage?.classList.remove('is-settings-open');
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

    syncProgressUi();

    if (els.modeBadge) {
      els.modeBadge.textContent = stopwatchActive ? 'Stopwatch' : 'Countdown';
    }

    syncStatusUi();
  }

  function syncProgressUi() {
    if (!els.progress) return;

    if (state.mode !== 'countdown') {
      els.progress.hidden = true;
      return;
    }

    const remaining = getCountdownRemainingMs();
    const hasStarted = state.running || remaining < state.countdownTargetMs || state.countdownFinished;
    els.progress.hidden = !hasStarted;
  }

  function setTheme(theme, button) {
    if (!theme) return;
    state.theme = theme;
    applyTheme(theme);
    syncThemeUi(button);
    persistState();
  }

  function syncThemeUi(activeButton) {
    document.querySelectorAll('.timer-theme-option').forEach((item) => {
      const active = item === activeButton || item.dataset.theme === state.theme;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-checked', active ? 'true' : 'false');
    });
  }

  function applyTheme(theme) {
    const nextTheme = `theme-${theme || 'slate'}`;
    const page = document.getElementById('timer-page');
    [els.stage, page].forEach((element) => {
      if (!element) return;
      [...element.classList].forEach((className) => {
        if (className.startsWith('theme-')) {
          element.classList.remove(className);
        }
      });
    });

    if (!els.stage) return;
    if (!els.stage.classList.contains('timer-stage')) {
      els.stage.classList.add('timer-stage');
    }
    els.stage.classList.add(nextTheme);
    page?.classList.add(nextTheme);
  }

  function clearThemes() {
    clearThemeFrom(document.getElementById('timer-page'));
    clearThemeFrom(els.stage);
  }

  function clearThemeFrom(element) {
    if (!element) return;
    [...element.classList].forEach((className) => {
      if (className.startsWith('theme-')) {
        element.classList.remove(className);
      }
    });
  }

  function isBrowserFullscreen() {
    return document.fullscreenElement === els.stage;
  }

  function toggleBrowserFullscreen() {
    if (!els.stage) return;

    if (isBrowserFullscreen()) {
      document.exitFullscreen?.().catch(() => undefined);
      return;
    }

    closeSettings();
    els.stage.requestFullscreen?.().catch(() => undefined);
  }

  function syncFullscreenUi() {
    const active = isBrowserFullscreen();

    if (els.fullscreen) {
      els.fullscreen.setAttribute('aria-label', active ? 'Exit browser fullscreen' : 'Enter browser fullscreen');
      els.fullscreen.title = active ? 'Exit fullscreen' : 'Browser fullscreen';
    }

    if (els.fullscreenLabel) {
      els.fullscreenLabel.textContent = active ? 'Exit' : 'Fullscreen';
    }

    if (els.fullscreenIconEnter) {
      els.fullscreenIconEnter.hidden = active;
    }

    if (els.fullscreenIconExit) {
      els.fullscreenIconExit.hidden = !active;
    }
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
    } else if (els.progressBar) {
      els.progressBar.style.width = '0%';
    }

    syncProgressUi();

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
    closeSettings();

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

    savedState = snapshot;

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