(function () {
  const d = window.MAS0NG_SITE;
  if (!d || !window.MAS0NG_SOCIAL_TILES) return;

  document.addEventListener('mas0ng:shell-ready', init, { once: true });

  function init() {
    const grid = document.getElementById('social-grid');
    if (!grid) return;
    grid.innerHTML = window.MAS0NG_SOCIAL_TILES.renderGrid(d.social);
  }
})();