(() => {
  const script = document.currentScript;
  const selector = script?.dataset.asciiCanvas || "#masthead-canvas, #page-ascii-background";
  let canvas = document.querySelector(selector);

  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.className = "mas0ng-ascii-background";
    document.body.prepend(canvas);
  }

  if (canvas.dataset.asciiMounted === "true") return;
  canvas.dataset.asciiMounted = "true";
  canvas.classList.add("mas0ng-ascii-background");

  const context = canvas.getContext("2d");
  if (!context) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const glyphs = " .,:;+=xX#%@";
  let width = 0;
  let height = 0;
  let columns = 0;
  let rows = 0;
  let animationFrame = 0;
  let lastFrame = 0;

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(bounds.width || window.innerWidth));
    height = Math.max(1, Math.round(bounds.height || window.innerHeight));
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    columns = Math.ceil(width / 7.7);
    rows = Math.ceil(height / 17);
  };

  const draw = (now = 0) => {
    const time = now * 0.00055;
    context.clearRect(0, 0, width, height);
    context.font = '13px "Cascadia Mono", Consolas, monospace';
    context.textBaseline = "top";
    context.shadowColor = "rgba(96, 165, 250, 0.28)";
    context.shadowBlur = 8;

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
    if (now - lastFrame >= 48) {
      draw(now);
      lastFrame = now;
    }
    animationFrame = window.requestAnimationFrame(animate);
  };

  resize();
  draw();
  if (!reduceMotion) animationFrame = window.requestAnimationFrame(animate);

  window.addEventListener("resize", () => {
    resize();
    draw(performance.now());
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.cancelAnimationFrame(animationFrame);
    } else if (!reduceMotion) {
      animationFrame = window.requestAnimationFrame(animate);
    }
  });
})();
