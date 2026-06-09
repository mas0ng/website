(function () {
  const script = document.currentScript;
  const active = script?.dataset.active || inferActive();
  const footerOnly = script?.dataset.footerOnly !== undefined
    || document.body.dataset.page === 'bio';
  const d = window.MAS0NG_SITE;
  if (!d) return;

  boot();

  async function boot() {
    const publicOnly = window.location.hostname === 'auth.mas0ng.com'
      || script?.dataset.publicOnly !== undefined;

    if (!publicOnly && await loadSharedNavbarIfLoggedIn()) {
      return;
    }

    const page = document.body.dataset.page || 'page';
    const initialHashTarget = resolveHashTarget(window.location.hash);
    if (page === 'error') {
      document.documentElement.setAttribute('data-nav-solid', '');
    }

    await loadSocials();
    await loadApps();

    const bootTasks = buildCoreTasks(page);
    if (page === 'home' && initialHashTarget) {
      window.MAS0NG_LOADER.hide(true);
      await window.MAS0NG_LOADER.runQuiet(bootTasks);
    } else {
      await window.MAS0NG_LOADER.runBoot(bootTasks);
    }

    mountShell(active);
    initNav();
    initScrollState(page);

    if (initialHashTarget) {
      await settleLayout();
      scrollToTarget(initialHashTarget, 'auto');
      document.documentElement.setAttribute('data-nav-solid', '');
      window.dispatchEvent(new Event('scroll'));
    }

    initHashNavigation();
    window.addEventListener('pageshow', () => window.MAS0NG_LOADER?.hide?.());
    document.dispatchEvent(new CustomEvent('mas0ng:shell-ready'));
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

  async function loadApps() {
    if (!window.MAS0NG_APP_TILES) {
      d.apps = { public: [], private: [], all: [] };
      return;
    }

    const url = resolveAssetUrl(d.assets.appsConfig || '/public_assets/configs/apps.json');

    try {
      d.apps = await window.MAS0NG_APP_TILES.loadApps(url, d.siteOrigin || window.location.origin);
    } catch (error) {
      console.warn('Failed to load apps config:', error);
      d.apps = { public: [], private: [], all: [] };
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

  async function loadSharedNavbarIfLoggedIn() {
    try {
      const response = await fetch('https://auth.mas0ng.com/session', {
        credentials: 'include',
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.authenticated) {
        return false;
      }

      await loadScript(d.sharedNavUrl);
      return true;
    } catch {
      return false;
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }

      const el = document.createElement('script');
      el.src = src;
      el.async = true;
      el.onload = resolve;
      el.onerror = reject;
      document.head.append(el);
    });
  }

  function liveSocials() {
    return d.social.filter((item) => item.href && item.href !== '#');
  }

  function mountShell(activeId) {
    const main = document.getElementById('site-main');
    if (!main || document.getElementById('site-nav')) return;

    const navItems = d.nav.map((item) => {
      const isActive = item.id === activeId ? ' is-active' : '';
      const current = item.id === activeId ? ' aria-current="page"' : '';
      return `<a class="nav__item${isActive}" href="${item.href}"${current}>${item.label}</a>`;
    }).join('');

    const publicApps = d.apps?.public || [];
    const appsMenu = window.MAS0NG_APP_TILES
      ? window.MAS0NG_APP_TILES.renderMenuItems(publicApps)
      : '';
    const appsMenuFooter = publicApps.length
      ? `<a class="nav__menu-item nav__menu-item--all" href="/public/apps/" role="menuitem">All apps</a>`
      : '';

    const legalMenu = d.legal.map((item) =>
      `<a class="nav__menu-item" href="${item.href}" role="menuitem">${item.label}</a>`
    ).join('');

    const drawerApps = publicApps.length
      ? `<p class="nav__drawer-label">Apps</p>${publicApps.map((item) => `<a class="nav__drawer-link" href="${item.href}">${item.name}</a>`).join('')}<a class="nav__drawer-link" href="/public/apps/">All apps</a>`
      : '';

    const drawerLegal = `
      <p class="nav__drawer-label">Legal</p>
      ${d.legal.map((item) => `<a class="nav__drawer-link" href="${item.href}">${item.label}</a>`).join('')}
    `;

    const footerLegal = d.legal.map((item) =>
      `<li><a href="${item.href}">${item.label}</a></li>`
    ).join('');

    const footerSite = d.nav.map((item) =>
      `<li><a href="${item.href}">${item.label}</a></li>`
    ).join('');

    const footerSocial = liveSocials().map((item) => `
      <li>
        <a class="footer__social-link" href="${item.href}" target="_blank" rel="noopener noreferrer" title="${item.label}">
          <img src="${item.icon}" alt="" width="20" height="20" loading="lazy" decoding="async" />
          <span class="footer__social-label">${item.label}</span>
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
          ${publicApps.length ? `<div class="nav__dropdown" id="nav-apps-dropdown">
            <button class="nav__item nav__item--btn${activeId === 'apps' ? ' is-active' : ''}" type="button" aria-expanded="false" aria-controls="nav-apps-menu" id="nav-apps-btn">
              Apps
              <svg class="nav__chevron" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
            </button>
            <div class="nav__menu" id="nav-apps-menu" role="menu">${appsMenu}${appsMenuFooter}</div>
          </div>` : ''}
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
      <nav class="nav__drawer" id="nav-drawer" aria-label="Mobile">
        ${d.nav.map((item) => `<a class="nav__drawer-link" href="${item.href}">${item.label}</a>`).join('')}
        ${drawerApps ? `<div class="nav__drawer-group" id="nav-drawer-apps">${drawerApps}</div>` : ''}
        <div class="nav__drawer-group" id="nav-drawer-legal">${drawerLegal}</div>
        <a class="nav__drawer-login${activeId === 'login' ? ' is-active' : ''}" id="nav-login-drawer" href="${d.loginUrl}"${activeId === 'login' ? ' aria-current="page"' : ''}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
          Log in
        </a>
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
              <li><a id="footer-login" href="${d.loginUrl}">Log in</a></li>
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

    if (!footerOnly) {
      const page = document.body.dataset.page || 'page';
      const masthead = page === 'home'
        ? (window.MAS0NG_NAV_SCROLL?.findHero?.(main) || main.querySelector('.masthead'))
        : page === 'auth'
          ? main.querySelector('.worker-masthead')
          : page === 'legal'
            ? main.querySelector('.legal-hero')
            : null;

      if (masthead) {
        masthead.prepend(nav);
      } else {
        main.before(nav);
        document.documentElement.setAttribute('data-nav-solid', '');
      }
    }
    main.append(footer);
  }

  function initNav() {
    const drawer = document.getElementById('nav-drawer');
    const toggle = document.getElementById('nav-toggle');
    const legalBtn = document.getElementById('nav-legal-btn');
    const legalDropdown = document.getElementById('nav-legal-dropdown');
    const appsBtn = document.getElementById('nav-apps-btn');
    const appsDropdown = document.getElementById('nav-apps-dropdown');
    if (!drawer || !toggle || !legalBtn || !legalDropdown) return;

    function closeDrawer() {
      drawer.classList.remove('is-open');
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
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('menu-open', open);
      if (open) {
        closeLegalMenu();
        closeAppsMenu();
      }
    });

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
        scrollToTarget(document.getElementById('social'));
      });
    } else if (page === 'legal') {
      const hero = document.querySelector('.legal-hero');
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

    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href="#social"], a[href="/#social"]');
      if (!link || !isHome) return;
      e.preventDefault();
      window.MAS0NG_LOADER?.hide?.();
      scrollToTarget(document.getElementById('social'));
      history.pushState(null, '', '#social');
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

  function inferActive() {
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html') return 'home';
    if (path.startsWith('/public/apps')) return 'apps';
    if (path.startsWith('/legal')) return 'legal';
    return 'page';
  }
})();