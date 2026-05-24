(function () {
  const NAV_ID = "mas0ng-public-navbar";
  const SHARED_NAV_URL = "https://sharedassets.mas0ng.com/navbar.js";
  const TAILWIND_URL = "https://cdn.tailwindcss.com";
  const LUCIDE_URL = "https://unpkg.com/lucide@latest";
  const LOGIN_URL = "/auth/login?return_to=%2Fapps%2F";
  const loaderScript = document.currentScript;

  const legalLinks = [
    { id: "legal", label: "Legal hub", href: "/p/legal/", icon: "scale" },
    { id: "privacy", label: "Privacy policy", href: "/p/legal/privacy/", icon: "shield" },
    { id: "terms", label: "Terms", href: "/p/legal/terms.html", icon: "file-text" },
    { id: "cookies", label: "Cookies", href: "/p/legal/cookies.html", icon: "cookie" },
    { id: "security", label: "Security", href: "/p/legal/security.html", icon: "lock" }
  ];

  boot();

  async function boot() {
    if (await loadSharedNavbarIfLoggedIn()) {
      return;
    }

    await loadExternalLibraries();
    mountPublicNavbar();
  }

  async function loadSharedNavbarIfLoggedIn() {
    try {
      const response = await fetch("/auth/session", {
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

  function mountPublicNavbar() {
    if (document.getElementById(NAV_ID)) {
      return;
    }

    document.querySelectorAll(".auth-navbar").forEach((node) => node.remove());

    const active = loaderScript?.dataset.active || inferActive();
    const nav = document.createElement("nav");
    nav.id = NAV_ID;
    nav.className = "fixed left-0 right-0 top-0 z-[2147482000] border-b border-slate-200/80 bg-white/95 shadow-sm shadow-slate-900/5 backdrop-blur-xl";
    nav.setAttribute("aria-label", "Primary");
    nav.innerHTML = `
      <div class="flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a class="flex shrink-0 items-center gap-3" href="/p/" aria-label="mas0ng.com public home">
          <img src="/public_assets/site_branding/site_icons/256/logged_out.png" alt="" class="h-10 w-10 rounded-xl object-cover">
          <span class="grid leading-tight">
            <span class="text-base font-black tracking-tight text-slate-950 sm:text-lg">mas0ng.com</span>
          </span>
        </a>

        <div class="hidden flex-1 items-center justify-center px-4 md:flex">
          <div class="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50/90 p-1">
            <a href="/p/" class="${desktopLinkClass(active === "home")}">Home</a>
            ${desktopDropdown("Legal", legalLinks, active)}
          </div>
        </div>

        <div class="hidden items-center gap-4 md:flex">
          <span class="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-xs font-black uppercase tracking-wider text-blue-700">
            <i data-lucide="globe-2" class="h-4 w-4"></i>
            Public
          </span>
          <a href="${LOGIN_URL}" class="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-blue-500/25">
            <i data-lucide="log-in" class="h-4 w-4"></i>
            Log in
          </a>
        </div>

        <button class="mobile-menu-button rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-sky-700 md:hidden" type="button" aria-label="Open menu" aria-expanded="false">
          <i data-lucide="menu" class="menu-icon h-6 w-6"></i>
          <i data-lucide="x" class="close-icon hidden h-6 w-6"></i>
        </button>
      </div>

      <div class="mobile-menu absolute left-0 top-full max-h-0 w-full overflow-hidden border-b border-slate-200 bg-white opacity-0 shadow-xl transition-all duration-300 md:hidden">
        <div class="max-h-[calc(100vh-64px)] overflow-y-auto px-4 pb-6 pt-2">
          <a href="/p/" class="block rounded-xl px-4 py-3 text-base font-semibold text-slate-900 hover:bg-slate-50">Home</a>
          ${mobileDropdown("Legal", legalLinks, active)}
          <div class="my-4 h-px bg-slate-100"></div>
          <a href="${LOGIN_URL}" class="flex items-center justify-center rounded-xl bg-slate-950 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-sky-700">Log in</a>
        </div>
      </div>
    `;

    document.body.prepend(nav);
    document.body.classList.add("pt-16");
    bindMobile(nav);
    window.lucide?.createIcons?.();
  }

  function desktopDropdown(label, links, active) {
    return `
      <div class="group relative flex items-center">
        <button class="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition group-hover:bg-white group-hover:text-brand-600 group-hover:shadow-sm" type="button">
          ${label}
          <i data-lucide="chevron-down" class="h-4 w-4 transition-transform duration-200 group-hover:rotate-180"></i>
        </button>
        <div class="absolute left-0 top-full h-4 w-full"></div>
        <div class="invisible absolute left-0 top-full w-64 translate-y-1 pt-4 opacity-0 transition-all duration-200 ease-out group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
          <div class="grid gap-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10 ring-1 ring-black/5">
            ${links.map((link) => `
              <a href="${link.href}" class="flex items-center gap-3 rounded-xl p-2 transition hover:bg-sky-50 ${link.id === active ? "bg-sky-50 text-sky-700" : "text-slate-600 hover:text-sky-700"}">
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
        <button class="mobile-dropdown-button flex w-full items-center justify-between rounded-xl px-4 py-3 text-base font-semibold text-slate-900 hover:bg-slate-50" type="button" data-target="${id}">
          ${label}
          <i data-lucide="chevron-down" class="h-4 w-4 transition-transform duration-200"></i>
        </button>
        <div id="${id}" class="mobile-dropdown-panel ml-4 hidden space-y-1 border-l-2 border-slate-100 px-4 py-2">
          ${links.map((link) => `<a href="${link.href}" class="block rounded-lg py-2 text-sm font-medium ${link.id === active ? "text-sky-700" : "text-slate-600 hover:text-sky-700"}">${link.label}</a>`).join("")}
        </div>
      </div>
    `;
  }

  function desktopLinkClass(active) {
    return "rounded-full px-4 py-2 text-sm font-bold transition " + (active ? "bg-white text-brand-600 shadow-sm" : "text-slate-600 hover:bg-white hover:text-brand-600 hover:shadow-sm");
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

  function inferActive() {
    const path = window.location.pathname.replace(/\/index\.html$/, "/");
    if (path.startsWith("/p/legal/privacy")) return "privacy";
    if (path.endsWith("/terms.html")) return "terms";
    if (path.endsWith("/cookies.html")) return "cookies";
    if (path.endsWith("/security.html")) return "security";
    if (path.startsWith("/p/legal")) return "legal";
    return "home";
  }
})();
