window.MAS0NG_SOCIAL_TILES = (function () {
  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeAssetPath(value) {
    const path = String(value || '').trim();
    const fallback = '/public_assets/site_branding/favicon/blue.svg';
    const isSocialIconPath = (pathname) => /^\/public_assets\/social_icons\/[A-Za-z0-9._-]+\.(?:svg|png|jpe?g|webp)$/i.test(pathname);

    if (path.startsWith('/') && !path.startsWith('//')) {
      return isSocialIconPath(path) ? path : fallback;
    }

    try {
      const url = new URL(path);
      const localOrigin = window.location?.origin || '';
      const approvedOrigin = ['https://mas0ng.com', 'https://www.mas0ng.com'].includes(url.origin)
        || (localOrigin && localOrigin !== 'null' && url.origin === localOrigin);
      return approvedOrigin && !url.search && !url.hash && isSocialIconPath(url.pathname)
        ? url.href
        : fallback;
    } catch {
      return fallback;
    }
  }

  function isPending(href) {
    return !href || href === '#';
  }

  function isTikTokBrowser(userAgent) {
    const ua = String(userAgent || window.navigator.userAgent || '').toLowerCase();
    return /tiktok|musical_ly|musically|bytedancewebview|com\.zhiliaoapp\.musically/.test(ua);
  }

  function isInstagramBrowser(userAgent) {
    const ua = String(userAgent || window.navigator.userAgent || '').toLowerCase();
    return /instagram/.test(ua);
  }

  function isSocialInAppBrowser(userAgent) {
    return isTikTokBrowser(userAgent) || isInstagramBrowser(userAgent);
  }

  function socialIdentity(social) {
    const site = String(social?.id || '').trim().toLowerCase();
    let url;
    try {
      url = new URL(social?.href || '');
    } catch {
      return null;
    }
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    let parts;
    try {
      parts = url.pathname.split('/').filter(Boolean).map((part) => decodeURIComponent(part));
    } catch {
      return null;
    }
    let username = '';

    if (site === 'instagram' && host === 'instagram.com' && parts.length === 1) username = parts[0];
    if (site === 'tiktok' && host === 'tiktok.com' && parts.length === 1 && parts[0].startsWith('@')) username = parts[0].slice(1);
    if (site === 'snapchat' && host === 'snapchat.com' && parts.length === 2 && parts[0] === 'add') username = parts[1];
    if (site === 'github' && host === 'github.com' && parts.length === 1) username = parts[0];
    if (site === 'linkedin' && host === 'linkedin.com' && parts.length === 2 && parts[0] === 'in') username = parts[1];
    if (site === 'youtube' && host === 'youtube.com' && parts.length === 1 && parts[0].startsWith('@')) username = parts[0].slice(1);
    if (site === 'x' && host === 'x.com' && parts.length === 1) username = parts[0];
    if (site === 'threads' && host === 'threads.net' && parts.length === 1 && parts[0].startsWith('@')) username = parts[0].slice(1);
    if (site === 'bluesky' && host === 'bsky.app' && parts.length === 2 && parts[0] === 'profile') username = parts[1];
    if (site === 'discord' && host === 'discord.com' && parts.length === 2 && parts[0] === 'users') username = parts[1];

    return username ? { site, username } : null;
  }

  function buildSocialRedirectUrl(social) {
    const identity = socialIdentity(social);
    if (!identity) return '';
    const params = new URLSearchParams({
      site: identity.site,
      username: identity.username
    });
    return `/redirect/tiktok.html?${params.toString()}`;
  }

  function filterLive(socials) {
    return (socials || []).filter((social) => !isPending(social.href) && socialIdentity(social));
  }

  function renderTile(social) {
    const redirectUrl = buildSocialRedirectUrl(social);
    const useHandoff = isSocialInAppBrowser() && redirectUrl;
    const href = useHandoff ? redirectUrl : social.href;
    const target = useHandoff ? '_self' : '_blank';
    return `
      <a class="social-tile social-tile--${escapeHtml(social.id)}" href="${escapeHtml(href)}" target="${target}" rel="noopener noreferrer">
        <div class="social-tile__glow" aria-hidden="true"></div>
        <div class="social-tile__icon-wrap">
          <img src="${escapeHtml(safeAssetPath(social.icon))}" alt="" width="32" height="32" loading="lazy" decoding="async" />
        </div>
        <div class="social-tile__body">
          <span class="social-tile__label">${escapeHtml(social.label)}</span>
          <span class="social-tile__handle">${escapeHtml(social.handle)}</span>
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
    const response = await fetch(url || 'https://mas0ng.com/unencrypted/api/social-links?v=20260728-social-icons1', { cache: 'default' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return Array.isArray(data)
      ? data
      : Array.isArray(data?.social_links)
        ? data.social_links
        : [];
  }

  return {
    isPending,
    isTikTokBrowser,
    isInstagramBrowser,
    isSocialInAppBrowser,
    socialIdentity,
    buildSocialRedirectUrl,
    buildTikTokRedirectUrl: buildSocialRedirectUrl,
    filterLive,
    renderTile,
    renderGrid,
    loadSocials
  };
})();
