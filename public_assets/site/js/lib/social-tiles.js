window.MAS0NG_SOCIAL_TILES = (function () {
  function isPending(href) {
    return !href || href === '#';
  }

  function isTikTokBrowser(userAgent) {
    const ua = String(userAgent || window.navigator.userAgent || '').toLowerCase();
    return /tiktok|musical_ly|musically|bytedancewebview|com\.zhiliaoapp\.musically/.test(ua);
  }

  function buildTikTokRedirectUrl(social) {
    const params = new URLSearchParams({
      open: social.id || '',
      url: social.href || '',
      service: social.label || 'Social profile',
      username: social.handle || '',
      iconurl: social.icon || ''
    });
    return `/redirect/tiktok.html?${params.toString()}`;
  }

  function filterLive(socials) {
    return (socials || []).filter((social) => !isPending(social.href));
  }

  function renderTile(social) {
    return `
      <a class="social-tile social-tile--${social.id}" href="${social.href}" target="_blank" rel="noopener noreferrer">
        <div class="social-tile__glow" aria-hidden="true"></div>
        <div class="social-tile__icon-wrap">
          <img src="${social.icon}" alt="" width="32" height="32" loading="lazy" decoding="async" />
        </div>
        <div class="social-tile__body">
          <span class="social-tile__label">${social.label}</span>
          <span class="social-tile__handle">${social.handle}</span>
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
    isTikTokBrowser,
    buildTikTokRedirectUrl,
    filterLive,
    renderTile,
    renderGrid,
    loadSocials
  };
})();
