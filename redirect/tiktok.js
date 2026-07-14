(function () {
  const allowedHostRoots = [
    'instagram.com',
    'tiktok.com',
    'linkedin.com',
    'snapchat.com',
    'youtube.com',
    'youtu.be',
    'x.com',
    'twitter.com',
    'github.com',
    'discord.com',
    'bsky.app',
    'threads.net'
  ];

  const params = new URLSearchParams(window.location.search);
  const demoMode = params.get('demo') === 'true';
  const service = cleanText(params.get('service'), 'Social profile', 40);
  const username = cleanText(params.get('username'), '', 80);
  const destination = safeDestination(params.get('url'));
  const iconUrl = safeIcon(params.get('iconurl'));

  const title = document.getElementById('redirect-title');
  const usernameEl = document.getElementById('redirect-username');
  const icon = document.getElementById('redirect-icon');
  const copy = document.getElementById('redirect-copy');
  const status = document.getElementById('redirect-status');

  if (!destination) {
    document.body.classList.add('is-invalid');
    title.textContent = 'This link cannot be opened';
    usernameEl.textContent = '';
    icon.closest('.redirect-service__icon-wrap').hidden = true;
    status.textContent = 'The social destination is missing or is not on the approved list.';
    return;
  }

  title.textContent = `Open ${service} in your browser`;
  usernameEl.textContent = username;
  usernameEl.hidden = !username;
  copy.textContent = `TikTok's in-app browser can prevent ${service} from opening correctly.`;
  if (iconUrl) {
    icon.src = iconUrl;
    icon.alt = `${service} icon`;
  } else {
    icon.closest('.redirect-service__icon-wrap').hidden = true;
  }

  const helper = window.MAS0NG_SOCIAL_TILES;
  const inTikTok = helper
    ? helper.isTikTokBrowser()
    : /tiktok|musical_ly|musically|bytedancewebview|com\.zhiliaoapp\.musically/i.test(window.navigator.userAgent);

  if (!inTikTok && !demoMode) {
    status.textContent = `Opening ${service}...`;
    window.location.replace(destination.href);
    return;
  }

  status.textContent = 'After choosing Open in browser, this page will continue automatically.';

  function safeDestination(rawUrl) {
    if (!rawUrl) return null;

    try {
      const parsed = new URL(rawUrl);
      const hostname = parsed.hostname.toLowerCase();
      const allowed = allowedHostRoots.some((root) => hostname === root || hostname.endsWith(`.${root}`));
      return parsed.protocol === 'https:' && allowed ? parsed : null;
    } catch {
      return null;
    }
  }

  function safeIcon(rawUrl) {
    if (!rawUrl) return '';

    try {
      const parsed = new URL(rawUrl, window.location.origin);
      const correctOrigin = parsed.origin === window.location.origin;
      const correctPath = parsed.pathname.startsWith('/public_assets/social_icons/');
      return correctOrigin && correctPath ? parsed.href : '';
    } catch {
      return '';
    }
  }

  function cleanText(value, fallback, maxLength) {
    const text = String(value || fallback).trim();
    return text.slice(0, maxLength);
  }
})();
