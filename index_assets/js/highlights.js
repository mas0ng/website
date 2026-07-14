(function () {
  const statsData = {
    likes: 2700000,
    views: 28100000,
    followers: 28700,
    sponsers: [
      "/public_assets/sponsor_icons/topmediai.svg",
      "/public_assets/sponsor_icons/flashloop.png",
      "/public_assets/sponsor_icons/verdent.png",
      "/public_assets/sponsor_icons/supercell.png",
      "/public_assets/sponsor_icons/polybuzz.png",
      "/public_assets/sponsor_icons/hacoo.png",
      "/public_assets/sponsor_icons/dola.png"
    ]
  };

  const HEART_SVG = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  `;

  const EYE_SVG = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  `;

  const USERS_SVG = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  `;

  function formatNumber(n) {
    if (n == null || isNaN(n)) return '—';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
    return n.toLocaleString();
  }

  // Smooth easeOutQuad counter animation
  function animateCount(element, targetValue, durationMs = 1200) {
    if (!element) return;
    const start = 0;
    const startTime = performance.now();
    
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1.0);
      
      const easeProgress = progress * (2 - progress); // easeOutQuad
      const current = Math.floor(start + (targetValue - start) * easeProgress);
      
      element.textContent = formatNumber(current);
      
      if (progress < 1.0) {
        requestAnimationFrame(update);
      } else {
        element.textContent = formatNumber(targetValue);
      }
    }
    
    requestAnimationFrame(update);
  }

  async function init() {
    const data = statsData;
    
    // Render Statistics Grid layout first
    const statsGrid = document.getElementById('stats-grid');
    if (statsGrid) {
      statsGrid.innerHTML = `
        <div class="stat-card">
          <div class="stat-card__icon-wrap" style="color: #60a5fa; background: rgba(96, 165, 250, 0.12);">
            ${EYE_SVG}
          </div>
          <div class="stat-card__body">
            <span class="stat-card__value" id="stat-views-value">0</span>
            <span class="stat-card__label">Views</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon-wrap" style="color: #fb7185; background: rgba(251, 113, 133, 0.12);">
            ${HEART_SVG}
          </div>
          <div class="stat-card__body">
            <span class="stat-card__value" id="stat-likes-value">0</span>
            <span class="stat-card__label">Likes</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon-wrap" style="color: #10b981; background: rgba(16, 185, 129, 0.08);">
            ${USERS_SVG}
          </div>
          <div class="stat-card__body">
            <span class="stat-card__value" id="stat-followers-value">0</span>
            <span class="stat-card__label">Followers</span>
          </div>
        </div>
      `;

      // Set up IntersectionObserver to trigger animations once scrolled into view
      if (!window.IntersectionObserver) {
        // Fallback for browsers without IntersectionObserver support
        statsGrid.classList.add('is-visible');
        animateCount(document.getElementById('stat-views-value'), data.views, 1200);
        animateCount(document.getElementById('stat-likes-value'), data.likes, 1000);
        animateCount(document.getElementById('stat-followers-value'), data.followers, 1400);
      } else {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // Trigger CSS card fade-ins
              statsGrid.classList.add('is-visible');
              
              // Trigger JavaScript count-up animation
              animateCount(document.getElementById('stat-views-value'), data.views, 1200);
              animateCount(document.getElementById('stat-likes-value'), data.likes, 1000);
              animateCount(document.getElementById('stat-followers-value'), data.followers, 1400);
              
              // Disconnect observer so it only triggers once
              observer.unobserve(statsGrid);
            }
          });
        }, {
          threshold: 0.15 // Triggers when 15% of the stats section is in viewport
        });
        
        observer.observe(statsGrid);
      }
    }

    // Render Sponsors Conveyor Carousel
    const carouselContainer = document.getElementById('sponsors-carousel-container');
    const beltTrack = document.getElementById('sponsors-belt-track');
    
    // Support either "sponsers" or "sponsors" key from API response
    const sponsors = data.sponsers || data.sponsors;
    
    if (carouselContainer && beltTrack && sponsors && sponsors.length > 0) {
      // Repeat the logos until we have at least 8 to make the looping belt look continuous
      let list = [...sponsors];
      while (list.length < 8) {
        list = list.concat(sponsors);
      }
      // Double the track list so translation transitions seamlessly
      const doubleList = list.concat(list);
      
      beltTrack.innerHTML = doubleList.map(src => `
        <div class="sponsor-card">
          <img src="${src}" alt="Sponsor Logo" loading="lazy" />
        </div>
      `).join('');
      
      carouselContainer.style.display = 'block';
    } else if (carouselContainer) {
      carouselContainer.style.display = 'none';
    }
  }

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
