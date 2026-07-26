(function () {
  const providers = Object.freeze({
    instagram: {
      label: 'Instagram',
      icon: '/public_assets/social_icons/instagram.svg',
      pattern: /^[A-Za-z0-9._]{1,30}$/,
      url: (username) => `https://www.instagram.com/${encodeURIComponent(username)}/`
    },
    tiktok: {
      label: 'TikTok',
      icon: '/public_assets/social_icons/tiktok.svg',
      pattern: /^[A-Za-z0-9._]{2,24}$/,
      url: (username) => `https://www.tiktok.com/@${encodeURIComponent(username)}`
    },
    snapchat: {
      label: 'Snapchat',
      icon: '/public_assets/social_icons/snapchat.svg',
      pattern: /^[A-Za-z0-9._-]{3,30}$/,
      url: (username) => `https://www.snapchat.com/add/${encodeURIComponent(username)}`
    },
    github: {
      label: 'GitHub',
      icon: '/public_assets/social_icons/github.svg',
      pattern: /^(?=.{1,39}$)[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/,
      url: (username) => `https://github.com/${encodeURIComponent(username)}`
    },
    linkedin: {
      label: 'LinkedIn',
      icon: '/public_assets/social_icons/linkedin.svg',
      pattern: /^[A-Za-z0-9-]{3,100}$/,
      url: (username) => `https://www.linkedin.com/in/${encodeURIComponent(username)}/`
    },
    youtube: {
      label: 'YouTube',
      icon: '/public_assets/social_icons/youtube.svg',
      pattern: /^[A-Za-z0-9._-]{3,30}$/,
      url: (username) => `https://www.youtube.com/@${encodeURIComponent(username)}`
    },
    x: {
      label: 'X',
      icon: '/public_assets/social_icons/x.svg',
      pattern: /^[A-Za-z0-9_]{1,15}$/,
      url: (username) => `https://x.com/${encodeURIComponent(username)}`
    },
    threads: {
      label: 'Threads',
      icon: '/public_assets/social_icons/threads.svg',
      pattern: /^[A-Za-z0-9._]{1,30}$/,
      url: (username) => `https://www.threads.net/@${encodeURIComponent(username)}`
    },
    bluesky: {
      label: 'Bluesky',
      icon: '/public_assets/social_icons/bluesky.svg',
      pattern: /^(?=.{3,253}$)[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/,
      url: (username) => `https://bsky.app/profile/${encodeURIComponent(username)}`
    },
    discord: {
      label: 'Discord',
      icon: '/public_assets/social_icons/discord.svg',
      pattern: /^\d{17,20}$/,
      url: (username) => `https://discord.com/users/${username}`
    }
  });

  const params = new URLSearchParams(window.location.search);
  const demoMode = params.get('demo') === 'true';
  const site = String(params.get('site') || '').trim().toLowerCase();
  const provider = providers[site];
  const username = cleanUsername(params.get('username'));
  const destination = provider && provider.pattern.test(username) ? new URL(provider.url(username)) : null;

  const title = document.getElementById('redirect-title');
  const usernameEl = document.getElementById('redirect-username');
  const icon = document.getElementById('redirect-icon');
  const copy = document.getElementById('redirect-copy');
  const status = document.getElementById('redirect-status');
  const kicker = document.getElementById('redirect-kicker');

  if (!destination) {
    document.body.classList.add('is-invalid');
    title.textContent = 'This social profile cannot be opened';
    usernameEl.textContent = '';
    icon.closest('.redirect-service__icon-wrap').hidden = true;
    status.textContent = 'The provider or username is missing, invalid, or unsupported.';
    return;
  }

  const helper = window.MAS0NG_SOCIAL_TILES;
  const inTikTok = helper ? helper.isTikTokBrowser() : isTikTokBrowser();
  const inInstagram = helper ? helper.isInstagramBrowser() : isInstagramBrowser();
  const inSocialBrowser = inTikTok || inInstagram;
  const browserName = inInstagram ? 'Instagram' : inTikTok ? 'TikTok' : 'the in-app browser';

  kicker.textContent = `Leaving ${browserName}`;
  title.textContent = `Open ${provider.label} in your browser`;
  usernameEl.textContent = site === 'discord' ? 'Discord profile' : `@${username}`;
  copy.textContent = `${browserName}'s built-in browser can prevent ${provider.label} from opening correctly.`;
  icon.src = provider.icon;
  icon.alt = `${provider.label} icon`;

  if (!inSocialBrowser && !demoMode) {
    status.textContent = `Opening ${provider.label}…`;
    window.location.replace(destination.href);
    return;
  }

  status.textContent = 'After choosing Open in browser, this page will continue automatically.';

  function cleanUsername(value) {
    return String(value || '').trim().replace(/^@/, '').slice(0, 253);
  }

  function isTikTokBrowser() {
    return /tiktok|musical_ly|musically|bytedancewebview|com\.zhiliaoapp\.musically/i.test(window.navigator.userAgent);
  }

  function isInstagramBrowser() {
    return /instagram/i.test(window.navigator.userAgent);
  }
})();
