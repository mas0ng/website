window.MAS0NG_GRID_SKELETONS = (function () {
  const DEFAULT_COUNTS = {
    social: 4,
    app: 2
  };

  function renderTile(type) {
    return `
      <div class="tile-skeleton tile-skeleton--${type}" aria-hidden="true">
        <div class="tile-skeleton__icon skeleton-shimmer"></div>
        <div class="tile-skeleton__body">
          <span class="tile-skeleton__line skeleton-shimmer"></span>
          <span class="tile-skeleton__line tile-skeleton__line--short skeleton-shimmer"></span>
        </div>
      </div>
    `;
  }

  function mount(grid, type, count) {
    if (!grid) return;
    const total = count || DEFAULT_COUNTS[type] || 3;
    grid.classList.add('is-loading');
    grid.setAttribute('aria-busy', 'true');
    grid.innerHTML = Array.from({ length: total }, () => renderTile(type)).join('');
  }

  function waitForImages(container) {
    const images = Array.from(container?.querySelectorAll('img') || []);
    if (!images.length) return Promise.resolve();

    return Promise.all(images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      });
    }));
  }

  function done(grid) {
    if (!grid) return;
    grid.classList.remove('is-loading');
    grid.removeAttribute('aria-busy');
  }

  return { mount, done, waitForImages, renderTile };
})();