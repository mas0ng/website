(function () {
  const d = window.MAS0NG_SITE;
  if (!d || !window.MAS0NG_SOCIAL_TILES) return;

  const socialGrid = document.getElementById('social-grid');
  const skeletons = window.MAS0NG_GRID_SKELETONS;

  if (skeletons) {
    skeletons.mount(socialGrid, 'social', 4);
  }

  document.addEventListener('mas0ng:shell-ready', init, { once: true });

  async function init() {
    if (!socialGrid) return;

    try {
      let toRender = d.social || [];
      if (window.MAS0NG_SOCIAL_TILES && window.MAS0NG_SOCIAL_TILES.fetchSocialStats) {
        const statsData = await window.MAS0NG_SOCIAL_TILES.fetchSocialStats().catch(() => null);
        toRender = window.MAS0NG_SOCIAL_TILES.enrichSocials(d.social, statsData);
      }
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