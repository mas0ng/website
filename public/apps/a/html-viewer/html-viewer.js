(function () {
  const RENDER_BASE_MS = 700;
  const RENDER_PER_KB_MS = 45;
  const RENDER_MAX_MS = 5000;
  const REVEAL_MAX_MS = 900;
  const ESC_RESET_MS = 1800;
  const ESC_REQUIRED = 3;
  const MESSAGE_SOURCE = 'mas0ng-html-viewer';

  const CONSOLE_HOOK = `<script data-html-viewer-hook>
(function () {
  const SOURCE = ${JSON.stringify(MESSAGE_SOURCE)};
  let readySent = false;
  const post = (payload) => {
    try { parent.postMessage(Object.assign({ source: SOURCE }, payload), '*'); } catch (_) {}
  };
  const signalReady = (payload) => {
    if (readySent) return;
    readySent = true;
    post(payload);
  };
  ['log', 'info', 'warn', 'error'].forEach((level) => {
    const original = console[level];
    console[level] = function () {
      const message = Array.from(arguments).map((value) => {
        if (value instanceof Error) return value.stack || value.message;
        if (typeof value === 'object') {
          try { return JSON.stringify(value); } catch (_) { return String(value); }
        }
        return String(value);
      }).join(' ');
      post({ kind: 'console', level: level, message: message, time: Date.now() });
      if (typeof original === 'function') original.apply(console, arguments);
    };
  });
  window.addEventListener('error', (event) => {
    const message = event.message || 'Script error';
    const detail = event.filename ? event.filename + ':' + event.lineno + ':' + event.colno : '';
    post({ kind: 'runtime-error', level: 'error', message: message, detail: detail, fatal: true, time: Date.now() });
    signalReady({ kind: 'ready', level: 'error', message: message, detail: detail, fatal: true, time: Date.now() });
  });
  window.addEventListener('unhandledrejection', (event) => {
    const detail = String(event.reason);
    post({ kind: 'runtime-error', level: 'error', message: 'Unhandled promise rejection', detail: detail, fatal: true, time: Date.now() });
    signalReady({ kind: 'ready', level: 'error', message: 'Unhandled promise rejection', detail: detail, fatal: true, time: Date.now() });
  });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      signalReady({ kind: 'ready', level: 'info', message: 'Preview frame ready.', fatal: false, time: Date.now() });
    });
  } else {
    signalReady({ kind: 'ready', level: 'info', message: 'Preview frame ready.', fatal: false, time: Date.now() });
  }
})();
<\/script>`;

  const els = {
    mobile: document.getElementById('html-viewer-mobile'),
    workspace: document.getElementById('html-viewer-workspace'),
    tabs: document.getElementById('html-viewer-tabs'),
    panePaste: document.getElementById('html-pane-paste'),
    paneUpload: document.getElementById('html-pane-upload'),
    paste: document.getElementById('html-paste'),
    uploadBtn: document.getElementById('html-upload-btn'),
    fileInput: document.getElementById('html-file'),
    fileName: document.getElementById('html-file-name'),
    previewBtn: document.getElementById('html-preview'),
    clearBtn: document.getElementById('html-clear'),
    status: document.getElementById('html-status'),
    consolePanel: document.getElementById('html-console-panel'),
    consoleLead: document.getElementById('html-console-lead'),
    console: document.getElementById('html-console'),
    overlay: document.getElementById('html-viewer-overlay'),
    progressBar: document.getElementById('html-viewer-progress-bar'),
    progressLabel: document.getElementById('html-viewer-progress-label'),
    frame: document.getElementById('html-viewer-frame'),
    notice: document.getElementById('html-viewer-notice'),
    noticeTitle: document.getElementById('html-viewer-notice-title'),
    noticeText: document.getElementById('html-viewer-notice-text'),
    toast: document.getElementById('html-viewer-toast')
  };

  let activeMode = 'paste';
  let uploadedHtml = '';
  let uploadedName = '';
  let previewOpen = false;
  let escCount = 0;
  let escTimer = 0;
  let toastTimer = 0;
  let capturedLogs = [];
  let renderSession = 0;
  let progressFrame = 0;
  let progressValue = 0;
  let revealTimer = 0;
  let frameObjectUrl = '';
  let previewHasErrors = false;
  let previewFatal = false;
  let previewErrorMessage = '';

  if (!els.workspace || !els.overlay || !els.frame) {
    console.error('HTML viewer failed to initialise.');
    return;
  }

  const page = document.querySelector('.html-viewer-page');
  const isDesktop = !window.matchMedia('(max-width: 733px)').matches;

  boot();

  function applyDeviceMode() {
    if (!page) return;
    page.classList.toggle('is-desktop', isDesktop);
    page.classList.toggle('is-mobile', !isDesktop);
    if (els.mobile) els.mobile.hidden = isDesktop;
    if (els.workspace) els.workspace.hidden = !isDesktop;
  }

  function boot() {
    applyDeviceMode();
    if (!isDesktop) return;
    bindEvents();
    window.addEventListener('message', onFrameMessage);
    document.addEventListener('keydown', onKeyDown);
  }

  function bindEvents() {
    els.tabs?.querySelectorAll('.html-viewer-tab').forEach((button) => {
      button.addEventListener('click', () => selectMode(button.dataset.mode, button));
    });
    els.uploadBtn?.addEventListener('click', () => els.fileInput?.click());
    els.fileInput?.addEventListener('change', onFileSelected);
    els.previewBtn?.addEventListener('click', startPreview);
    els.clearBtn?.addEventListener('click', clearAll);
  }

  function selectMode(mode, button) {
    if (!mode || mode === activeMode) return;
    activeMode = mode;
    els.tabs.querySelectorAll('.html-viewer-tab').forEach((item) => {
      const active = item === button || item.dataset.mode === mode;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    const pasteActive = mode === 'paste';
    els.panePaste.classList.toggle('is-active', pasteActive);
    els.panePaste.hidden = !pasteActive;
    els.paneUpload.classList.toggle('is-active', !pasteActive);
    els.paneUpload.hidden = pasteActive;
    setStatus('');
  }

  async function onFileSelected() {
    const file = els.fileInput?.files?.[0];
    if (!file) return;
    try {
      uploadedHtml = await file.text();
      uploadedName = file.name;
      if (els.fileName) els.fileName.textContent = file.name;
      setStatus(`Loaded ${file.name}.`);
    } catch {
      uploadedHtml = '';
      uploadedName = '';
      if (els.fileName) els.fileName.textContent = 'No file selected';
      setStatus('Could not read that file.', true);
    }
  }

  function currentHtml() {
    if (activeMode === 'upload') return uploadedHtml.trim();
    return String(els.paste?.value || '').trim();
  }

  function estimateRenderMs(html) {
    const kb = html.length / 1024;
    return Math.min(RENDER_MAX_MS, Math.max(RENDER_BASE_MS, Math.round(RENDER_BASE_MS + kb * RENDER_PER_KB_MS)));
  }

  function prepareHtml(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (/<head[\s>]/i.test(trimmed)) {
      return trimmed.replace(/<head([^>]*)>/i, `<head$1>${CONSOLE_HOOK}`);
    }
    if (/<html[\s>]/i.test(trimmed)) {
      return trimmed.replace(/<html([^>]*)>/i, `<html$1><head>${CONSOLE_HOOK}</head>`);
    }
    if (/<body[\s>]/i.test(trimmed)) {
      return `<!DOCTYPE html><html lang="en"><head>${CONSOLE_HOOK}</head>${trimmed}</html>`;
    }
    return `<!DOCTYPE html><html lang="en"><head>${CONSOLE_HOOK}</head><body>${trimmed}</body></html>`;
  }

  function setProgress(value, label) {
    progressValue = Math.min(100, Math.max(0, value));
    if (els.progressBar) els.progressBar.style.width = `${progressValue}%`;
    if (els.progressLabel && label) els.progressLabel.textContent = label;
  }

  function stopProgressLoop() {
    if (progressFrame) {
      cancelAnimationFrame(progressFrame);
      progressFrame = 0;
    }
  }

  function startProgressLoop(session, estimateMs, startedAt) {
    stopProgressLoop();
    setProgress(0, 'Preparing preview…');
    const tick = (now) => {
      if (session !== renderSession) return;
      const elapsed = now - startedAt;
      const target = Math.min(96, (elapsed / estimateMs) * 100);
      const label = target < 28 ? 'Preparing preview…' : target < 62 ? 'Building document…' : 'Loading preview…';
      if (target > progressValue) setProgress(target, label);
      if (target < 96) progressFrame = requestAnimationFrame(tick);
    };
    progressFrame = requestAnimationFrame(tick);
  }

  function clearTimers() {
    stopProgressLoop();
    window.clearTimeout(revealTimer);
    revealTimer = 0;
  }

  function clearFrame() {
    els.frame.removeAttribute('srcdoc');
    els.frame.removeAttribute('src');
    if (frameObjectUrl) {
      URL.revokeObjectURL(frameObjectUrl);
      frameObjectUrl = '';
    }
  }

  function loadFrameContent(html) {
    clearFrame();
    els.frame.srcdoc = html;
  }

  function hidePreviewNotice() {
    if (!els.notice) return;
    els.notice.hidden = true;
    els.notice.classList.remove('html-viewer-notice--warn');
    if (els.noticeText) els.noticeText.textContent = '';
  }

  function showPreviewNotice(fatal, message) {
    if (!els.notice || !els.noticeTitle || !els.noticeText) return;
    previewHasErrors = true;
    if (fatal) previewFatal = true;
    const summary = message || previewErrorMessage || 'Something went wrong while running your HTML.';
    els.notice.classList.toggle('html-viewer-notice--warn', !fatal);
    els.noticeTitle.textContent = fatal ? 'Fatal error in your HTML' : 'Preview loaded with errors';
    els.noticeText.textContent = fatal
      ? `${summary} The preview is still shown below, but part of the page may be missing or broken. Press Esc 3 times to close preview and read the full console output.`
      : `${summary} Press Esc 3 times to close preview and read the full console output.`;
    els.notice.hidden = false;
  }

  function finishPreview(session, options = {}) {
    if (session !== renderSession) return;

    const {
      label = 'Preview ready',
      fatal = false,
      message = '',
      showNotice = false
    } = options;

    clearTimers();

    if (fatal) {
      previewFatal = true;
      previewHasErrors = true;
      if (message) previewErrorMessage = message;
    } else if (message) {
      previewHasErrors = true;
      previewErrorMessage = message;
    }

    setProgress(100, label);
    els.overlay.classList.remove('is-rendering');
    els.overlay.classList.add('is-previewing');

    if (showNotice || fatal || previewHasErrors) {
      showPreviewNotice(fatal || previewFatal, previewErrorMessage || message);
    }
  }

  function scheduleReveal(session, estimateMs) {
    clearTimers();
    const revealDelay = Math.min(REVEAL_MAX_MS, Math.max(320, Math.round(estimateMs * 0.35)));
    revealTimer = window.setTimeout(() => {
      if (session !== renderSession) return;
      finishPreview(session, {
        label: previewHasErrors ? 'Preview loaded with errors' : 'Showing preview',
        showNotice: previewHasErrors
      });
    }, revealDelay);
  }

  function startPreview() {
    if (!isDesktop) return;

    const raw = currentHtml();
    if (!raw) {
      setStatus(activeMode === 'upload' ? 'Upload an HTML file first.' : 'Paste some HTML first.', true);
      return;
    }

    let prepared = '';
    try {
      prepared = prepareHtml(raw);
    } catch (error) {
      setStatus(error?.message || 'Could not prepare that HTML.', true);
      return;
    }

    if (!prepared) {
      setStatus('Could not prepare that HTML.', true);
      return;
    }

    const session = ++renderSession;
    clearFrame();
    hidePreviewNotice();
    hideToast();

    capturedLogs = [];
    previewHasErrors = false;
    previewFatal = false;
    previewErrorMessage = '';
    escCount = 0;

    const estimateMs = estimateRenderMs(prepared);
    const startedAt = performance.now();

    previewOpen = true;
    document.body.classList.add('html-viewer-lock');
    els.overlay.hidden = false;
    els.overlay.classList.add('is-open', 'is-rendering');
    els.overlay.classList.remove('is-previewing');
    startProgressLoop(session, estimateMs, startedAt);
    scheduleReveal(session, estimateMs);

    const onFrameLoad = () => {
      if (session !== renderSession) return;
      finishPreview(session, {
        label: previewHasErrors ? 'Preview loaded with errors' : 'Preview ready',
        showNotice: previewHasErrors
      });
    };

    els.frame.addEventListener('load', onFrameLoad, { once: true });

    try {
      setProgress(Math.max(progressValue, 36), 'Injecting HTML…');
      loadFrameContent(prepared);
    } catch (error) {
      previewFatal = true;
      previewErrorMessage = error?.message || 'The browser could not load this HTML.';
      finishPreview(session, {
        fatal: true,
        message: previewErrorMessage,
        label: 'Could not load preview',
        showNotice: true
      });
    }
  }

  function onFrameMessage(event) {
    if (!previewOpen) return;
    if (!event.data || event.data.source !== MESSAGE_SOURCE) return;

    const entry = {
      level: event.data.level || 'log',
      message: event.data.message || '',
      detail: event.data.detail || '',
      kind: event.data.kind || 'console',
      fatal: Boolean(event.data.fatal),
      time: event.data.time || Date.now()
    };

    capturedLogs.push(entry);

    if (entry.kind === 'runtime-error' || entry.level === 'error') {
      previewHasErrors = true;
      if (entry.fatal) previewFatal = true;
      if (entry.message) {
        previewErrorMessage = entry.detail ? `${entry.message} (${entry.detail})` : entry.message;
      }
    }

    if (entry.kind === 'ready') {
      finishPreview(renderSession, {
        label: entry.fatal ? 'Preview loaded with errors' : 'Preview ready',
        fatal: entry.fatal,
        message: entry.fatal ? previewErrorMessage : '',
        showNotice: entry.fatal
      });
      return;
    }

    if (els.overlay.classList.contains('is-previewing') && (entry.kind === 'runtime-error' || entry.fatal)) {
      showPreviewNotice(true, previewErrorMessage);
    }
  }

  function onKeyDown(event) {
    if (!previewOpen || event.key !== 'Escape') return;
    event.preventDefault();
    escCount += 1;
    if (escCount === 1) showToast('Press Esc 3 times to close preview');
    else if (escCount === 2) showToast('Press Esc one more time to close preview');
    else if (escCount >= ESC_REQUIRED) closePreview();
    window.clearTimeout(escTimer);
    escTimer = window.setTimeout(() => {
      escCount = 0;
      hideToast();
    }, ESC_RESET_MS);
  }

  function closePreview() {
    renderSession += 1;
    clearTimers();
    previewOpen = false;
    escCount = 0;
    hideToast();
    hidePreviewNotice();
    clearFrame();

    els.overlay.classList.remove('is-open', 'is-rendering', 'is-previewing');
    els.overlay.hidden = true;
    setProgress(0, 'Preparing preview…');
    document.body.classList.remove('html-viewer-lock');

    renderConsole();
    els.consolePanel.hidden = false;
    els.consolePanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function renderConsole() {
    if (!els.console) return;
    const errors = capturedLogs.filter((entry) => entry.level === 'error');
    const lead = previewFatal
      ? `Fatal error during preview. ${errors.length} error${errors.length === 1 ? '' : 's'} captured — details below.`
      : errors.length
        ? `${errors.length} error${errors.length === 1 ? '' : 's'} captured from the preview.`
        : 'No errors captured from the preview.';
    if (els.consoleLead) els.consoleLead.textContent = lead;

    if (!capturedLogs.length) {
      els.console.innerHTML = '<p class="html-viewer-console__empty">No console output was recorded.</p>';
      return;
    }

    els.console.innerHTML = capturedLogs.map((entry) => {
      const level = entry.level || 'log';
      const detail = entry.detail ? `<span class="html-viewer-console__detail"> — ${escapeHtml(entry.detail)}</span>` : '';
      return `<div class="html-viewer-console__line html-viewer-console__line--${level}">[${level}] ${escapeHtml(entry.message)}${detail}</div>`;
    }).join('');
  }

  function clearAll() {
    if (els.paste) els.paste.value = '';
    uploadedHtml = '';
    uploadedName = '';
    if (els.fileInput) els.fileInput.value = '';
    if (els.fileName) els.fileName.textContent = 'No file selected';
    capturedLogs = [];
    previewHasErrors = false;
    previewFatal = false;
    previewErrorMessage = '';
    if (els.console) els.console.innerHTML = '';
    els.consolePanel.hidden = true;
    hidePreviewNotice();
    setStatus('');
  }

  function showToast(message) {
    if (!els.toast) return;
    window.clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.hidden = false;
    toastTimer = window.setTimeout(() => {
      if (escCount < ESC_REQUIRED) hideToast();
    }, 2600);
  }

  function hideToast() {
    if (!els.toast) return;
    els.toast.hidden = true;
    els.toast.textContent = '';
  }

  function setStatus(message, isError = false) {
    if (!els.status) return;
    els.status.textContent = message;
    els.status.hidden = !message;
    els.status.classList.toggle('is-error', isError);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();