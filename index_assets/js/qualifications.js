(function () {
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const limit = isMobile ? 3 : 6;
  const API_URL = `/api/certifications/list?limit=${limit}`;
  const FALLBACK_URL = `https://www.mas0ng.com/api/certifications/list?limit=${limit}`;

  const grid = document.getElementById('qualification-preview-grid');
  const moreIndicator = document.getElementById('qualification-more');
  const moreText = document.getElementById('qualification-more-text');
  if (!grid) return;

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeSrc(value) {
    const src = String(value || '').trim();
    if (!src) return '/public_assets/site_branding/favicon.svg';
    if (src.startsWith('/') && !src.startsWith('//')) return src;
    try {
      const url = new URL(src);
      if (url.protocol === 'https:' || url.protocol === 'http:') return src;
    } catch {}
    return '/public_assets/site_branding/favicon.svg';
  }

  async function fetchCertifications() {
    try {
      const response = await fetch(API_URL, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return await response.json();
    } catch (error) {
      console.warn('Certifications preview fetch failed, trying absolute fallback:', error);
      try {
        const response = await fetch(FALLBACK_URL, { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return await response.json();
      } catch (fallbackError) {
        console.warn('Certifications fallback fetch failed:', fallbackError);
        return { certifications: [] };
      }
    }
  }

  function render(certifications) {
    if (!certifications.length) {
      grid.innerHTML = '<p class="qualification-empty">Certifications will appear here once they are added to the site API.</p>';
      return;
    }

    grid.innerHTML = certifications.map((cert) => `
      <article class="qualification-card">
        <div class="qualification-card__icon">
          <img src="${safeSrc(cert.icon_url)}" alt="" width="40" height="40" loading="lazy" decoding="async" />
        </div>
        <div class="qualification-card__body">
          <h3>${escapeHtml(cert.name)}</h3>
          <p>${escapeHtml(cert.issuing_organization)}</p>
        </div>
      </article>
    `).join('');
  }

  function renderMoreIndicator(data, shownCount) {
    if (!moreIndicator || !moreText) return;

    const possibleTotal = [data.total, data.total_count]
      .filter((value) => value !== null && value !== undefined && value !== '')
      .map((value) => Number(value))
      .find((value) => Number.isFinite(value) && value >= 0);
    const hasMore = Number.isFinite(possibleTotal)
      ? possibleTotal > shownCount
      : shownCount >= limit;

    if (!hasMore) {
      moreIndicator.hidden = true;
      return;
    }

    moreText.textContent = Number.isFinite(possibleTotal)
      ? `Showing ${shownCount} of ${possibleTotal} certifications`
      : `Showing ${shownCount} certifications — more are available`;
    moreIndicator.hidden = false;
  }

  fetchCertifications().then((data) => {
    const certifications = Array.isArray(data.certifications) ? data.certifications : [];
    render(certifications);
    renderMoreIndicator(data, certifications.length);
  });
})();
