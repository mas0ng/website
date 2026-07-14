(function () {
  const canvas = document.getElementById('masthead-canvas');
  if (!canvas) return;
  const masthead = document.getElementById('masthead');
  if (!masthead) return;
  const isBioPage = document.body?.dataset.page === 'bio';
  const isHomePage = document.body?.dataset.page === 'home';
  const isLiquidPage = isBioPage || isHomePage;
  const staticMasthead = window.matchMedia('(max-width: 768px), (hover: none) and (pointer: coarse)');
  if (staticMasthead.matches && !isLiquidPage) {
    canvas.hidden = true;
    canvas.setAttribute('aria-hidden', 'true');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Physics and interaction configuration
  const springTension = 0.035;
  const springDamping = 0.82;
  const numParticles = isLiquidPage ? (staticMasthead.matches ? 90 : 170) : 240;

  let mouse = { x: 0, y: 0, active: false };
  let mousePos = { x: 0, y: 0 };
  let width = 0;
  let height = 0;
  let particles = [];
  
  let isSleeping = true;
  let animationFrameId = null;

  // Initialize particles scattered across the canvas
  function initParticles() {
    particles = [];
    mousePos.x = width / 2;
    mousePos.y = height / 2;

    const minDim = Math.min(width, height);

    for (let i = 0; i < numParticles; i++) {
      // Scatter uniformly across the masthead viewport
      const px = Math.random() * width;
      const py = Math.random() * height;
      
      const baseScale = 0.5 + Math.random() * 0.5;
      
      // Liquid droplet radius (10px to 22px)
      const radius = 10 + Math.random() * 12;

      particles.push({
        baseX: px,
        baseY: py,
        x: px + (Math.random() - 0.5) * 60,
        y: py + (Math.random() - 0.5) * 60,
        vx: 0,
        vy: 0,
        scale: baseScale,
        baseScale: baseScale,
        radius: radius,
        noiseSeed: Math.random() * 100
      });
    }
  }

  // Update physics simulation and render the liquid blobs
  function updateAndRender() {
    ctx.clearRect(0, 0, width, height);
    let maxVelocity = 0;
    const time = Date.now() * 0.001;

    const minDim = Math.min(width, height);
    const baseRingRadius = minDim * 0.22; // Base radius of the repulsion bubble
    const ringRadius = baseRingRadius + Math.sin(time * 1.5) * (minDim * 0.02) + Math.cos(time * 3.2) * (minDim * 0.015);
    const ringWidth = minDim * 0.14; // Width of the bright influence band

    // 1. Smoothly ease the mouse position (drifts organically when idle)
    if (mouse.active) {
      mousePos.x += (mouse.x - mousePos.x) * 0.05;
      mousePos.y += (mouse.y - mousePos.y) * 0.05;
    } else {
      // Subtle idle wandering to keep the background alive
      const idleTime = time * 0.35;
      const targetIdleX = width / 2 + Math.sin(idleTime) * (width * 0.2);
      const targetIdleY = height / 2 + Math.cos(idleTime * 0.6) * (height * 0.15);
      mousePos.x += (targetIdleX - mousePos.x) * 0.012;
      mousePos.y += (targetIdleY - mousePos.y) * 0.012;
    }

    // 2. Update and draw each particle
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Organic liquid drift waves (broad and sweeping)
      const dispX = Math.sin(p.baseX * 0.008 + time * 1.5 + p.noiseSeed) * 45 + Math.cos(p.baseY * 0.004 - time * 0.8) * 20;
      const dispY = Math.cos(p.baseX * 0.004 + time * 1.8 + p.noiseSeed) * 45 + Math.sin(p.baseY * 0.008 - time * 0.8) * 20;

      const refX = p.baseX + dispX;
      const refY = p.baseY + dispY;

      // Distance to the active influence center
      const dx = refX - mousePos.x;
      const dy = refY - mousePos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let targetX = refX;
      let targetY = refY;
      
      // Organic size breathing cycle (blobs breathing slowly)
      const breathe = Math.sin(time * 2.0 + p.noiseSeed) * 0.15;
      let targetScale = p.baseScale * (1.0 + breathe);

      const angleToCenter = Math.atan2(dy, dx);

      if (dist < ringRadius) {
        // Inside the repulsion bubble: push outwards to the boundary
        const force = (ringRadius - dist) / ringRadius;
        targetX = refX + Math.cos(angleToCenter) * (ringRadius - dist) * 0.98;
        targetY = refY + Math.sin(angleToCenter) * (ringRadius - dist) * 0.98;

        // Shrink particles inside the bubble (clearing center)
        targetScale = p.baseScale * (0.1 + (1 - force) * 0.9 + breathe);
      } 
      else if (dist >= ringRadius && dist < ringRadius + ringWidth) {
        // On the bright boundary band: compress outwards and scale up/brighten
        const bandDist = dist - ringRadius;
        const force = Math.pow(1 - (bandDist / ringWidth), 2.2);
        
        targetX = refX + Math.cos(angleToCenter) * force * 50;
        targetY = refY + Math.sin(angleToCenter) * force * 50;
        
        // Scale boost on the ring edge (making them swell and merge)
        targetScale = p.baseScale * (1.1 + force * 1.3 + breathe);
      }

      // Spring-mass-damper physics integration
      const ax = (targetX - p.x) * springTension;
      const ay = (targetY - p.y) * springTension;

      p.vx = (p.vx + ax) * springDamping;
      p.vy = (p.vy + ay) * springDamping;

      p.x += p.vx;
      p.y += p.vy;

      // Scale easing
      p.scale += (targetScale - p.scale) * 0.1;

      // Track maximum velocity to manage sleep state
      const velSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (velSpeed > maxVelocity) maxVelocity = velSpeed;

      // Render the blob (stretches along motion velocity vector)
      const velAngle = Math.atan2(p.vy, p.vx);
      const motionStretch = 1.0 + velSpeed * 0.16;
      
      // Calculate length of capsule stretch (0 when stationary, rendering a perfect circle)
      const strokeHalfLen = Math.max(0, (p.radius * p.scale * (motionStretch - 1.0)) / 2);
      const cosA = Math.cos(velAngle);
      const sinA = Math.sin(velAngle);
      
      const x1 = p.x - cosA * strokeHalfLen;
      const y1 = p.y - sinA * strokeHalfLen;
      const x2 = p.x + cosA * strokeHalfLen;
      const y2 = p.y + sinA * strokeHalfLen;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);

      // Border fading
      let edgeFade = 1;
      const borderThreshold = 40;
      if (p.x < borderThreshold) edgeFade *= (p.x / borderThreshold);
      if (p.x > width - borderThreshold) edgeFade *= ((width - p.x) / borderThreshold);
      if (p.y < borderThreshold) edgeFade *= (p.y / borderThreshold);
      if (p.y > height - borderThreshold) edgeFade *= ((height - p.y) / borderThreshold);

      // Color has full opacity because SVG threshold filter will control the sharp alpha border
      ctx.strokeStyle = `rgba(255, 255, 255, ${edgeFade})`;
      ctx.lineWidth = p.radius * 2 * p.scale;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    return maxVelocity;
  }

  // Animation loop with sleep behavior to conserve device CPU
  function loop() {
    animationFrameId = requestAnimationFrame(loop);
    const maxVel = updateAndRender();

    // Sleep when tab is hidden
    if (document.hidden) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
      isSleeping = true;
    }
  }

  function wake() {
    if (isSleeping) {
      isSleeping = false;
      if (!animationFrameId) {
        loop();
      }
    }
  }

  // Handle page resizing and high-DPR screens
  function resize() {
    const rect = masthead.getBoundingClientRect();
    width = isLiquidPage ? window.innerWidth : rect.width;
    height = isLiquidPage ? window.innerHeight : rect.height;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    initParticles();
    wake();
  }

  // Capture user interactions on the masthead container
  masthead.addEventListener('mousemove', (e) => {
    const rect = masthead.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
    wake();
  });

  masthead.addEventListener('mouseenter', () => {
    mouse.active = true;
    wake();
  });

  masthead.addEventListener('mouseleave', () => {
    mouse.active = false;
    wake();
  });

  masthead.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      const rect = masthead.getBoundingClientRect();
      mouse.x = e.touches[0].clientX - rect.left;
      mouse.y = e.touches[0].clientY - rect.top;
      mouse.active = true;
      wake();
    }
  }, { passive: true });

  masthead.addEventListener('touchend', () => {
    mouse.active = false;
    wake();
  });

  // Wake up when page visibility returns
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      wake();
    }
  });

  // Kickstart
  resize();
  window.addEventListener('resize', resize);
})();
