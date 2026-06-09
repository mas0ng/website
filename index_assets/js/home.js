(function () {
  const d = window.MAS0NG_SITE;
  if (!d || !window.MAS0NG_SOCIAL_TILES) return;

  document.addEventListener('mas0ng:shell-ready', init, { once: true });
  if (document.getElementById('site-nav')) init();

  function init() {
    const grid = document.getElementById('social-grid');
    if (!grid) return;

    ['hero-login', 'footer-login'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.href = d.loginUrl;
    });

    grid.innerHTML = window.MAS0NG_SOCIAL_TILES.renderGrid(d.social);
  }
})();