window.MAS0NG_SOCIAL_TILES = (function () {
  const SOCIAL_STATS_ENDPOINT = '/api/social-platforms';
  const CACHE_TTL_MS = 2 * 60 * 1000; // 2 min client cache

  let cachedStats = null;
  let cacheTime = 0;

  function isPending(href) {
    return !href || href === '#';
  }

  function filterLive(socials) {
    return (socials || []).filter((s) => !isPending(s.href));
  }

  function formatNumber(n) {
    if (n == null || isNaN(n)) return '—';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 10_000) return Math.round(n / 1_000) + 'K';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toLocaleString();
  }

  async function fetchSocialStats() {
    const now = Date.now();
    if (cachedStats && (now - cacheTime) < CACHE_TTL_MS) {
      return cachedStats;
    }
    try {
      const res = await fetch(SOCIAL_STATS_ENDPOINT, { cache: 'no-cache' });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('HTTP ' + res.status);
      }
      const data = await res.json();
      if (!data || !data.ok) return null;
      cachedStats = data;
      cacheTime = now;
      return data;
    } catch (e) {
      console.warn('Social stats fetch failed:', e);
      return null;
    }
  }

  function enrichSocials(socials, statsData) {
    if (!statsData || !statsData.stats) return socials || [];
    const map = statsData.stats;
    return (socials || []).map((s) => {
      const entry = map[s.id];
      if (!entry) return s;
      const val = entry.value;
      if (val == null) return s;
      const vstr = String(val).trim().toLowerCase();
      if (vstr === 'na' || vstr === 'n/a' || vstr === '-') return s;
      const num = typeof val === 'number' ? val : Number(val);
      if (isNaN(num)) return s;
      return {
        ...s,
        stat: {
          value: num,
          label: entry.label || 'followers'
        }
      };
    });
  }

  function renderTile(s) {
    const statHTML = s.stat
      ? `<span class="social-tile__stat"><span class="social-tile__stat-value">${formatNumber(s.stat.value)}</span> ${s.stat.label}</span>`
      : '';
    return `
      <a class="social-tile social-tile--${s.id}" href="${s.href}" target="_blank" rel="noopener noreferrer">
        <div class="social-tile__glow" aria-hidden="true"></div>
        <div class="social-tile__icon-wrap">
          <img src="${s.icon}" alt="" width="32" height="32" loading="lazy" decoding="async" />
        </div>
        <div class="social-tile__body">
          <span class="social-tile__label">${s.label}</span>
          <span class="social-tile__handle">${s.handle}</span>
          ${statHTML}
        </div>
        <span class="social-tile__external" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
        </span>
      </a>
    `;
  }

  function renderGrid(socials) {
    return filterLive(socials).map(renderTile).join('');
  }

  async function loadSocials(url) {
    const response = await fetch(url || '/public_assets/configs/socials.json', { cache: 'default' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  return {
    isPending,
    filterLive,
    renderTile,
    renderGrid,
    loadSocials,
    fetchSocialStats,
    enrichSocials,
    formatNumber
  };
})();
