(function () {
  const d = window.MAS0NG_SITE;
  if (!d || !window.MAS0NG_SOCIAL_TILES) return;

  const socialGrid = document.getElementById('social-grid');
  const skeletons = window.MAS0NG_GRID_SKELETONS;

  if (skeletons && !socialGrid?.querySelector('.social-tile')) {
    skeletons.mount(socialGrid, 'social', 4);
  }

  document.addEventListener('mas0ng:shell-ready', init, { once: true });

  async function init() {
    if (!socialGrid) return;

    try {
      const toRender = d.social || [];
      socialGrid.innerHTML = window.MAS0NG_SOCIAL_TILES.renderGrid(toRender);
      if (skeletons) {
        // Image placeholders load independently of the social content.
        skeletons.done(socialGrid);
      }
    } catch (error) {
      if (!socialGrid.querySelector('.social-tile')) socialGrid.innerHTML = '<p class="content-status" role="status">Social links are temporarily unavailable. Please try again later.</p>';
      skeletons?.done(socialGrid);
      console.warn('Failed to render social links:', error);
    }
  }
})();
