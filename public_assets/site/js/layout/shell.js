(function () {
  const APP_ENCRYPTION_URL = 'https://sharedassets.mas0ng.com/app-encryption.js';
  const script = document.currentScript;
  const active = script?.dataset.active || inferActive();
  const shellMode = script?.dataset.shell || '';
  const footerOnly = script?.dataset.footerOnly !== undefined || shellMode === 'footer-only';

  const urlParams = new URLSearchParams(window.location.search);
  const hideNavValue = (urlParams.get('hideNav') || '').trim().toLowerCase();
  const hideNav = ['true', '1', 'yes'].includes(hideNavValue);
  const page = document.body ? (document.body.dataset.page || 'page') : 'page';
  const isLegalPage = page === 'legal' || /^\/legal(?:\/|$)/.test(window.location.pathname);
  const shellHidden = shellMode === 'none' || (isLegalPage && hideNav);

  if (isLegalPage && hideNav) {
    document.documentElement.setAttribute('data-hide-nav', 'true');
  }

  const d = window.MAS0NG_SITE;
  if (!d) {
    window.MAS0NG_LOADER?.hide?.(true);
    return;
  }

  boot();

  async function boot() {
    try {
      await window.MAS0NG_CACHE?.ready;

      await loadPrivacyNotice(page);

      const publicOnly = window.location.hostname === 'auth.mas0ng.com'
        || script?.dataset.publicOnly !== undefined;

      let authenticated = false;
      if (!publicOnly) {
        authenticated = await fetchSession();
      }

      d.authenticated = authenticated;

      // Always load public page data so content scripts on public pages
      // (like home.js for social cards) work even for logged-in users.
      // The early return below only skips the *public* nav/footer mounting in favor of the
      // shared logged-in navbar.
      const initialHashTarget = resolveHashTarget(window.location.hash);
      if (page === 'error') {
        document.documentElement.setAttribute('data-nav-solid', '');
      }

      await loadSocials();
      d.apps = { public: [], private: [], all: [] };

      if (authenticated) {
        if (!(isLegalPage && hideNav)) {
          await loadScript(d.sharedNavUrl);
        }
        mountShell(active, true);
        initSocialLinkDialog();
        if (isLegalPage && hideNav) {
          updateLegalLinks();
        }
        // Fire the ready event so page content scripts (home.js, etc.) can render
        // things like the social grid using the now-populated d.social.
        document.dispatchEvent(new CustomEvent('mas0ng:shell-ready'));
        return;
      }

      const bootTasks = buildCoreTasks(page);
      if (page === 'home' && initialHashTarget) {
        window.MAS0NG_LOADER.hide(true);
        await window.MAS0NG_LOADER.runQuiet(bootTasks);
      } else {
        await window.MAS0NG_LOADER.runBoot(bootTasks);
      }

      mountShell(active);
      initNav();
      initSocialLinkDialog();
      initScrollState(page);

      if (initialHashTarget) {
        await settleLayout();
        scrollToTarget(initialHashTarget, 'auto');
        document.documentElement.setAttribute('data-nav-solid', '');
        window.dispatchEvent(new Event('scroll'));
      }

      initHashNavigation();

      if (isLegalPage && hideNav) {
        updateLegalLinks();
      }

      window.addEventListener('pageshow', () => window.MAS0NG_LOADER?.hide?.(true));
      document.dispatchEvent(new CustomEvent('mas0ng:shell-ready'));
    } finally {
      window.MAS0NG_LOADER?.hide?.(true);
    }
  }

  function resolveAssetUrl(url) {
    if (typeof d.resolveAssetUrl === 'function') {
      return d.resolveAssetUrl(url);
    }

    if (!url || /^https?:\/\//i.test(url) || url.startsWith('data:')) {
      return url;
    }

    const origin = (d.siteOrigin || window.location.origin).replace(/\/$/, '');
    return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
  }

  async function loadPrivacyNotice(page) {
    if (page === 'app' || (isLegalPage && hideNav)) return;

    try {
      await loadScript(resolveAssetUrl('/public_assets/site/js/lib/privacy-notice.js'));
      window.MAS0NG_PRIVACY_NOTICE?.init();
    } catch (error) {
      console.warn('Failed to load privacy notice:', error);
    }
  }

  async function loadSocials() {
    const url = resolveAssetUrl(d.assets.socialConfig || '/public_assets/configs/socials.json');

    try {
      const response = await fetch(url, { cache: 'default' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      d.social = Array.isArray(data)
        ? data.map((item) => ({ ...item, icon: resolveAssetUrl(item.icon) }))
        : [];
    } catch (error) {
      console.warn('Failed to load social config:', error);
      d.social = [];
    }
  }

  function buildCoreTasks(page) {
    const siteCss = resolveAssetUrl(d.assets.siteCss);
    const etnaWoff2 = resolveAssetUrl(d.assets.etnaWoff2);
    const etnaWoff = resolveAssetUrl(d.assets.etnaWoff);
    const favicon = resolveAssetUrl(d.assets.favicon);

    const tasks = [
      { label: 'Stylesheet', detail: siteCss, run: () => waitForStylesheet(siteCss) },
      {
        label: 'Etna display font',
        detail: etnaWoff2,
        run: () => window.MAS0NG_CACHE.loadFontFace('Etna', [etnaWoff2, etnaWoff])
      },
      { label: 'ABeeZee body font', detail: d.assets.abeeZee, run: () => waitForGoogleFont('ABeeZee') },
      { label: 'Brand favicon', detail: favicon, run: () => window.MAS0NG_CACHE.preloadImage(favicon) }
    ];

    if (page === 'home' || page === 'bio') {
      liveSocials().forEach((item) => {
        tasks.push({
          label: `${item.label} icon`,
          detail: item.icon,
          run: () => window.MAS0NG_CACHE.preloadImage(item.icon)
        });
      });
    }

    if (page === 'home' || page === 'apps') {
      (d.apps?.public || []).forEach((item) => {
        tasks.push({
          label: `${item.name} icon`,
          detail: item.icon,
          run: () => window.MAS0NG_CACHE.preloadImage(item.icon)
        });
      });
    }

    return tasks;
  }

  async function fetchSession() {
    try {
      if (typeof window.MAS0NG_APP_ENCRYPTION?.secureFetch !== 'function') {
        await loadScript(APP_ENCRYPTION_URL);
      }

      const secureFetch = window.MAS0NG_APP_ENCRYPTION?.secureFetch;
      if (typeof secureFetch !== 'function') {
        throw new Error('app_encryption_unavailable');
      }

      const response = await secureFetch('https://auth.mas0ng.com/session', {
        credentials: 'include',
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      });
      const data = await response.json().catch(() => ({}));
      return response.ok && data.authenticated === true;
    } catch {
      return false;
    }
  }

  function scriptIsReady(script) {
    if (!script) return false;
    if (script.dataset.loaded === 'true') return true;

    const readyState = script.readyState;
    if (readyState === 'complete' || readyState === 'loaded') {
      script.dataset.loaded = 'true';
      return true;
    }

    return false;
  }

  function loadScript(src) {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (scriptIsReady(existing)) {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        const finish = () => {
          existing.dataset.loaded = 'true';
          resolve();
        };

        existing.addEventListener('load', finish, { once: true });
        existing.addEventListener('error', reject, { once: true });
        window.setTimeout(() => {
          if (scriptIsReady(existing)) finish();
        }, 0);
      });
    }

    return new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = src;
      el.async = true;
      el.addEventListener('load', () => {
        el.dataset.loaded = 'true';
        resolve();
      }, { once: true });
      el.addEventListener('error', reject, { once: true });
      document.head.append(el);
    });
  }

  function liveSocials() {
    return d.social.filter((item) => item.href && item.href !== '#');
  }

  function initSocialLinkDialog() {
    const desktopPointer = window.matchMedia('(min-width: 734px) and (hover: hover) and (pointer: fine)');
    const dialog = document.createElement('dialog');
    let sourceLink = null;

    dialog.className = 'social-dialog';
    dialog.setAttribute('aria-labelledby', 'social-dialog-title');
    dialog.innerHTML = `
      <div class="social-dialog__panel">
        <button class="social-dialog__close" type="button" aria-label="Close social link dialog">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <div class="social-dialog__heading">
          <img class="social-dialog__icon" alt="" width="44" height="44">
          <div>
            <p class="social-dialog__kicker">Continue on your phone</p>
            <h2 class="social-dialog__title" id="social-dialog-title"></h2>
          </div>
        </div>
        <div class="social-dialog__qr-wrap">
          <canvas class="social-dialog__qr" role="img"></canvas>
          <p class="social-dialog__status" aria-live="polite">Creating QR code...</p>
        </div>
        <p class="social-dialog__copy"></p>
        <p class="social-dialog__notice"></p>
        <div class="social-dialog__divider" aria-hidden="true"><span>or</span></div>
        <a class="social-dialog__open" target="_blank" rel="noopener noreferrer"></a>
      </div>
    `;
    document.body.append(dialog);

    const closeButton = dialog.querySelector('.social-dialog__close');
    const icon = dialog.querySelector('.social-dialog__icon');
    const title = dialog.querySelector('.social-dialog__title');
    const canvas = dialog.querySelector('.social-dialog__qr');
    const status = dialog.querySelector('.social-dialog__status');
    const copy = dialog.querySelector('.social-dialog__copy');
    const thirdPartyNotice = dialog.querySelector('.social-dialog__notice');
    const openLink = dialog.querySelector('.social-dialog__open');

    closeButton.addEventListener('click', () => dialog.close());
    desktopPointer.addEventListener('change', () => {
      if (!desktopPointer.matches && dialog.open) dialog.close();
    });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('social-dialog-open');
      sourceLink?.focus({ preventScroll: true });
      sourceLink = null;
    });

    document.addEventListener('click', async (event) => {
      const link = event.target.closest('.social-tile, .footer__social-link');
      if (!link || event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const href = link.href;
      if (!href) return;

      const social = liveSocials().find((item) => {
        try {
          return new URL(item.href, window.location.href).href === href;
        } catch {
          return item.href === link.getAttribute('href');
        }
      });
      if (!social) return;

      if (window.MAS0NG_SOCIAL_TILES?.isTikTokBrowser()) {
        event.preventDefault();
        window.location.assign(window.MAS0NG_SOCIAL_TILES.buildTikTokRedirectUrl(social));
        return;
      }

      if (!desktopPointer.matches) return;

      event.preventDefault();
      sourceLink = link;
      icon.src = social.icon;
      title.textContent = social.label;
      canvas.setAttribute('aria-label', `QR code for ${social.label}`);
      copy.textContent = `Scan with your phone to open ${social.label}.`;
      thirdPartyNotice.textContent = `${social.label} is not operated by us. Its privacy policy and terms of service may differ from ours.`;
      openLink.href = href;
      openLink.textContent = `Open ${social.label} in a new tab`;
      status.textContent = 'Creating QR code...';
      status.hidden = false;
      canvas.hidden = true;
      document.body.classList.add('social-dialog-open');
      dialog.showModal();

      try {
        if (!window.QRCode) {
          await loadScript(resolveAssetUrl('/public_assets/site/js/lib/qrcode.min.js'));
        }
        await window.QRCode.toCanvas(canvas, href, {
          width: 220,
          margin: 2,
          errorCorrectionLevel: 'M',
          color: { dark: '#07111fff', light: '#ffffffff' }
        });
        canvas.hidden = false;
        status.hidden = true;
      } catch (error) {
        status.textContent = 'The QR code could not be created. You can still use the button below.';
        console.warn('Failed to create social QR code:', error);
      }
    });
  }

  function mountShell(activeId, skipNav = false) {
    const main = document.getElementById('site-main');
    if (!main || document.getElementById('site-nav')) return;

    const navLinks = d.nav;
    const mobileActiveId = inferActive();
    const mobileNavLinks = navLinks.filter((item) => item.id !== 'dev');
    if (!mobileNavLinks.some((item) => item.id === 'bio')) {
      mobileNavLinks.push({ id: 'bio', label: 'Bio', href: '/bio.html' });
    }
    const mobileLegalLinks = [
      { ...d.legal.find((item) => item.id === 'privacy'), label: 'Privacy Policy' },
      { ...d.legal.find((item) => item.id === 'legal'), label: 'All Policies' }
    ].filter((item) => item.id && item.href);

    const esc = window.MAS0NG_HTML || { escapeHtml: (v) => String(v), safeHref: (v) => String(v || '#') };

    const navItems = navLinks.map((item) => {
      const isActive = item.id === activeId ? ' is-active' : '';
      const current = item.id === activeId ? ' aria-current="page"' : '';
      return `<a class="nav__item${isActive}" href="${esc.safeHref(item.href)}"${current}>${esc.escapeHtml(item.label)}</a>`;
    }).join('');

    const legalMenu = d.legal.map((item) =>
      `<a class="nav__menu-item" href="${esc.safeHref(item.href)}" role="menuitem">${esc.escapeHtml(item.label)}</a>`
    ).join('');

    const drawerLegal = `
      <p class="nav__drawer-label">Legal</p>
      ${mobileLegalLinks.map((item) => {
        const current = item.id === mobileActiveId ? ' aria-current="page"' : '';
        return `<a class="nav__drawer-link" href="${esc.safeHref(item.href)}"${current}>${esc.escapeHtml(item.label)}</a>`;
      }).join('')}
    `;

    const footerLegal = d.legal.map((item) =>
      `<li><a href="${esc.safeHref(item.href)}">${esc.escapeHtml(item.label)}</a></li>`
    ).join('');

    const footerSite = d.nav.filter((item) => item.id !== 'dev').map((item) =>
      `<li><a href="${esc.safeHref(item.href)}">${esc.escapeHtml(item.label)}</a></li>`
    ).join('');

    const footerSocial = liveSocials().map((item) => `
      <li>
        <a class="footer__social-link" href="${esc.safeHref(item.href)}" target="_blank" rel="noopener noreferrer" title="${esc.escapeHtml(item.label)}">
          <img src="${esc.safeHref(item.icon)}" alt="" width="20" height="20" loading="lazy" decoding="async" />
          <span class="footer__social-label">${esc.escapeHtml(item.label)}</span>
        </a>
      </li>
    `).join('');

    const footerSocialCol = footerSocial
      ? `<div class="footer__col">
            <h3>Social</h3>
            <ul class="footer__social-list">${footerSocial}</ul>
          </div>`
      : '';

    const siteRoot = d.siteOrigin || '';
    const nav = document.createElement('header');
    nav.className = 'nav';
    nav.id = 'site-nav';
    nav.setAttribute('aria-label', 'Primary');
    nav.innerHTML = `
      <div class="nav__inner">
        <a class="nav__brand" href="${siteRoot}/">${d.siteName}</a>
        <div class="nav__cluster" role="navigation" aria-label="Sections">
          ${navItems}
          <div class="nav__dropdown" id="nav-legal-dropdown">
            <button class="nav__item nav__item--btn${activeId === 'legal' ? ' is-active' : ''}" type="button" aria-expanded="false" aria-controls="nav-legal-menu" id="nav-legal-btn">
              Legal
              <svg class="nav__chevron" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
            </button>
            <div class="nav__menu" id="nav-legal-menu" role="menu">${legalMenu}</div>
          </div>
        </div>
        <div class="nav__end">
          <a class="nav__login${activeId === 'login' ? ' is-active' : ''}" id="nav-login" href="${d.loginUrl}"${activeId === 'login' ? ' aria-current="page"' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
            Log in
          </a>
          <button class="nav__toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="nav-drawer" id="nav-toggle">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><path d="M1 4h16v1.2H1zm0 4.4h16v1.2H1zM1 13h16v1.2H1z"/></svg>
          </button>
        </div>
      </div>
      <button class="nav__drawer-backdrop" id="nav-drawer-backdrop" type="button" aria-label="Close menu" tabindex="-1"></button>
      <nav class="nav__drawer" id="nav-drawer" aria-label="Mobile" aria-hidden="true" tabindex="-1">
        <div class="nav__drawer-head">
          <button class="nav__drawer-close" id="nav-drawer-close" type="button" aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        ${mobileNavLinks.map((item) => {
          const current = item.id === mobileActiveId ? ' aria-current="page"' : '';
          return `<a class="nav__drawer-link" href="${esc.safeHref(item.href)}"${current}>${esc.escapeHtml(item.label)}</a>`;
        }).join('')}
        <div class="nav__drawer-group" id="nav-drawer-legal">${drawerLegal}</div>
        <div class="nav__drawer-actions">
          <a class="nav__drawer-report" href="${siteRoot}/legal/security.html?reportModalPopup=true">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="M12 8v4M12 16h.01"/></svg>
            Report a security concern
          </a>
          <a class="nav__drawer-login${activeId === 'login' ? ' is-active' : ''}" id="nav-login-drawer" href="${esc.safeHref(d.loginUrl)}"${activeId === 'login' ? ' aria-current="page"' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
            Log in
          </a>
        </div>
      </nav>
    `;

    const footer = document.createElement('footer');
    footer.className = 'footer';
    footer.id = 'site-footer';
    footer.innerHTML = `
      <div class="footer__inner">
        <p class="footer__copy">Copyright © ${new Date().getFullYear()} ${d.siteName}. All rights reserved.</p>
        <div class="footer__cols">
          <div class="footer__col">
            <h3>Site</h3>
            <ul>
              ${footerSite}
              <li class="footer__security-report"><a href="${siteRoot}/legal/security.html?reportModalPopup=true">Report a security concern</a></li>
              <li><a id="footer-login" href="${esc.safeHref(d.loginUrl)}">Log in</a></li>
            </ul>
          </div>
          <div class="footer__col">
            <h3>Legal</h3>
            <ul>${footerLegal}</ul>
          </div>
          ${footerSocialCol}
          <div class="footer__col">
            <h3>Contact</h3>
            <ul>
              <li><a href="mailto:mason@mas0ng.com">mason@mas0ng.com</a></li>
            </ul>
          </div>
        </div>
      </div>
    `;

    if (!footerOnly && !shellHidden && !skipNav) {
      const page = document.body.dataset.page || 'page';
      const masthead = page === 'home'
        ? (window.MAS0NG_NAV_SCROLL?.findHero?.(main) || main.querySelector('.masthead'))
        : page === 'auth'
          ? main.querySelector('.worker-masthead')
          : page === 'legal' || page === 'apps'
            ? main.querySelector('.legal-hero')
            : page === 'certifications'
              ? main.querySelector('.certifications-hero')
              : null;

      if (masthead) {
        masthead.prepend(nav);
      } else {
        main.before(nav);
        document.documentElement.setAttribute('data-nav-solid', '');
      }
    }
    if (!shellHidden) {
      main.append(footer);
    }
  }

  function initNav() {
    const drawer = document.getElementById('nav-drawer');
    const toggle = document.getElementById('nav-toggle');
    const drawerClose = document.getElementById('nav-drawer-close');
    const drawerBackdrop = document.getElementById('nav-drawer-backdrop');
    const legalBtn = document.getElementById('nav-legal-btn');
    const legalDropdown = document.getElementById('nav-legal-dropdown');
    const appsBtn = document.getElementById('nav-apps-btn');
    const appsDropdown = document.getElementById('nav-apps-dropdown');
    if (!drawer || !toggle || !legalBtn || !legalDropdown) return;

    function closeDrawer() {
      drawer.classList.remove('is-open');
      drawerBackdrop?.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    }

    function closeLegalMenu() {
      legalDropdown.classList.remove('is-open');
      legalBtn.setAttribute('aria-expanded', 'false');
    }

    function closeAppsMenu() {
      if (!appsDropdown || !appsBtn) return;
      appsDropdown.classList.remove('is-open');
      appsBtn.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', () => {
      const open = drawer.classList.toggle('is-open');
      drawerBackdrop?.classList.toggle('is-open', open);
      drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('menu-open', open);
      if (open) {
        closeLegalMenu();
        closeAppsMenu();
        window.setTimeout(() => drawerClose?.focus({ preventScroll: true }), 0);
      }
    });

    drawerClose?.addEventListener('click', () => {
      closeDrawer();
      toggle.focus({ preventScroll: true });
    });
    drawerBackdrop?.addEventListener('click', closeDrawer);

    legalBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = legalDropdown.classList.toggle('is-open');
      legalBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) closeAppsMenu();
    });

    appsBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = appsDropdown.classList.toggle('is-open');
      appsBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) closeLegalMenu();
    });

    document.addEventListener('click', (e) => {
      if (!legalDropdown.contains(e.target)) closeLegalMenu();
      if (appsDropdown && !appsDropdown.contains(e.target)) closeAppsMenu();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDrawer();
        closeLegalMenu();
        closeAppsMenu();
      }
    });

    drawer.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeDrawer));

    document.querySelectorAll('#site-nav a[href], #nav-drawer a[href]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('mailto:') || link.target === '_blank') return;
        if (isSamePageNavigation(href)) return;
        if (link.origin && link.origin !== window.location.origin) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        window.MAS0NG_LOADER?.show?.();
      });
    });
  }

  function normalizePath(pathname) {
    const path = pathname || '/';
    if (path.endsWith('/index.html')) {
      return path.slice(0, -'/index.html'.length) || '/';
    }
    return path;
  }

  function isSamePageNavigation(href) {
    if (href.startsWith('#')) return true;

    try {
      const target = new URL(href, window.location.href);
      const current = new URL(window.location.href);
      if (target.origin !== current.origin) return false;
      return normalizePath(target.pathname) === normalizePath(current.pathname);
    } catch {
      return false;
    }
  }

  const NAV_H = 64;
  const NAV_SCROLL_OFFSET = NAV_H + 16;

  function scrollToTarget(el, behavior = 'smooth') {
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - NAV_SCROLL_OFFSET;
    window.scrollTo({ top: Math.max(0, y), behavior });
  }

  function initScrollState(page) {
    let ticking = false;
    let update = () => {};

    if (page === 'home') {
      const masthead = document.getElementById('masthead');
      if (!masthead) return;

      const morphRange = () => Math.max(1, window.innerHeight - NAV_H);

      let navSolid = false;

      update = () => {
        ticking = false;
        const y = window.scrollY;
        const range = morphRange();
        const morph = y <= 1 ? 0 : Math.min(1, Math.max(0, y / range));
        const nextNavSolid = window.MAS0NG_NAV_SCROLL?.heroNavSolid(masthead) ?? false;

        document.documentElement.style.setProperty('--morph', morph.toFixed(4));
        if (nextNavSolid !== navSolid) {
          navSolid = nextNavSolid;
          document.documentElement.toggleAttribute('data-nav-solid', navSolid);
        }
        masthead.classList.toggle('is-compact', morph > 0.88);
      };

      document.getElementById('scroll-hint')?.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToTarget(document.getElementById('certifications'));
      });
    } else if (page === 'legal' || page === 'apps' || page === 'certifications') {
      const hero = document.querySelector('.legal-hero, .certifications-hero');
      if (!hero) return;

      update = () => {
        ticking = false;
        document.documentElement.toggleAttribute(
          'data-nav-solid',
          window.MAS0NG_NAV_SCROLL?.heroNavSolid(hero) ?? window.scrollY > 1
        );
      };
    } else if (page === 'auth') {
      const hero = document.querySelector('.worker-masthead');
      if (!hero) return;

      let navSolid = false;

      update = () => {
        ticking = false;
        const nextNavSolid = window.MAS0NG_NAV_SCROLL?.heroNavSolid(hero) ?? window.scrollY > 8;
        if (nextNavSolid !== navSolid) {
          navSolid = nextNavSolid;
          document.documentElement.toggleAttribute('data-nav-solid', navSolid);
        }
      };
    } else {
      return;
    }

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update, { passive: true });
  }

  function initHashNavigation() {
    const isHome = window.location.pathname === '/' || window.location.pathname.endsWith('/index.html');
    const hashTargets = {
      certifications: ['#certifications', '/#certifications']
    };

    if (document.getElementById('apps')) {
      hashTargets.apps = ['#apps', '/#apps'];
    }

    document.addEventListener('click', (e) => {
      if (!isHome) return;

      for (const [id, hrefs] of Object.entries(hashTargets)) {
        const link = hrefs.map((href) => `a[href="${href}"]`).join(', ');
        const target = e.target.closest(link);
        if (!target) continue;

        e.preventDefault();
        window.MAS0NG_LOADER?.hide?.();
        scrollToTarget(document.getElementById(id));
        history.pushState(null, '', `#${id}`);
        return;
      }
    });
  }

  function resolveHashTarget(hash) {
    if (!hash || hash === '#') return null;
    try {
      return document.querySelector(hash);
    } catch {
      return null;
    }
  }

  function settleLayout() {
    return new Promise((resolve) => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(resolve);
      });
    });
  }

  function waitForStylesheet(href) {
    return new Promise((resolve, reject) => {
      const loaded = Array.from(document.styleSheets).some((sheet) => {
        try {
          return sheet.href && sheet.href.includes(href);
        } catch {
          return false;
        }
      });
      if (loaded) {
        resolve();
        return;
      }

      const el = document.querySelector(`link[rel="stylesheet"][href="${href}"]`);
      if (!el) {
        resolve();
        return;
      }
      if (el.sheet) {
        resolve();
        return;
      }
      el.addEventListener('load', () => resolve(), { once: true });
      el.addEventListener('error', () => reject(new Error(`Failed to load ${href}`)), { once: true });
    });
  }

  function waitForGoogleFont(family) {
    const link = document.querySelector('link[href*="fonts.googleapis.com"]');
    const loaded = link
      ? (link.sheet ? Promise.resolve() : new Promise((resolve, reject) => {
          link.addEventListener('load', resolve, { once: true });
          link.addEventListener('error', reject, { once: true });
        }))
      : Promise.resolve();

    return loaded.then(() => {
      if (!document.fonts?.load) return undefined;
      return document.fonts.load(`16px "${family}"`).catch(() => undefined);
    });
  }

  function updateLegalLinks() {
    document.querySelectorAll('a').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;
      if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:') || href.startsWith('#')) {
        return;
      }

      link.setAttribute('target', '_blank');

      const rels = link.getAttribute('rel') ? link.getAttribute('rel').split(/\s+/) : [];
      if (!rels.includes('noopener')) rels.push('noopener');
      if (!rels.includes('noreferrer')) rels.push('noreferrer');
      link.setAttribute('rel', rels.join(' '));

      try {
        const url = new URL(href, window.location.href);
        if (url.origin === window.location.origin && url.pathname.startsWith('/legal')) {
          url.searchParams.set('hideNav', 'true');
          link.setAttribute('href', url.pathname + url.search + url.hash);
        }
      } catch (e) {
        if (href.startsWith('/') || href.startsWith('../') || href.startsWith('./') || href.startsWith('legal')) {
          if (href.includes('/legal') || window.location.pathname.includes('/legal')) {
            const hashIndex = href.indexOf('#');
            let pathAndSearch = hashIndex === -1 ? href : href.slice(0, hashIndex);
            const hash = hashIndex === -1 ? '' : href.slice(hashIndex);

            if (pathAndSearch.includes('?')) {
              if (!pathAndSearch.includes('hideNav=')) {
                pathAndSearch += '&hideNav=true';
              }
            } else {
              pathAndSearch += '?hideNav=true';
            }
            link.setAttribute('href', pathAndSearch + hash);
          }
        }
      }
    });
  }

  function inferActive() {
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html') return 'home';
    if (path.endsWith('/certifications.html')) return 'certifications';
    if (path.endsWith('/bio.html')) return 'bio';
    if (path.startsWith('/legal/privacy')) return 'privacy';
    if (path.startsWith('/legal')) return 'legal';
    return 'page';
  }
})();
