(function () {
  const d = window.MAS0NG_SITE;
  if (!d) return;

  document.addEventListener('mas0ng:shell-ready', init, { once: true });
  if (document.getElementById('site-nav')) init();

  function init() {
    ['hero-login', 'footer-login'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.href = d.loginUrl;
    });

    renderSocials();
    renderFeaturedApps();
  }

  function renderSocials() {
    if (!window.MAS0NG_SOCIAL_TILES) return;
    const grid = document.getElementById('social-grid');
    if (!grid) return;
    grid.innerHTML = window.MAS0NG_SOCIAL_TILES.renderGrid(d.social);
  }

  async function renderFeaturedApps() {
    const grid = document.getElementById('featured-apps-grid');
    if (!grid || !window.MAS0NG_APP_TILES) return;

    try {
      const apps = d.apps || await window.MAS0NG_APP_TILES.loadApps(
        d.assets.appsConfig,
        d.siteOrigin || window.location.origin
      );
      grid.innerHTML = window.MAS0NG_APP_TILES.renderGrid(window.MAS0NG_APP_TILES.featuredPublic(apps));
    } catch (error) {
      grid.innerHTML = '<p class="section__lead">Public apps could not be loaded right now.</p>';
      console.warn('Failed to load featured apps:', error);
    }
  }
})();