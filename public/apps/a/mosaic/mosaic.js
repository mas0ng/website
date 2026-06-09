(function () {
  const PREVIEW_BASE = '/public_assets/public_apps/mosaic/blur_previews/';

  const BLUR_TYPES = [
    { id: 'soft', label: 'Soft', preview: `${PREVIEW_BASE}soft.png` },
    { id: 'heavy', label: 'Heavy', preview: `${PREVIEW_BASE}heavy.png` },
    { id: 'pixel', label: 'Pixel', preview: `${PREVIEW_BASE}pixel.png` },
    { id: 'box', label: 'Box', preview: `${PREVIEW_BASE}box.png` },
    { id: 'motion', label: 'Motion', preview: `${PREVIEW_BASE}motion.png` },
    { id: 'radial', label: 'Radial', preview: `${PREVIEW_BASE}radial.png` },
    { id: 'frosted', label: 'Frosted', preview: `${PREVIEW_BASE}frosted.png` },
    { id: 'grain', label: 'Grain', preview: `${PREVIEW_BASE}grain.png` },
    { id: 'mono', label: 'Mono', preview: `${PREVIEW_BASE}mono.png` },
    { id: 'warm', label: 'Warm', preview: `${PREVIEW_BASE}warm.png` }
  ];

  const els = {
    fileInput: document.getElementById('mosaic-file'),
    openButton: document.getElementById('mosaic-open'),
    saveButton: document.getElementById('mosaic-save'),
    clearButton: document.getElementById('mosaic-clear'),
    blurPicker: document.getElementById('mosaic-blur-picker'),
    blurAmount: document.getElementById('mosaic-blur-amount'),
    brushSize: document.getElementById('mosaic-brush-size'),
    stage: document.getElementById('mosaic-stage'),
    empty: document.getElementById('mosaic-empty'),
    output: document.getElementById('mosaic-output'),
    status: document.getElementById('mosaic-status')
  };

  const sourceCanvas = document.createElement('canvas');
  const blurCanvas = document.createElement('canvas');
  const maskCanvas = document.createElement('canvas');
  const compositeCanvas = document.createElement('canvas');
  const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  const blurCtx = blurCanvas.getContext('2d');
  const maskCtx = maskCanvas.getContext('2d');
  const compositeCtx = compositeCanvas.getContext('2d');
  let outputCtx = null;

  let painting = false;
  let hasImage = false;
  let selectedBlur = 'soft';
  let lastPoint = null;
  let renderFrame = 0;
  let statusTimer = 0;

  if (!els.output || !els.empty || !els.stage) {
    console.error('Mosaic app markup is missing required elements.');
    return;
  }

  outputCtx = els.output.getContext('2d');
  if (!outputCtx) {
    console.error('Could not initialise the mosaic canvas.');
    return;
  }

  buildBlurPicker();
  bindEvents();

  function buildBlurPicker() {
    if (!els.blurPicker) return;

    els.blurPicker.innerHTML = BLUR_TYPES.map((type, index) => `
      <button
        class="mosaic-blur-option${index === 0 ? ' is-selected' : ''}"
        type="button"
        data-blur-id="${type.id}"
        aria-pressed="${index === 0 ? 'true' : 'false'}"
        aria-label="${type.label} blur"
      >
        <span class="mosaic-blur-option__thumb">
          <img src="${type.preview}" alt="" width="72" height="72" loading="lazy" decoding="async" data-preview-id="${type.id}" />
        </span>
        <span class="mosaic-blur-option__label">${type.label}</span>
      </button>
    `).join('');

    els.blurPicker.querySelectorAll('img[data-preview-id]').forEach((img) => {
      img.addEventListener('error', () => {
        img.replaceWith(createPreviewFallback(img.dataset.previewId));
      }, { once: true });
    });

    els.blurPicker.querySelectorAll('.mosaic-blur-option').forEach((button) => {
      button.addEventListener('click', () => selectBlurType(button.dataset.blurId, button));
    });
  }

  function createPreviewFallback(id) {
    const type = BLUR_TYPES.find((item) => item.id === id);
    const canvas = document.createElement('canvas');
    canvas.width = 72;
    canvas.height = 72;
    canvas.className = 'mosaic-blur-option__fallback';
    canvas.setAttribute('aria-hidden', 'true');

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 72, 72);
    const hues = {
      soft: ['#93c5fd', '#1d4ed8'],
      heavy: ['#64748b', '#0f172a'],
      pixel: ['#f472b6', '#7c3aed'],
      box: ['#6ee7b7', '#047857'],
      motion: ['#fcd34d', '#ea580c'],
      radial: ['#c4b5fd', '#5b21b6'],
      frosted: ['#e2e8f0', '#94a3b8'],
      grain: ['#fda4af', '#9f1239'],
      mono: ['#d4d4d8', '#52525b'],
      warm: ['#fdba74', '#c2410c']
    };
    const [a, b] = hues[id] || ['#cbd5e1', '#334155'];
    gradient.addColorStop(0, a);
    gradient.addColorStop(1, b);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 72, 72);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(10, 10, 52, 52);
    ctx.fillStyle = 'rgba(15,23,42,0.55)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((type?.label || id).slice(0, 6), 36, 40);
    return canvas;
  }

  function selectBlurType(id, button) {
    if (!id || id === selectedBlur) return;
    selectedBlur = id;

    els.blurPicker.querySelectorAll('.mosaic-blur-option').forEach((item) => {
      const active = item === button || item.dataset.blurId === id;
      item.classList.toggle('is-selected', active);
      item.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    button?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    rebuildBlurLayer();
  }

  function bindEvents() {
    els.openButton?.addEventListener('click', () => els.fileInput?.click());
    els.fileInput?.addEventListener('change', onFileSelected);
    els.saveButton?.addEventListener('click', saveImage);
    els.clearButton?.addEventListener('click', () => clearMask(true));
    els.blurAmount?.addEventListener('input', rebuildBlurLayer);
    els.brushSize?.addEventListener('input', () => undefined);

    els.output.addEventListener('pointerdown', startPaint);
    window.addEventListener('pointermove', movePaint);
    window.addEventListener('pointerup', endPaint);
    window.addEventListener('pointercancel', endPaint);

    els.stage.addEventListener('dragover', (event) => {
      event.preventDefault();
      els.stage.classList.add('is-dragover');
    });
    els.stage.addEventListener('dragleave', () => {
      els.stage.classList.remove('is-dragover');
    });
    els.stage.addEventListener('drop', (event) => {
      event.preventDefault();
      els.stage.classList.remove('is-dragover');
      const file = event.dataTransfer?.files?.[0];
      if (file) loadFile(file);
    });
  }

  function onFileSelected(event) {
    const file = event.target.files?.[0];
    if (file) loadFile(file);
    event.target.value = '';
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

  function isImageFile(file) {
    if (file.type && file.type.startsWith('image/')) return true;
    return /\.(jpe?g|png|gif|webp|bmp|heic|heif|avif|tif|tiff)$/i.test(file.name || '');
  }

  function setImageStageVisible(visible) {
    els.stage.classList.toggle('has-image', visible);
    els.empty.hidden = !visible;
    els.empty.setAttribute('aria-hidden', visible ? 'true' : 'false');
    els.output.hidden = !visible;
    els.output.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  function loadFile(file) {
    if (!isImageFile(file)) {
      setStatus('Please choose an image file.', true);
      return;
    }

    setStatus('Loading photo…');

    const reader = new FileReader();
    reader.onerror = () => setStatus('Could not read that file.', true);
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => setStatus('That image could not be opened.', true);
      image.onload = () => {
        const maxEdge = Math.min(2400, Math.max(window.innerWidth * 2, 1200));
        const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));

        [sourceCanvas, blurCanvas, maskCanvas, compositeCanvas].forEach((canvas) => {
          canvas.width = width;
          canvas.height = height;
        });
        els.output.width = width;
        els.output.height = height;

        sourceCtx.clearRect(0, 0, width, height);
        sourceCtx.drawImage(image, 0, 0, width, height);

        hasImage = true;
        setImageStageVisible(true);
        clearMask(false);
        rebuildBlurLayer(true);

        els.saveButton.disabled = false;
        els.clearButton.disabled = false;
        setStatus('Paint over the photo to add blur.');
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function blurSettings() {
    return {
      type: selectedBlur,
      amount: Number(els.blurAmount?.value || 14)
    };
  }

  function rebuildBlurLayer(immediate = false) {
    if (!hasImage) return;

    const { width, height } = sourceCanvas;
    const { type, amount } = blurSettings();

    blurCtx.setTransform(1, 0, 0, 1, 0, 0);
    blurCtx.globalAlpha = 1;
    blurCtx.globalCompositeOperation = 'source-over';
    blurCtx.filter = 'none';
    blurCtx.clearRect(0, 0, width, height);

    switch (type) {
      case 'pixel':
        drawPixelBlur(blurCtx, sourceCanvas, width, height, amount);
        break;
      case 'box':
        drawBoxBlur(blurCtx, sourceCanvas, width, height, amount);
        break;
      case 'motion':
        drawMotionBlur(blurCtx, sourceCanvas, width, height, amount);
        break;
      case 'radial':
        drawRadialBlur(blurCtx, sourceCanvas, width, height, amount);
        break;
      case 'frosted':
        drawFilteredBlur(blurCtx, sourceCanvas, amount * 1.8);
        blurCtx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        blurCtx.fillRect(0, 0, width, height);
        break;
      case 'grain':
        drawFilteredBlur(blurCtx, sourceCanvas, amount * 1.4);
        addGrain(blurCtx, width, height, amount);
        break;
      case 'mono':
        drawFilteredBlur(blurCtx, sourceCanvas, amount, 'grayscale(1) saturate(0.2)');
        break;
      case 'warm':
        drawFilteredBlur(blurCtx, sourceCanvas, amount, 'sepia(0.45) saturate(1.25) hue-rotate(-8deg)');
        break;
      case 'heavy':
        drawFilteredBlur(blurCtx, sourceCanvas, amount * 2.8);
        break;
      case 'soft':
      default:
        drawFilteredBlur(blurCtx, sourceCanvas, amount);
        break;
    }

    renderOutput(immediate);
  }

  function drawFilteredBlur(ctx, source, amount, extraFilter = '') {
    const radius = Math.max(1, amount);
    ctx.filter = extraFilter ? `blur(${radius}px) ${extraFilter}` : `blur(${radius}px)`;
    ctx.drawImage(source, 0, 0);
    ctx.filter = 'none';
  }

  function drawPixelBlur(ctx, source, width, height, amount) {
    const block = Math.max(4, Math.round(amount / 1.6));
    const smallW = Math.max(1, Math.ceil(width / block));
    const smallH = Math.max(1, Math.ceil(height / block));
    const tmp = document.createElement('canvas');
    tmp.width = smallW;
    tmp.height = smallH;
    const tmpCtx = tmp.getContext('2d');
    tmpCtx.drawImage(source, 0, 0, smallW, smallH);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, smallW, smallH, 0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
  }

  function drawBoxBlur(ctx, source, width, height, amount) {
    const shrink = Math.max(3, Math.round(amount / 1.8));
    const tmpW = Math.max(1, Math.ceil(width / shrink));
    const tmpH = Math.max(1, Math.ceil(height / shrink));
    const tmp = document.createElement('canvas');
    tmp.width = tmpW;
    tmp.height = tmpH;
    tmp.getContext('2d').drawImage(source, 0, 0, tmpW, tmpH);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(tmp, 0, 0, tmpW, tmpH, 0, 0, width, height);
  }

  function drawMotionBlur(ctx, source, width, height, amount) {
    const steps = Math.max(6, Math.round(amount / 2));
    const distance = Math.max(8, Math.round(amount * 1.4));
    ctx.globalAlpha = 1 / steps;
    for (let i = 0; i < steps; i += 1) {
      const offset = ((i / (steps - 1)) - 0.5) * distance;
      ctx.drawImage(source, offset, 0, width, height);
    }
    ctx.globalAlpha = 1;
  }

  function drawRadialBlur(ctx, source, width, height, amount) {
    const steps = Math.max(5, Math.round(amount / 4));
    const spread = Math.max(0.02, amount / 180);
    ctx.globalAlpha = 1 / steps;
    for (let i = 0; i < steps; i += 1) {
      const scale = 1 + (i * spread);
      const drawW = width * scale;
      const drawH = height * scale;
      ctx.drawImage(
        source,
        (width - drawW) / 2,
        (height - drawH) / 2,
        drawW,
        drawH
      );
    }
    ctx.globalAlpha = 1;
    ctx.filter = `blur(${Math.max(1, amount / 5)}px)`;
    ctx.globalCompositeOperation = 'source-over';
    const snapshot = document.createElement('canvas');
    snapshot.width = width;
    snapshot.height = height;
    snapshot.getContext('2d').drawImage(blurCanvas, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(snapshot, 0, 0);
    ctx.filter = 'none';
  }

  function addGrain(ctx, width, height, amount) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const strength = Math.min(42, 8 + amount);
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * strength;
      data[i] = clamp(data[i] + noise);
      data[i + 1] = clamp(data[i + 1] + noise);
      data[i + 2] = clamp(data[i + 2] + noise);
    }
    ctx.putImageData(imageData, 0, 0);
  }

  function clamp(value) {
    return Math.max(0, Math.min(255, value));
  }

  function paintOutputFrame() {
    if (!hasImage || !outputCtx) return;

    const { width, height } = sourceCanvas;
    outputCtx.clearRect(0, 0, width, height);
    outputCtx.drawImage(sourceCanvas, 0, 0);

    compositeCtx.clearRect(0, 0, width, height);
    compositeCtx.drawImage(blurCanvas, 0, 0);
    compositeCtx.globalCompositeOperation = 'destination-in';
    compositeCtx.drawImage(maskCanvas, 0, 0);
    compositeCtx.globalCompositeOperation = 'source-over';

    outputCtx.drawImage(compositeCanvas, 0, 0);
  }

  function renderOutput(immediate = false) {
    if (!hasImage) return;

    if (immediate) {
      if (renderFrame) {
        window.cancelAnimationFrame(renderFrame);
        renderFrame = 0;
      }
      paintOutputFrame();
      return;
    }

    if (renderFrame) return;

    renderFrame = window.requestAnimationFrame(() => {
      renderFrame = 0;
      paintOutputFrame();
    });
  }

  function pointerPosition(event) {
    const rect = els.output.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const scaleX = els.output.width / rect.width;
    const scaleY = els.output.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  function paintAt(x, y) {
    const size = Number(els.brushSize?.value || 36);
    maskCtx.fillStyle = '#ffffff';
    maskCtx.strokeStyle = '#ffffff';
    maskCtx.lineWidth = size;
    maskCtx.lineCap = 'round';
    maskCtx.lineJoin = 'round';

    if (lastPoint) {
      maskCtx.beginPath();
      maskCtx.moveTo(lastPoint.x, lastPoint.y);
      maskCtx.lineTo(x, y);
      maskCtx.stroke();
    }

    maskCtx.beginPath();
    maskCtx.arc(x, y, size / 2, 0, Math.PI * 2);
    maskCtx.fill();
    lastPoint = { x, y };
    renderOutput();
  }

  function startPaint(event) {
    if (!hasImage) return;
    painting = true;
    lastPoint = null;
    els.output.setPointerCapture?.(event.pointerId);
    const point = pointerPosition(event);
    if (point) paintAt(point.x, point.y);
  }

  function movePaint(event) {
    if (!painting || !hasImage) return;
    event.preventDefault();
    const point = pointerPosition(event);
    if (point) paintAt(point.x, point.y);
  }

  function endPaint(event) {
    if (!painting) return;
    painting = false;
    lastPoint = null;
    if (event?.pointerId != null) {
      els.output.releasePointerCapture?.(event.pointerId);
    }
  }

  function clearMask(rerender = true) {
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    lastPoint = null;
    if (rerender) renderOutput();
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
    if (!hasImage) return;

    setStatus('Preparing image…');

    const blob = await new Promise((resolve) => {
      els.output.toBlob(resolve, 'image/png', 0.95);
    });
    if (!blob) {
      setStatus('Could not export the image.', true);
      return;
    }

    const filename = 'mosaic-blur.png';

    if (shouldUseShareSheet()) {
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Mosaic blur' });
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