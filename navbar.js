(function () {
  const NAV_ID = "mas0ng-public-navbar";
  const SHARED_NAV_URL = "https://sharedassets.mas0ng.com/navbar.js";
  const TAILWIND_URL = "https://cdn.tailwindcss.com";
  const LUCIDE_URL = "https://unpkg.com/lucide@latest";
  const LOGIN_URL = "https://auth.mas0ng.com/login?return_to=%2Fsecure%2Fapps%2F";
  const loaderScript = document.currentScript;
  const SITE_ORIGIN = "https://mas0ng.com";

  const legalLinks = [
    { id: "legal", label: "Legal hub", href: SITE_ORIGIN + "/legal/", icon: "scale" },
    { id: "privacy", label: "Privacy policy", href: SITE_ORIGIN + "/legal/privacy/", icon: "shield" },
    { id: "ai", label: "AI policy", href: SITE_ORIGIN + "/legal/ai.html", icon: "bot" },
    { id: "terms", label: "Terms", href: SITE_ORIGIN + "/legal/terms.html", icon: "file-text" },
    { id: "cookies", label: "Cookies", href: SITE_ORIGIN + "/legal/cookies.html", icon: "cookie" },
    { id: "security", label: "Security", href: SITE_ORIGIN + "/legal/security.html", icon: "lock" }
  ];

  boot();

  async function boot() {
    if (window.location.hostname === "auth.mas0ng.com") {
      return;
    }

    if (await loadSharedNavbarIfLoggedIn()) {
      return;
    }

    await loadExternalLibraries();
    mountPublicNavbar([]);
  }

  async function loadSharedNavbarIfLoggedIn() {
    try {
      const response = await fetch("https://auth.mas0ng.com/session", {
        credentials: "include",
        cache: "no-store",
        headers: { "Accept": "application/json" }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.authenticated) {
        return false;
      }

      await loadScript(SHARED_NAV_URL);
      return true;
    } catch {
      return false;
    }
  }

  function loadExternalLibraries() {
    configureTailwind();

    if (window.mas0ngLoadDesignLibraries) {
      return window.mas0ngLoadDesignLibraries;
    }

    window.mas0ngLoadDesignLibraries = Promise.all([
      hasScript(TAILWIND_URL) ? Promise.resolve() : loadScript(TAILWIND_URL),
      window.lucide ? Promise.resolve() : loadScript(LUCIDE_URL)
    ]).catch(() => undefined);

    return window.mas0ngLoadDesignLibraries;
  }

  function configureTailwind() {
    window.tailwind = window.tailwind || {};
    window.tailwind.config = {
      corePlugins: {
        preflight: false
      },
      theme: {
        extend: {
          fontFamily: {
            sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
          },
          colors: {
            brand: {
              50: "#eff6ff",
              100: "#dbeafe",
              500: "#1688d8",
              600: "#174ea6",
              900: "#073b84"
            }
          }
        }
      }
    };
  }

  function hasScript(src) {
    return Boolean(document.querySelector('script[src="' + src + '"]'));
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        if (src === TAILWIND_URL && window.tailwind) resolve();
        if (src === LUCIDE_URL && window.lucide) resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    });
  }

  function mountPublicNavbar(publicApps) {
    if (document.getElementById(NAV_ID)) {
      return;
    }

    document.querySelectorAll(".auth-navbar").forEach((node) => node.remove());

    const active = loaderScript?.dataset.active || inferActive();
    const nav = document.createElement("nav");
    nav.id = NAV_ID;
    nav.className = "fixed left-0 right-0 top-0 z-[2147482000] border-b border-white/10 bg-slate-950/95 text-white shadow-2xl shadow-slate-950/20 backdrop-blur-2xl";
    nav.setAttribute("aria-label", "Primary");
    nav.innerHTML = `
      <div class="box-border flex h-16 w-full max-w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <a class="flex shrink-0 items-center gap-3 no-underline" href="${SITE_ORIGIN}/" aria-label="mas0ng.com public home">
          <span class="text-lg font-black tracking-tight text-white">mas0ng.com</span>
        </a>

        <div class="hidden min-w-0 flex-1 items-center justify-center px-3 lg:flex">
          <div class="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur">
            <a href="${SITE_ORIGIN}/" class="${desktopLinkClass(active === "home")}">Home</a>
            ${publicApps.length ? desktopAppsDropdown(publicApps, active) : ""}
            ${desktopDropdown("Legal", legalLinks, active)}
          </div>
        </div>

        <div class="hidden shrink-0 items-center gap-3 lg:flex">
          <a href="${LOGIN_URL}" class="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50">
            <i data-lucide="log-in" class="h-4 w-4"></i>
            Log in
          </a>
        </div>

        <button class="mobile-menu-button rounded-xl p-2 text-slate-200 transition hover:bg-white/10 hover:text-white lg:hidden" type="button" aria-label="Open menu" aria-expanded="false">
          <i data-lucide="menu" class="menu-icon h-6 w-6"></i>
          <i data-lucide="x" class="close-icon hidden h-6 w-6"></i>
        </button>
      </div>

      <div class="mobile-menu absolute left-0 top-full box-border max-h-0 w-full overflow-hidden border-b border-white/10 bg-slate-950 opacity-0 shadow-xl transition-all duration-300 lg:hidden">
        <div class="max-h-[calc(100vh-64px)] overflow-y-auto px-4 pb-6 pt-2">
          <a href="${SITE_ORIGIN}/" class="block rounded-xl px-4 py-3 text-base font-semibold text-white no-underline hover:bg-white/10">Home</a>
          ${publicApps.length ? mobileAppsDropdown(publicApps, active) : ""}
          ${mobileDropdown("Legal", legalLinks, active)}
          <div class="my-4 h-px bg-slate-100"></div>
          <a href="${LOGIN_URL}" class="flex items-center justify-center rounded-2xl bg-white py-2.5 text-sm font-bold text-slate-950 shadow-md transition hover:bg-blue-50">Log in</a>
        </div>
      </div>
    `;

    const masthead = document.querySelector(".masthead");
    if (masthead) {
      masthead.prepend(nav);
    } else {
      document.body.prepend(nav);
      document.documentElement.setAttribute("data-nav-solid", "");
    }
    document.body.classList.remove("pt-16", "pt-20", "pt-24");
    bindMobile(nav);
    bindPageLoadIndicator(nav);
    window.lucide?.createIcons?.();
  }

  function desktopAppsDropdown(apps, active) {
    const links = apps.map((app) => ({
      id: app.id,
      label: app.name,
      href: app.href,
      icon: "grid-3x3"
    }));
    links.push({ id: "all-apps", label: "Browse all", href: SITE_ORIGIN + "/public/apps/", icon: "layout-grid" });
    return desktopDropdown("Apps", links, active === "apps" ? "all-apps" : active);
  }

  function mobileAppsDropdown(apps, active) {
    const links = apps.map((app) => ({ id: app.id, label: app.name, href: app.href }));
    links.push({ id: "all-apps", label: "Browse all", href: SITE_ORIGIN + "/public/apps/" });
    return mobileDropdown("Apps", links, active === "apps" ? "all-apps" : active);
  }

  function desktopDropdown(label, links, active) {
    return `
      <div class="group relative flex items-center">
        <button class="appearance-none border-0 bg-transparent flex items-center gap-1 rounded-full px-4 py-2 text-sm font-bold text-slate-200 transition group-hover:bg-white/10 group-hover:text-white" type="button">
          ${label}
          <i data-lucide="chevron-down" class="h-4 w-4 transition-transform duration-200 group-hover:rotate-180"></i>
        </button>
        <div class="absolute left-0 top-full h-4 w-full"></div>
        <div class="invisible absolute left-0 top-full w-64 translate-y-1 pt-4 opacity-0 transition-all duration-200 ease-out group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
          <div class="grid gap-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10 ring-1 ring-black/5">
            ${links.map((link) => `
              <a href="${link.href}" class="flex items-center gap-3 rounded-xl p-2 no-underline transition hover:bg-sky-50 ${link.id === active ? "bg-sky-50 text-sky-700" : "text-slate-600 hover:text-sky-700"}">
                <span class="grid h-9 w-9 place-items-center rounded-lg bg-sky-50 text-sky-700"><i data-lucide="${link.icon}" class="h-4 w-4"></i></span>
                <span class="text-sm font-semibold">${link.label}</span>
              </a>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }

  function mobileDropdown(label, links, active) {
    const id = "mobile-public-" + label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return `
      <div>
        <button class="mobile-dropdown-button appearance-none border-0 bg-transparent flex w-full items-center justify-between rounded-xl px-4 py-3 text-base font-semibold text-white hover:bg-white/10" type="button" data-target="${id}">
          ${label}
          <i data-lucide="chevron-down" class="h-4 w-4 transition-transform duration-200"></i>
        </button>
        <div id="${id}" class="mobile-dropdown-panel ml-4 hidden space-y-1 border-l-2 border-white/10 px-4 py-2">
          ${links.map((link) => `<a href="${link.href}" class="block rounded-lg py-2 text-sm font-medium no-underline ${link.id === active ? "text-blue-200" : "text-slate-300 hover:text-white"}">${link.label}</a>`).join("")}
        </div>
      </div>
    `;
  }

  function desktopLinkClass(active) {
    return "rounded-full px-4 py-2 text-sm font-bold no-underline transition " + (active ? "bg-blue-100 text-slate-950 ring-1 ring-blue-300 shadow-sm" : "text-slate-200 hover:bg-white/10 hover:text-white");
  }

  function bindMobile(nav) {
    const button = nav.querySelector(".mobile-menu-button");
    const menu = nav.querySelector(".mobile-menu");
    const menuIcon = nav.querySelector(".menu-icon");
    const closeIcon = nav.querySelector(".close-icon");
    button?.addEventListener("click", () => {
      const open = menu.classList.contains("max-h-0");
      menu.classList.toggle("max-h-0", !open);
      menu.classList.toggle("opacity-0", !open);
      menu.classList.toggle("max-h-[1000px]", open);
      menu.classList.toggle("opacity-100", open);
      menuIcon?.classList.toggle("hidden", open);
      closeIcon?.classList.toggle("hidden", !open);
      button.setAttribute("aria-expanded", String(open));
    });

    nav.querySelectorAll(".mobile-dropdown-button").forEach((dropdownButton) => {
      dropdownButton.addEventListener("click", () => {
        const panel = nav.querySelector("#" + dropdownButton.dataset.target);
        const icon = dropdownButton.querySelector("[data-lucide='chevron-down']");
        panel?.classList.toggle("hidden");
        icon?.classList.toggle("rotate-180");
      });
    });
  }

  function bindPageLoadIndicator(nav) {
    nav.querySelectorAll("a[href]").forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");
        if (!href || href.startsWith("#") || href.startsWith("mailto:") || link.target === "_blank") return;
        if (link.origin && link.origin !== window.location.origin) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        window.MAS0NG_LOADER?.show?.();
      });
    });
    window.addEventListener("pageshow", () => {
      window.MAS0NG_LOADER?.hide?.();
    });
  }

  function inferActive() {
    const path = window.location.pathname.replace(/\/index\.html$/, "/");
    if (path.startsWith("/legal/privacy")) return "privacy";
    if (path.endsWith("/ai.html")) return "ai";
    if (path.endsWith("/terms.html")) return "terms";
    if (path.endsWith("/cookies.html")) return "cookies";
    if (path.endsWith("/security.html")) return "security";
    if (path.startsWith("/public/apps")) return "apps";
    if (path.startsWith("/legal")) return "legal";
    return "home";
  }
})();
