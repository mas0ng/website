(function () {
  document.addEventListener('mas0ng:shell-ready', init, { once: true });

  async function init() {
    const grid = document.getElementById('public-apps-grid');
    if (!grid || !window.MAS0NG_APP_TILES) return;

    try {
      const apps = await window.MAS0NG_APP_TILES.loadApps();
      grid.innerHTML = window.MAS0NG_APP_TILES.renderGrid(apps.public);
    } catch (error) {
      grid.innerHTML = '<p class="section__lead">Public apps could not be loaded right now.</p>';
      console.warn('Failed to load public apps:', error);
    }
  }
})();