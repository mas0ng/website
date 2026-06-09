(function () {
  const els = {
    fileInput: document.getElementById('mosaic-file'),
    openButton: document.getElementById('mosaic-open'),
    saveButton: document.getElementById('mosaic-save'),
    clearButton: document.getElementById('mosaic-clear'),
    blurType: document.getElementById('mosaic-blur-type'),
    blurAmount: document.getElementById('mosaic-blur-amount'),
    brushSize: document.getElementById('mosaic-brush-size'),
    stage: document.getElementById('mosaic-stage'),
    empty: document.getElementById('mosaic-empty'),
    output: document.getElementById('mosaic-output')
  };

  const sourceCanvas = document.createElement('canvas');
  const blurCanvas = document.createElement('canvas');
  const maskCanvas = document.createElement('canvas');
  const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  const blurCtx = blurCanvas.getContext('2d');
  const maskCtx = maskCanvas.getContext('2d');
  const outputCtx = els.output.getContext('2d');

  let painting = false;
  let hasImage = false;

  bindEvents();

  function bindEvents() {
    els.openButton?.addEventListener('click', () => els.fileInput?.click());
    els.fileInput?.addEventListener('change', onFileSelected);
    els.saveButton?.addEventListener('click', saveImage);
    els.clearButton?.addEventListener('click', clearMask);
    els.blurType?.addEventListener('change', rebuildBlurLayer);
    els.blurAmount?.addEventListener('input', rebuildBlurLayer);
    els.brushSize?.addEventListener('input', () => undefined);

    els.output.addEventListener('pointerdown', startPaint);
    window.addEventListener('pointermove', movePaint);
    window.addEventListener('pointerup', endPaint);
    window.addEventListener('pointercancel', endPaint);

    els.stage.addEventListener('dragover', (event) => {
      event.preventDefault();
    });
    els.stage.addEventListener('drop', (event) => {
      event.preventDefault();
      const file = event.dataTransfer?.files?.[0];
      if (file) loadFile(file);
    });
  }

  function onFileSelected(event) {
    const file = event.target.files?.[0];
    if (file) loadFile(file);
  }

  function loadFile(file) {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxEdge = Math.min(2200, Math.max(window.innerWidth * 2, 1200));
        const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));

        [sourceCanvas, blurCanvas, maskCanvas].forEach((canvas) => {
          canvas.width = width;
          canvas.height = height;
        });
        els.output.width = width;
        els.output.height = height;

        sourceCtx.clearRect(0, 0, width, height);
        sourceCtx.drawImage(image, 0, 0, width, height);
        clearMask(false);
        rebuildBlurLayer();
        hasImage = true;
        els.empty.hidden = true;
        els.output.hidden = false;
        els.saveButton.disabled = false;
        els.clearButton.disabled = false;
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function blurSettings() {
    const type = els.blurType?.value || 'gaussian';
    const amount = Number(els.blurAmount?.value || 12);
    return { type, amount };
  }

  function rebuildBlurLayer() {
    if (!hasImage) return;

    const { width, height } = sourceCanvas;
    const { type, amount } = blurSettings();

    blurCtx.clearRect(0, 0, width, height);

    if (type === 'pixel') {
      const block = Math.max(4, Math.round(amount / 2));
      const smallW = Math.max(1, Math.ceil(width / block));
      const smallH = Math.max(1, Math.ceil(height / block));
      const tmp = document.createElement('canvas');
      tmp.width = smallW;
      tmp.height = smallH;
      const tmpCtx = tmp.getContext('2d');
      tmpCtx.drawImage(sourceCanvas, 0, 0, smallW, smallH);
      blurCtx.imageSmoothingEnabled = false;
      blurCtx.drawImage(tmp, 0, 0, smallW, smallH, 0, 0, width, height);
      blurCtx.imageSmoothingEnabled = true;
    } else {
      const radius = type === 'strong' ? amount * 2.4 : amount;
      blurCtx.filter = `blur(${radius}px)`;
      blurCtx.drawImage(sourceCanvas, 0, 0);
      blurCtx.filter = 'none';
    }

    renderOutput();
  }

  function renderOutput() {
    if (!hasImage) return;

    const { width, height } = sourceCanvas;
    outputCtx.clearRect(0, 0, width, height);
    outputCtx.drawImage(sourceCanvas, 0, 0);

    const temp = document.createElement('canvas');
    temp.width = width;
    temp.height = height;
    const tempCtx = temp.getContext('2d');
    tempCtx.drawImage(blurCanvas, 0, 0);
    tempCtx.globalCompositeOperation = 'destination-in';
    tempCtx.drawImage(maskCanvas, 0, 0);
    outputCtx.drawImage(temp, 0, 0);
  }

  function pointerPosition(event) {
    const rect = els.output.getBoundingClientRect();
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
    maskCtx.beginPath();
    maskCtx.arc(x, y, size / 2, 0, Math.PI * 2);
    maskCtx.fill();
    renderOutput();
  }

  function startPaint(event) {
    if (!hasImage) return;
    painting = true;
    els.output.setPointerCapture?.(event.pointerId);
    const point = pointerPosition(event);
    paintAt(point.x, point.y);
  }

  function movePaint(event) {
    if (!painting || !hasImage) return;
    event.preventDefault();
    const point = pointerPosition(event);
    paintAt(point.x, point.y);
  }

  function endPaint() {
    painting = false;
  }

  function clearMask(rerender = true) {
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    if (rerender) renderOutput();
  }

  async function saveImage() {
    if (!hasImage) return;

    const blob = await new Promise((resolve) => {
      els.output.toBlob(resolve, 'image/png', 0.95);
    });
    if (!blob) return;

    const file = new File([blob], 'mosaic-blur.png', { type: 'image/png' });

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Mosaic blur' });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mosaic-blur.png';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
})();