(function () {
  const TYPES = {
    url: {
      label: 'Link',
      fields: [
        { id: 'url', label: 'Website URL', type: 'url', placeholder: 'https://mas0ng.com', inputmode: 'url', autocomplete: 'url' }
      ]
    },
    text: {
      label: 'Text',
      fields: [
        { id: 'text', label: 'Plain text', type: 'textarea', placeholder: 'Write any message or note…' }
      ]
    },
    email: {
      label: 'Email',
      fields: [
        { id: 'address', label: 'Email address', type: 'email', placeholder: 'hello@example.com', inputmode: 'email', autocomplete: 'email' },
        { id: 'subject', label: 'Subject (optional)', type: 'text', placeholder: 'Subject line' },
        { id: 'body', label: 'Message (optional)', type: 'textarea', placeholder: 'Email body' }
      ]
    },
    phone: {
      label: 'Phone',
      fields: [
        { id: 'number', label: 'Phone number', type: 'tel', placeholder: '+44 7700 900123', inputmode: 'tel', autocomplete: 'tel' }
      ]
    },
    wifi: {
      label: 'Wi‑Fi',
      fields: [
        { id: 'ssid', label: 'Network name (SSID)', type: 'text', placeholder: 'Home Wi‑Fi' },
        { id: 'password', label: 'Password', type: 'text', placeholder: 'Network password' },
        { id: 'security', label: 'Security', type: 'select', options: [
          { value: 'WPA', label: 'WPA / WPA2 / WPA3' },
          { value: 'WEP', label: 'WEP' },
          { value: 'nopass', label: 'None (open)' }
        ] },
        { id: 'hidden', label: 'Hidden network', type: 'checkbox' }
      ]
    }
  };

  const SIZE_MIN = 180;
  const SIZE_MAX = 720;
  const PREVIEW_MAX = 280;

  const els = {
    typePicker: document.getElementById('qr-type-picker'),
    fields: document.getElementById('qr-fields'),
    preview: document.getElementById('qr-preview'),
    previewEmpty: document.getElementById('qr-preview-empty'),
    previewFrame: document.getElementById('qr-preview-frame'),
    canvas: document.getElementById('qr-canvas'),
    payloadLine: document.getElementById('qr-payload'),
    sizePicker: document.getElementById('qr-size-picker'),
    sizeCustomWrap: document.getElementById('qr-size-custom-wrap'),
    size: document.getElementById('qr-size'),
    sizeReadout: document.getElementById('qr-size-readout'),
    ecc: document.getElementById('qr-ecc'),
    fg: document.getElementById('qr-fg'),
    bg: document.getElementById('qr-bg'),
    copyButton: document.getElementById('qr-copy'),
    saveButton: document.getElementById('qr-save'),
    status: document.getElementById('qr-status')
  };

  let activeType = 'url';
  let activeSize = '320';
  let lastCustomSize = 400;
  let currentPayload = '';
  let renderTimer = 0;
  let statusTimer = 0;
  let rendering = false;

  const exportCanvas = document.createElement('canvas');

  if (!els.typePicker || !els.fields || !els.canvas || !window.QRCode) {
    console.error('QR generator failed to initialise.');
    return;
  }

  bindEvents();
  renderFields(activeType);
  syncCustomSizeVisibility();
  updateSizeReadout();
  scheduleRender();

  function bindEvents() {
    els.typePicker.querySelectorAll('.qr-type').forEach((button) => {
      button.addEventListener('click', () => selectType(button.dataset.type, button));
    });

    els.sizePicker?.querySelectorAll('.qr-size').forEach((button) => {
      button.addEventListener('click', () => selectSize(button.dataset.size, button));
    });

    els.fields.addEventListener('input', scheduleRender);
    els.fields.addEventListener('change', scheduleRender);
    els.size?.addEventListener('input', () => {
      updateSizeReadout();
      scheduleRender();
    });
    els.size?.addEventListener('change', normalizeCustomSize);
    els.ecc?.addEventListener('change', scheduleRender);
    els.fg?.addEventListener('input', scheduleRender);
    els.bg?.addEventListener('input', scheduleRender);
    els.copyButton?.addEventListener('click', copyPayload);
    els.saveButton?.addEventListener('click', saveImage);
  }

  function selectType(type, button) {
    if (!TYPES[type] || type === activeType) return;
    activeType = type;

    els.typePicker.querySelectorAll('.qr-type').forEach((item) => {
      const active = item === button || item.dataset.type === type;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    renderFields(type);
    scheduleRender();
  }

  function selectSize(size, button) {
    if (!size || size === activeSize) return;
    const previousSize = activeSize;
    activeSize = size;

    els.sizePicker.querySelectorAll('.qr-size').forEach((item) => {
      const active = item === button || item.dataset.size === size;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-checked', active ? 'true' : 'false');
    });

    syncCustomSizeVisibility();

    if (size === 'custom' && els.size) {
      const preset = Number(previousSize);
      if (Number.isFinite(preset) && preset >= SIZE_MIN && preset <= SIZE_MAX) {
        els.size.value = String(preset);
        lastCustomSize = preset;
      }
    }

    updateSizeReadout();
    scheduleRender();
  }

  function syncCustomSizeVisibility() {
    if (!els.sizeCustomWrap) return;
    els.sizeCustomWrap.classList.toggle('is-visible', activeSize === 'custom');
  }

  function normalizeCustomSize() {
    if (!els.size) return;

    const parsed = Number(els.size.value);
    const normalized = Number.isFinite(parsed) ? clampSize(parsed) : lastCustomSize;
    els.size.value = String(normalized);
    lastCustomSize = normalized;

    updateSizeReadout();
    scheduleRender();
  }

  function clampSize(value) {
    return Math.min(SIZE_MAX, Math.max(SIZE_MIN, Math.round(value)));
  }

  function customSizeValue() {
    const parsed = Number(els.size?.value);
    if (!Number.isFinite(parsed) || parsed < SIZE_MIN || parsed > SIZE_MAX) {
      return lastCustomSize;
    }

    lastCustomSize = Math.round(parsed);
    return lastCustomSize;
  }

  function outputSize() {
    if (activeSize === 'custom') {
      return customSizeValue();
    }

    return clampSize(Number(activeSize || 320));
  }

  function previewSize() {
    const previewWidth = els.preview?.clientWidth || PREVIEW_MAX;
    const framePadding = 72;
    const fit = previewWidth - framePadding;
    return Math.max(160, Math.min(PREVIEW_MAX, Math.round(fit)));
  }

  function qrOptions(size) {
    return {
      width: size,
      margin: 4,
      errorCorrectionLevel: els.ecc?.value || 'M',
      color: {
        dark: els.fg?.value || '#174ea6',
        light: els.bg?.value || '#ffffff'
      }
    };
  }

  async function drawCode(canvas, payload, size) {
    await window.QRCode.toCanvas(canvas, payload, qrOptions(size));
  }

  function updateSizeReadout() {
    if (!els.sizeReadout) return;
    const size = activeSize === 'custom' ? customSizeValue() : outputSize();
    els.sizeReadout.textContent = `${size} × ${size} px`;
  }

  function renderFields(type) {
    const config = TYPES[type];
    els.fields.innerHTML = config.fields.map((field) => {
      if (field.type === 'textarea') {
        return `
          <label class="qr-field">
            <span>${field.label}</span>
            <textarea id="qr-field-${field.id}" data-field="${field.id}" placeholder="${field.placeholder || ''}"></textarea>
          </label>
        `;
      }

      if (field.type === 'select') {
        return `
          <label class="qr-field">
            <span>${field.label}</span>
            <select id="qr-field-${field.id}" data-field="${field.id}">
              ${field.options.map((option) => `<option value="${option.value}">${option.label}</option>`).join('')}
            </select>
          </label>
        `;
      }

      if (field.type === 'checkbox') {
        return `
          <label class="qr-field qr-field--check">
            <input id="qr-field-${field.id}" data-field="${field.id}" type="checkbox" />
            <span>${field.label}</span>
          </label>
        `;
      }

      return `
        <label class="qr-field">
          <span>${field.label}</span>
          <input
            id="qr-field-${field.id}"
            data-field="${field.id}"
            type="${field.type}"
            placeholder="${field.placeholder || ''}"
            ${field.inputmode ? `inputmode="${field.inputmode}"` : ''}
            ${field.autocomplete ? `autocomplete="${field.autocomplete}"` : ''}
          />
        </label>
      `;
    }).join('');
  }

  function fieldValue(id) {
    const input = els.fields.querySelector(`[data-field="${id}"]`);
    if (!input) return '';
    if (input.type === 'checkbox') return input.checked;
    return String(input.value || '').trim();
  }

  function escapeWifi(value) {
    return String(value).replace(/([\\;,:"])/g, '\\$1');
  }

  function buildPayload() {
    switch (activeType) {
      case 'url': {
        let url = fieldValue('url');
        if (!url) return '';
        if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url)) {
          url = `https://${url}`;
        }
        return url;
      }
      case 'text':
        return fieldValue('text');
      case 'email': {
        const address = fieldValue('address');
        if (!address) return '';
        const subject = fieldValue('subject');
        const body = fieldValue('body');
        const params = new URLSearchParams();
        if (subject) params.set('subject', subject);
        if (body) params.set('body', body);
        const query = params.toString();
        return query ? `mailto:${address}?${query}` : `mailto:${address}`;
      }
      case 'phone': {
        const number = fieldValue('number').replace(/[^\d+]/g, '');
        return number ? `tel:${number}` : '';
      }
      case 'wifi': {
        const ssid = fieldValue('ssid');
        if (!ssid) return '';
        const password = fieldValue('password');
        const security = fieldValue('security') || 'WPA';
        const hidden = fieldValue('hidden') ? 'true' : 'false';
        if (security === 'nopass') {
          return `WIFI:T:nopass;S:${escapeWifi(ssid)};H:${hidden};;`;
        }
        return `WIFI:T:${security};S:${escapeWifi(ssid)};P:${escapeWifi(password)};H:${hidden};;`;
      }
      default:
        return '';
    }
  }

  function scheduleRender() {
    window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(renderCode, 120);
  }

  async function renderCode() {
    if (rendering) return;

    const payload = buildPayload();
    currentPayload = payload;
    updateSizeReadout();

    if (!payload) {
      els.preview.classList.remove('has-code');
      els.previewFrame.hidden = true;
      els.payloadLine.hidden = true;
      els.copyButton.disabled = true;
      els.saveButton.disabled = true;
      setStatus('');
      return;
    }

    rendering = true;

    try {
      await drawCode(els.canvas, payload, previewSize());

      els.preview.classList.add('has-code');
      els.previewFrame.hidden = false;
      els.payloadLine.hidden = false;
      els.payloadLine.innerHTML = `<strong>Encoded:</strong> ${escapeHtml(payload)}`;
      els.copyButton.disabled = false;
      els.saveButton.disabled = false;
      setStatus('');
    } catch (error) {
      els.preview.classList.remove('has-code');
      els.previewFrame.hidden = true;
      els.payloadLine.hidden = true;
      els.copyButton.disabled = true;
      els.saveButton.disabled = true;
      setStatus(error?.message || 'Could not generate that QR code.', true);
    } finally {
      rendering = false;
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setStatus(message, isError = false) {
    if (!els.status) return;
    window.clearTimeout(statusTimer);
    els.status.textContent = message;
    els.status.hidden = !message;
    els.status.classList.toggle('is-error', isError);
    if (message) {
      statusTimer = window.setTimeout(() => {
        els.status.hidden = true;
      }, 4200);
    }
  }

  async function copyPayload() {
    if (!currentPayload) return;

    try {
      await navigator.clipboard.writeText(currentPayload);
      setStatus('QR content copied.');
    } catch {
      setStatus('Could not copy to clipboard.', true);
    }
  }

  function shouldUseShareSheet() {
    const touchPrimary = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const mobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
    return touchPrimary || mobileUa;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function saveImage() {
    if (!currentPayload || !els.preview.classList.contains('has-code')) return;

    setStatus('Preparing image…');

    try {
      await drawCode(exportCanvas, currentPayload, outputSize());
    } catch {
      setStatus('Could not export the image.', true);
      return;
    }

    const blob = await new Promise((resolve) => {
      exportCanvas.toBlob(resolve, 'image/png', 0.95);
    });

    if (!blob) {
      setStatus('Could not export the image.', true);
      return;
    }

    const filename = 'qr-code.png';

    if (shouldUseShareSheet()) {
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'QR code' });
          setStatus('Shared successfully.');
          return;
        } catch (error) {
          if (error?.name === 'AbortError') return;
        }
      }
    }

    downloadBlob(blob, filename);
    setStatus('Image downloaded.');
  }
})();