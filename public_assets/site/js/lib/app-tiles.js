window.MAS0NG_APP_TILES = (function () {
  const DEFAULT_CONFIG_URL = '/public_assets/configs/apps.json';

  function resolveUrl(url, origin) {
    if (!url) return '#';
    if (/^https?:\/\//i.test(url)) return url;
    const base = (origin || '').replace(/\/$/, '');
    return `${base}${url.startsWith('/') ? url : `/${url}`}`;
  }

  async function loadApps(url, origin) {
    const configUrl = resolveUrl(url || DEFAULT_CONFIG_URL, origin);
    const response = await fetch(configUrl, { cache: 'default' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const publicApps = (data.public || []).map((app) => normalizeApp(app, origin));
    const privateApps = (data.private || []).map((app) => normalizeApp(app, origin));
    return { public: publicApps, private: privateApps, all: [...publicApps, ...privateApps] };
  }

  function normalizeApp(app, origin) {
    return {
      ...app,
      href: resolveUrl(app.href, origin),
      icon: resolveUrl(app.icon, origin)
    };
  }

  function featuredPublic(apps) {
    return (apps.public || apps).filter((app) => app.featured !== false);
  }

  function renderTile(app) {
    return `
      <a class="app-tile" href="${app.href}">
        <div class="app-tile__glow" aria-hidden="true"></div>
        <div class="app-tile__icon-wrap">
          <img src="${app.icon}" alt="" width="32" height="32" loading="lazy" decoding="async" />
        </div>
        <div class="app-tile__body">
          <span class="app-tile__label">${app.name}</span>
          <span class="app-tile__handle">${app.description || app.label || ''}</span>
        </div>
        <span class="app-tile__external" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </span>
      </a>
    `;
  }

  function renderGrid(apps) {
    const list = Array.isArray(apps) ? apps : featuredPublic(apps);
    return list.map(renderTile).join('');
  }

  function renderMenuItems(apps) {
    return (apps || []).map((app) =>
      `<a class="nav__menu-item" href="${app.href}" role="menuitem">${app.name}</a>`
    ).join('');
  }

  return {
    loadApps,
    featuredPublic,
    renderTile,
    renderGrid,
    renderMenuItems,
    resolveUrl
  };
})();