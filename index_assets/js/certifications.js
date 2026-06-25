(function () {
  const API_URL = '/api/certifications/list?range=all';
  const FALLBACK_URL = 'https://www.mas0ng.com/api/certifications/list?range=all';

  const grid = document.getElementById('certification-grid');
  const filters = document.getElementById('certification-filters');
  const count = document.getElementById('certification-count');
  const credentialDialog = document.getElementById('credential-dialog');
  const credentialDialogUrl = document.getElementById('credential-dialog-url');
  const credentialDialogOpen = document.getElementById('credential-dialog-open');
  const credentialDialogClose = document.getElementById('credential-dialog-close');
  const credentialDialogCancel = document.getElementById('credential-dialog-cancel');
  if (!grid || !filters) return;

  let allCertifications = [];
  const selectedTypes = new Set();
  const selectedOrganizations = new Set();

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeHref(value) {
    const href = String(value || '').trim();
    if (!href) return '#';
    try {
      const url = new URL(href);
      if (url.protocol === 'https:' || url.protocol === 'http:') return href;
    } catch {}
    return '#';
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
      console.warn('Certifications fetch failed, trying absolute fallback:', error);
      try {
        const response = await fetch(FALLBACK_URL, { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return await response.json();
      } catch (fallbackError) {
        console.warn('Certifications fallback fetch failed:', fallbackError);
        return { certifications: [], types: [] };
      }
    }
  }

  function typeLabel(type) {
    return type ? String(type).trim() : 'Other';
  }

  function organizationLabel(organization) {
    return organization ? String(organization).trim() : 'Other';
  }

  function keyFor(value) {
    return String(value || '').trim().toLowerCase();
  }

  function filteredCertifications() {
    return allCertifications.filter((cert) => {
      const typeOk = selectedTypes.size === 0 || selectedTypes.has(keyFor(typeLabel(cert.type)));
      const organizationOk = selectedOrganizations.size === 0 || selectedOrganizations.has(keyFor(organizationLabel(cert.issuing_organization)));
      return typeOk && organizationOk;
    });
  }

  function uniqueLabels(values, labeler) {
    const map = new Map();
    values.forEach((value) => {
      const label = labeler(value);
      const key = keyFor(label);
      if (key && !map.has(key)) map.set(key, label);
    });
    return Array.from(map, ([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  function renderFilters(types, organizations) {
    const typeOptions = uniqueLabels(types, typeLabel);
    const organizationOptions = uniqueLabels(organizations, organizationLabel);

    filters.innerHTML = [
      renderFilterDropdown({
        id: 'type',
        label: 'Type',
        allLabel: 'All types',
        options: typeOptions,
        selected: selectedTypes
      }),
      renderFilterDropdown({
        id: 'organization',
        label: 'Issuing organization',
        allLabel: 'All organizations',
        options: organizationOptions,
        selected: selectedOrganizations
      })
    ].join('');

    updateFilterSummaries();
  }

  function renderFilterDropdown({ id, label, allLabel, options, selected }) {
    const menuId = `certification-${id}-menu`;
    const optionsHtml = options.length
      ? options.map((option) => `
        <label class="certification-filter-option">
          <input type="checkbox" data-filter="${id}" value="${escapeHtml(option.key)}"${selected.has(option.key) ? ' checked' : ''} />
          <span class="certification-filter-option__mark" aria-hidden="true"></span>
          <span class="certification-filter-option__text">${escapeHtml(option.label)}</span>
        </label>
      `).join('')
      : '<p class="certification-filter-menu__empty">No options yet</p>';

    return `
      <div class="certification-filter-group" data-filter-group="${id}">
        <button class="certification-filter-toggle" type="button" aria-expanded="false" aria-controls="${menuId}" data-filter-toggle>
          <span class="certification-filter-toggle__label">${escapeHtml(label)}</span>
          <span class="certification-filter-toggle__summary" data-filter-summary>${escapeHtml(allLabel)}</span>
          <svg class="certification-filter-toggle__chevron" width="12" height="8" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="certification-filter-menu" id="${menuId}">
          <div class="certification-filter-menu__options">
            ${optionsHtml}
          </div>
          <button class="certification-filter-clear" type="button" data-filter-clear="${id}">Clear ${escapeHtml(label.toLowerCase())}</button>
        </div>
      </div>
    `;
  }

  function updateFilterSummaries() {
    updateFilterSummary('type', selectedTypes, 'All types');
    updateFilterSummary('organization', selectedOrganizations, 'All organizations');
  }

  function updateFilterSummary(id, selected, allLabel) {
    const group = filters.querySelector(`[data-filter-group="${id}"]`);
    if (!group) return;

    const summary = group.querySelector('[data-filter-summary]');
    const clear = group.querySelector('[data-filter-clear]');
    const options = Array.from(group.querySelectorAll('.certification-filter-option'));
    const selectedLabels = options
      .filter((option) => option.querySelector('input')?.checked)
      .map((option) => option.querySelector('.certification-filter-option__text')?.textContent.trim())
      .filter(Boolean);

    if (summary) {
      summary.textContent = selectedLabels.length === 0
        ? allLabel
        : selectedLabels.length === 1
          ? selectedLabels[0]
          : `${selectedLabels.length} selected`;
    }

    clear?.toggleAttribute('disabled', selected.size === 0);
  }

  function closeFilterMenus(exceptGroup) {
    filters.querySelectorAll('.certification-filter-group').forEach((group) => {
      if (group === exceptGroup) return;
      group.classList.remove('is-open');
      group.querySelector('[data-filter-toggle]')?.setAttribute('aria-expanded', 'false');
    });
  }

  function renderGrid() {
    const certifications = filteredCertifications();
    if (count) {
      count.textContent = `${certifications.length} ${certifications.length === 1 ? 'certification' : 'certifications'}`;
    }

    if (!certifications.length) {
      grid.innerHTML = '<p class="qualification-empty">No certifications match this filter yet.</p>';
      return;
    }

    grid.innerHTML = certifications.map((cert) => {
      const href = safeHref(cert.credential_url);
      const link = href === '#'
        ? '<span class="certification-card__link">Credential pending</span>'
        : `<a class="certification-card__link" href="${href}" data-credential-url="${href}">View credential</a>`;
      const credentialId = cert.credential_id
        ? `<p class="certification-card__meta">Credential ID: ${escapeHtml(cert.credential_id)}</p>`
        : '';

      return `
        <article class="certification-card">
          <div class="certification-card__top">
            <div class="qualification-card__icon">
              <img src="${safeSrc(cert.icon_url)}" alt="" width="44" height="44" loading="lazy" decoding="async" />
            </div>
            <span class="certification-card__type">${escapeHtml(typeLabel(cert.type))}</span>
          </div>
          <div class="certification-card__body">
            <h2>${escapeHtml(cert.name)}</h2>
            <p>${escapeHtml(cert.issuing_organization)}</p>
            ${credentialId}
          </div>
          ${link}
        </article>
      `;
    }).join('');
  }

  filters.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-filter-toggle]');
    if (toggle) {
      const group = toggle.closest('.certification-filter-group');
      if (!group) return;
      const open = !group.classList.contains('is-open');
      closeFilterMenus(group);
      group.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      return;
    }

    const clear = event.target.closest('[data-filter-clear]');
    if (!clear) return;

    const filterId = clear.dataset.filterClear;
    const selected = filterId === 'type' ? selectedTypes : selectedOrganizations;
    selected.clear();
    clear.closest('.certification-filter-group')?.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.checked = false;
    });
    updateFilterSummaries();
    renderGrid();
  });

  filters.addEventListener('change', (event) => {
    const input = event.target.closest('input[type="checkbox"][data-filter]');
    if (!input) return;

    const selected = input.dataset.filter === 'type' ? selectedTypes : selectedOrganizations;
    if (input.checked) {
      selected.add(input.value);
    } else {
      selected.delete(input.value);
    }

    updateFilterSummaries();
    renderGrid();
  });

  document.addEventListener('click', (event) => {
    if (!filters.contains(event.target)) closeFilterMenus();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeFilterMenus();
  });

  grid.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-credential-url]');
    if (!link) return;

    event.preventDefault();
    showCredentialWarning(link.dataset.credentialUrl || link.href);
  });

  credentialDialogClose?.addEventListener('click', closeCredentialWarning);
  credentialDialogCancel?.addEventListener('click', closeCredentialWarning);
  credentialDialog?.addEventListener('click', (event) => {
    if (event.target === credentialDialog) closeCredentialWarning();
  });
  credentialDialogOpen?.addEventListener('click', closeCredentialWarning);

  function showCredentialWarning(url) {
    const href = safeHref(url);
    if (href === '#') return;

    if (!credentialDialog || !credentialDialogUrl || !credentialDialogOpen) {
      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }

    credentialDialogUrl.textContent = href;
    credentialDialogOpen.href = href;
    credentialDialog.showModal();
  }

  function closeCredentialWarning() {
    credentialDialog?.close();
  }

  fetchCertifications().then((data) => {
    allCertifications = Array.isArray(data.certifications) ? data.certifications : [];
    const types = Array.isArray(data.types)
      ? data.types
      : allCertifications.map((cert) => cert.type);
    const organizations = allCertifications.map((cert) => cert.issuing_organization);
    renderFilters(types, organizations);
    renderGrid();
  });
})();
