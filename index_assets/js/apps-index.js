(function () {
  const SESSION_URL = 'https://auth.mas0ng.com/session';

  async function isAuthenticated() {
    try {
      const response = await fetch(SESSION_URL, {
        credentials: 'include',
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      });
      const data = await response.json().catch(() => ({}));
      return response.ok && data.authenticated === true;
    } catch {
      return false;
    }
  }

  async function boot() {
    if (!await isAuthenticated()) {
      window.location.replace('/');
      return;
    }

    document.addEventListener('mas0ng:shell-ready', init, { once: true });
  }

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

  boot();
})();