(function () {
  const d = window.MAS0NG_SITE;
  if (!d) return;

  const socialGrid = document.getElementById('social-grid');
  const appsGrid = document.getElementById('featured-apps-grid');
  const skeletons = window.MAS0NG_GRID_SKELETONS;

  if (skeletons) {
    skeletons.mount(socialGrid, 'social', 4);
    skeletons.mount(appsGrid, 'app', 2);
  }

  document.addEventListener('mas0ng:shell-ready', init, { once: true });
  if (document.getElementById('site-nav')) init();

  function init() {
    ['footer-login'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.href = d.loginUrl;
    });

    renderSocials();
    renderFeaturedApps();
  }

  async function renderSocials() {
    if (!window.MAS0NG_SOCIAL_TILES || !socialGrid) return;

    try {
      socialGrid.innerHTML = window.MAS0NG_SOCIAL_TILES.renderGrid(d.social);
      if (skeletons) {
        await skeletons.waitForImages(socialGrid);
        skeletons.done(socialGrid);
      }
    } catch (error) {
      socialGrid.innerHTML = '<p class="section__lead">Social links could not be loaded right now.</p>';
      skeletons?.done(socialGrid);
      console.warn('Failed to render social links:', error);
    }
  }

  async function renderFeaturedApps() {
    if (!appsGrid || !window.MAS0NG_APP_TILES) return;

    try {
      const apps = d.apps || await window.MAS0NG_APP_TILES.loadApps(
        d.assets.appsConfig,
        d.siteOrigin || window.location.origin
      );
      appsGrid.innerHTML = window.MAS0NG_APP_TILES.renderGrid(
        window.MAS0NG_APP_TILES.featuredPublic(apps)
      );
      if (skeletons) {
        await skeletons.waitForImages(appsGrid);
        skeletons.done(appsGrid);
      }
    } catch (error) {
      appsGrid.innerHTML = '<p class="section__lead">Public apps could not be loaded right now.</p>';
      skeletons?.done(appsGrid);
      console.warn('Failed to load featured apps:', error);
    }
  }
})();