(function () {
  const BIO_CONTEXT_VERSION = '1';
  const BIO_PROFILE_SLUG = /^[a-z0-9](?:[a-z0-9_-]{0,30}[a-z0-9])?$/;
  const parameters = new URLSearchParams(window.location.search);

  if (applyBioErrorContext(parameters)) {
    return;
  }

  if (applyGoErrorContext(parameters)) {
    return;
  }

  const suggestion = document.getElementById('dev-page-suggestion');
  const link = document.getElementById('dev-page-suggestion-link');
  const title = document.getElementById('dev-page-suggestion-title');
  const urlLabel = document.getElementById('dev-page-suggestion-url');
  if (!suggestion || !link || !title || !urlLabel) return;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 4500);
  const endpoint = `/search-api/dev-page?path=${encodeURIComponent(window.location.pathname)}`;

  fetch(endpoint, { method: 'GET', credentials: 'same-origin', signal: controller.signal })
    .then((response) => response.ok ? response.json() : null)
    .then((result) => {
      if (!result?.available || typeof result.title !== 'string' || typeof result.url !== 'string') return;
      const target = new URL(result.url);
      if (target.origin !== 'https://dev.mas0ng.com') return;
      title.textContent = result.title;
      urlLabel.textContent = target.href;
      link.href = target.href;
      suggestion.hidden = false;
    })
    .catch(() => undefined)
    .finally(() => window.clearTimeout(timeout));

  function applyBioErrorContext(searchParameters) {
    if (searchParameters.get('source') !== 'bio'
      || searchParameters.get('contextVersion') !== BIO_CONTEXT_VERSION) {
      return false;
    }

    const reason = searchParameters.get('reason');
    if (!['profile_not_found', 'invalid_profile_path'].includes(reason)) {
      return false;
    }

    const profileValue = searchParameters.get('profile') || '';
    const profile = BIO_PROFILE_SLUG.test(profileValue) ? profileValue : '';
    if (reason === 'profile_not_found' && !profile) {
      return false;
    }

    const visualLabel = document.getElementById('error-visual-label');
    const pageTitle = document.getElementById('error-title');
    const lead = document.getElementById('error-lead');
    const primaryAction = document.getElementById('error-primary-action');
    const primaryLabel = document.getElementById('error-primary-label');
    if (!visualLabel || !pageTitle || !lead || !primaryAction || !primaryLabel) {
      return false;
    }

    document.body.dataset.errorSource = 'bio';
    document.title = 'Bio page not found | mas0ng.com';
    visualLabel.textContent = 'Profile unavailable';
    pageTitle.textContent = 'Bio page not found.';
    lead.textContent = profile
      ? `The public bio profile "${profile}" is not available. Check the address or return to mas0ng.com.`
      : 'That bio address is invalid or no longer available. Check the address or return to mas0ng.com.';
    primaryAction.href = '/';
    primaryLabel.textContent = 'mas0ng.com home';
    return true;
  }

  function applyGoErrorContext(searchParameters) {
    if (searchParameters.get('source') !== 'go'
      || searchParameters.get('contextVersion') !== '1') {
      return false;
    }

    const reason = searchParameters.get('reason');
    if (!['short_link_not_found', 'invalid_short_link'].includes(reason)) {
      return false;
    }

    const slugValue = searchParameters.get('slug') || '';
    const slug = /^[a-z0-9](?:[a-z0-9_-]{0,38}[a-z0-9])?$/.test(slugValue) ? slugValue : '';
    if (reason === 'short_link_not_found' && !slug) {
      return false;
    }

    const visualLabel = document.getElementById('error-visual-label');
    const pageTitle = document.getElementById('error-title');
    const lead = document.getElementById('error-lead');
    const primaryAction = document.getElementById('error-primary-action');
    const primaryLabel = document.getElementById('error-primary-label');
    if (!visualLabel || !pageTitle || !lead || !primaryAction || !primaryLabel) {
      return false;
    }

    document.body.dataset.errorSource = 'go';
    document.title = 'Short link not found | mas0ng.com';
    visualLabel.textContent = 'Link unavailable';
    pageTitle.textContent = 'Short link not found.';
    lead.textContent = slug
      ? `The short link "${slug}" is not recognised. Check the address or return to mas0ng.com.`
      : 'That short-link address is invalid. Check the address or return to mas0ng.com.';
    primaryAction.href = '/';
    primaryLabel.textContent = 'mas0ng.com home';
    return true;
  }
})();
