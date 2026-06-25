window.MAS0NG_TIKTOK_STATS = (function () {
  const ENDPOINT = '/api/social-stats';
  const CACHE_TTL_MS = 2 * 60 * 1000; // 2 min client cache

  let cached = null;
  let cacheTime = 0;

  function formatNumber(n) {
    if (n == null || isNaN(n)) return '—';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 10_000) return Math.round(n / 1_000) + 'K';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toLocaleString();
  }

  function relativeTime(iso) {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - then);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    const days = Math.floor(hrs / 24);
    return days + 'd ago';
  }

  async function fetchStats() {
    const now = Date.now();
    if (cached && (now - cacheTime) < CACHE_TTL_MS) {
      return cached;
    }
    try {
      const res = await fetch(ENDPOINT, { cache: 'no-cache' });
      if (!res.ok) {
        if (res.status === 404) return null; // no stats published yet
        throw new Error('HTTP ' + res.status);
      }
      const data = await res.json();
      if (!data || !data.ok || !data.stats) return null;
      cached = data;
      cacheTime = now;
      return data;
    } catch (e) {
      console.warn('TikTok stats fetch failed:', e);
      return null;
    }
  }

  function render(container, data) {
    if (!container) return;

    if (!data || !data.stats) {
      container.innerHTML = '';
      container.classList.remove('is-loading', 'is-error');
      return;
    }

    const s = data.stats;
    const updated = data.lastUpdated || s.updatedAt;
    const rel = relativeTime(updated);

    // Always render exactly 3 metrics for a balanced, polished look
    const items = [
      { label: 'Followers', value: formatNumber(s.followers) },
      { label: 'Likes', value: formatNumber(s.likes) },
    ];

    if (s.views != null) {
      items.push({ label: 'Views', value: formatNumber(s.views) });
    } else if (s.videoCount != null && s.videoCount > 0) {
      items.push({ label: 'Videos', value: formatNumber(s.videoCount) });
    } else {
      items.push({ label: 'Videos', value: '—' });
    }

    const itemsHTML = items.map((it) => `
      <div class="tiktok-stats__item">
        <div class="tiktok-stats__label">${it.label}</div>
        <div class="tiktok-stats__value">${it.value}</div>
      </div>
    `).join('');

    const headerHTML = `
      <div class="tiktok-stats__header">
        <div class="tiktok-stats__brand">
          <img src="/public_assets/social_icons/tiktok.svg" width="16" height="16" alt="" class="tiktok-stats__icon" />
          <span>TikTok stats - all my accounts</span>
        </div>
        ${rel ? `<div class="tiktok-stats__updated" title="${updated || ''}">Updated ${rel}</div>` : ''}
      </div>
    `;

    const gridHTML = `<div class="tiktok-stats__grid">${itemsHTML}</div>`;
    container.innerHTML = headerHTML + gridHTML;
    container.classList.remove('is-loading', 'is-error');
  }

  async function mount(container) {
    if (!container) return;
    container.classList.add('is-loading');
    const data = await fetchStats();
    render(container, data);
    if (!data) {
      container.classList.remove('is-loading');
      // No 'is-error' — this is the normal "not yet published" state.
      // The container stays empty until the first successful update from the local script.
    }
  }

  return { fetchStats, render, mount, formatNumber, relativeTime };
})();
