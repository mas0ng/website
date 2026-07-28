(function () {
  const API_URL = 'https://mas0ng.com/unencrypted/api/';

  const HEART_SVG = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  `;

  const EYE_SVG = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  `;

  const USERS_SVG = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  `;

  const SHARE_SVG = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3"></circle>
      <circle cx="6" cy="12" r="3"></circle>
      <circle cx="18" cy="19" r="3"></circle>
      <path d="m8.6 10.5 6.8-4"></path>
      <path d="m8.6 13.5 6.8 4"></path>
    </svg>
  `;

  const PROFILE_SVG = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="9" cy="8" r="4"></circle>
      <path d="M2.5 21a6.5 6.5 0 0 1 13 0"></path>
      <path d="M16 8h6"></path>
      <path d="m19 5 3 3-3 3"></path>
    </svg>
  `;

  const STAT_CARDS = Object.freeze([
    {
      key: 'views',
      label: 'Views',
      meta: 'Last 365 days',
      className: 'stat-card--views',
      color: '#60a5fa',
      background: 'rgba(96, 165, 250, 0.12)',
      icon: EYE_SVG,
      duration: 1200
    },
    {
      key: 'likes',
      label: 'Likes',
      meta: 'Total',
      className: 'stat-card--desktop-only',
      color: '#fb7185',
      background: 'rgba(251, 113, 133, 0.12)',
      icon: HEART_SVG,
      duration: 1000
    },
    {
      key: 'shares',
      label: 'Shares',
      meta: 'Last 365 days',
      className: 'stat-card--desktop-only',
      color: '#c084fc',
      background: 'rgba(192, 132, 252, 0.12)',
      icon: SHARE_SVG,
      duration: 1100
    },
    {
      key: 'profile_views',
      label: 'Profile views',
      meta: 'Last 365 days',
      className: 'stat-card--desktop-only',
      color: '#fbbf24',
      background: 'rgba(251, 191, 36, 0.12)',
      icon: PROFILE_SVG,
      duration: 1100
    },
    {
      key: 'followers',
      label: 'Followers',
      meta: 'Total',
      className: 'stat-card--followers',
      color: '#10b981',
      background: 'rgba(16, 185, 129, 0.08)',
      icon: USERS_SVG,
      duration: 1400
    }
  ]);

  function publicNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? Math.floor(number) : null;
  }

  function formatNumber(value) {
    if (value === null) return '—';
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    return value.toLocaleString();
  }

  function animateCount(element, targetValue, durationMs) {
    if (!element || targetValue === null) {
      if (element) element.textContent = '—';
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      element.textContent = formatNumber(targetValue);
      return;
    }

    const startTime = performance.now();
    function update(currentTime) {
      const progress = Math.min((currentTime - startTime) / durationMs, 1);
      const eased = progress * (2 - progress);
      element.textContent = formatNumber(Math.floor(targetValue * eased));
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = formatNumber(targetValue);
      }
    }
    requestAnimationFrame(update);
  }

  function renderStats(statsGrid, stats) {
    statsGrid.innerHTML = STAT_CARDS.map((card) => `
      <div class="stat-card ${card.className}">
        <div class="stat-card__icon-wrap" style="color: ${card.color}; background: ${card.background};">
          ${card.icon}
        </div>
        <div class="stat-card__body">
          <span class="stat-card__label">${card.label}</span>
          <span class="stat-card__value" data-stat-value="${card.key}">0</span>
          <span class="stat-card__meta">${card.meta}</span>
        </div>
      </div>
    `).join('');

    const startCounters = () => {
      statsGrid.classList.add('is-visible');
      STAT_CARDS.forEach((card) => {
        const element = statsGrid.querySelector(`[data-stat-value="${card.key}"]`);
        animateCount(element, publicNumber(stats[card.key]), card.duration);
      });
    };

    if (!window.IntersectionObserver) {
      startCounters();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      startCounters();
    }, { threshold: 0.15 });
    observer.observe(statsGrid);
  }

  function safeSponsorPath(value) {
    const path = String(value || '').trim();
    return /^\/public_assets\/sponsor_icons\/[A-Za-z0-9._-]+$/.test(path) ? path : '';
  }

  function renderSponsors(sponsors) {
    const carouselContainer = document.getElementById('sponsors-carousel-container');
    const beltTrack = document.getElementById('sponsors-belt-track');
    if (!carouselContainer || !beltTrack) return;

    const safeSponsors = (Array.isArray(sponsors) ? sponsors : [])
      .map(safeSponsorPath)
      .filter(Boolean);
    if (!safeSponsors.length) {
      carouselContainer.style.display = 'none';
      return;
    }

    let list = [...safeSponsors];
    while (list.length < 8) list = list.concat(safeSponsors);
    beltTrack.replaceChildren(...list.concat(list).map((src) => {
      const card = document.createElement('div');
      card.className = 'sponsor-card';
      const image = document.createElement('img');
      image.src = src;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      card.append(image);
      return card;
    }));
    carouselContainer.style.display = 'block';
  }

  async function init() {
    const statsGrid = document.getElementById('stats-grid');
    const summary = document.getElementById('highlights-summary');
    if (!statsGrid) return;

    try {
      const response = await fetch(API_URL, {
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const bot = data?.bOt;
      if (!data?.ok || !bot || typeof bot.stats !== 'object') {
        throw new Error('invalid_public_api_response');
      }

      if (summary && typeof bot.summary === 'string' && bot.summary.trim()) {
        summary.textContent = bot.summary.trim();
      }
      renderStats(statsGrid, bot.stats);
      renderSponsors(bot.sponsors);
    } catch (error) {
      statsGrid.innerHTML = '<p class="qualification-empty">TikTok statistics could not be loaded right now.</p>';
      renderSponsors([]);
      console.warn('Failed to load public homepage statistics:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
