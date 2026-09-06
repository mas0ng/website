(() => {
  const script = document.currentScript;
  const selector = script?.dataset.asciiCanvas || "#masthead-canvas, #page-ascii-background";
  let canvas = document.querySelector(selector);

  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.className = "mas0ng-ascii-background";
    canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0";
    document.body.prepend(canvas);
  }

  if (canvas.dataset.asciiMounted === "true") return;
  canvas.dataset.asciiMounted = "true";
  canvas.classList.add("mas0ng-ascii-background");

  const context = canvas.getContext("2d");
  if (!context) return;

  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const font = '13px "Cascadia Mono", Consolas, monospace';
  const glyphs = " .,:;+=xX#%@";
  let width = 0;
  let height = 0;
  let columns = 0;
  let rows = 0;
  let animationFrame = 0;
  let lastFrame = 0;
  let elapsed = 0;
  let resizeFrame = 0;
  let contextLost = false;
  let pageHidden = false;
  let inViewport = true;

  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(bounds.width));
    height = Math.max(1, Math.round(bounds.height));
    // Bound both memory and dimensions on high-DPI and very large screens.
    const ratio = Math.min(window.devicePixelRatio || 1, 2,
      4096 / width, 4096 / height, Math.sqrt(4000000 / (width * height)));
    const pixelWidth = Math.max(1, Math.floor(width * ratio));
    const pixelHeight = Math.max(1, Math.floor(height * ratio));
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    context.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0);
    context.font = font;
    const characterWidth = context.measureText("M").width || 7.7;
    columns = Math.ceil((width + 4) / characterWidth) + 1;
    rows = Math.ceil(height / 17);
  };

  const draw = (now = 0) => {
    const time = now * 0.00055;
    context.clearRect(0, 0, width, height);
    context.font = font;
    context.textBaseline = "top";
    context.shadowColor = "rgba(96, 165, 250, 0.28)";
    context.shadowBlur = 0;

    for (let row = 0; row < rows; row += 1) {
      let line = "";
      for (let column = 0; column < columns; column += 1) {
        const wave = Math.sin(column * 0.19 + time * 3.2)
          + Math.cos(row * 0.31 - time * 2.4)
          + Math.sin((column + row) * 0.075 + time);
        const grain = Math.sin(column * 12.9898 + row * 78.233) * 0.45;
        const value = Math.max(0, Math.min(0.999, (wave + grain + 3.35) / 6.7));
        line += glyphs[Math.floor(value * glyphs.length)];
      }
      const glow = 0.16 + 0.16 * (0.5 + Math.sin(row * 0.17 - time * 2));
      context.fillStyle = `rgba(147, 197, 253, ${glow.toFixed(3)})`;
      context.fillText(line, -4, row * 17);
    }
  };

  const animate = (now) => {
    animationFrame = 0;
    if (document.hidden || pageHidden || !inViewport || contextLost || motionPreference.matches) return;
    if (!lastFrame) lastFrame = now;
    if (now - lastFrame >= 48) {
      elapsed += Math.min(now - lastFrame, 100);
      draw(elapsed);
      lastFrame = now;
    }
    animationFrame = window.requestAnimationFrame(animate);
  };

  const syncAnimation = () => {
    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    lastFrame = 0;
    if (document.hidden || pageHidden || !inViewport || contextLost) return;
    resize();
    draw(elapsed);
    if (!motionPreference.matches) animationFrame = window.requestAnimationFrame(animate);
  };
  const queueResize = () => {
    if (resizeFrame) return;
    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = 0;
      syncAnimation();
    });
  };
  window.addEventListener("resize", queueResize, { passive: true });
  window.visualViewport?.addEventListener("resize", queueResize, { passive: true });
  if (window.ResizeObserver) new ResizeObserver(queueResize).observe(canvas);
  if (motionPreference.addEventListener) motionPreference.addEventListener("change", syncAnimation);
  else motionPreference.addListener(syncAnimation);
  document.addEventListener("visibilitychange", syncAnimation);
  window.addEventListener("pagehide", () => { pageHidden = true; syncAnimation(); });
  window.addEventListener("pageshow", () => { pageHidden = false; syncAnimation(); });
  canvas.addEventListener("contextlost", (event) => {
    event.preventDefault();
    contextLost = true;
    syncAnimation();
  });
  canvas.addEventListener("contextrestored", () => { contextLost = false; syncAnimation(); });
  document.fonts?.ready.then(queueResize);
  if (window.IntersectionObserver) {
    new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
      syncAnimation();
    }).observe(canvas);
  }
  syncAnimation();
})();
