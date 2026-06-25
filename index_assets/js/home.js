(function () {
  const d = window.MAS0NG_SITE;
  if (!d) return;

  const socialGrid = document.getElementById('social-grid');
  const skeletons = window.MAS0NG_GRID_SKELETONS;

  if (skeletons) {
    skeletons.mount(socialGrid, 'social', 4);
  }

  document.addEventListener('mas0ng:shell-ready', init, { once: true });
  if (document.getElementById('site-nav')) init();

  function init() {
    ['footer-login', 'nav-login', 'nav-login-drawer'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.href = d.loginUrl;
    });

    renderSocials();
  }

  async function renderSocials() {
    if (!window.MAS0NG_SOCIAL_TILES || !socialGrid) return;

    try {
      const toRender = d.social || [];
      socialGrid.innerHTML = window.MAS0NG_SOCIAL_TILES.renderGrid(toRender);
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
})();
