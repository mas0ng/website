(function () {
  const NAV_ID = "mas0ng-public-navbar";
  const STYLE_ID = "mas0ng-public-navbar-style";
  const SHARED_NAV_URL = "https://sharedassets.mas0ng.com/navbar.js";
  const LOGIN_URL = "/auth/login?return_to=https%3A%2F%2Fwww.mas0ng.com%2Fapps%2F";
  const loaderScript = document.currentScript;

  const publicLinks = [
    { id: "home", label: "Home", href: "/p/" },
    { id: "legal", label: "Legal", href: "/p/legal/" },
    { id: "privacy", label: "Privacy", href: "/p/legal/privacy/" },
    { id: "terms", label: "Terms", href: "/p/legal/terms.html" },
    { id: "cookies", label: "Cookies", href: "/p/legal/cookies.html" },
    { id: "security", label: "Security", href: "/p/legal/security.html" }
  ];

  const visitorLinks = [
    { id: "login", label: "Login", href: LOGIN_URL },
    { id: "apps", label: "Apps", href: LOGIN_URL }
  ];

  boot();

  async function boot() {
    if (await loadSharedNavbarIfLoggedIn()) {
      return;
    }

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

  function loadScript(src) {
    return new Promise((resolve, reject) => {
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

    injectStyles();

    const active = loaderScript?.dataset.active || inferActive();
    const nav = document.createElement("nav");
    nav.id = NAV_ID;
    nav.className = "mas0ng-public-navbar";
    nav.setAttribute("aria-label", "Primary");
    nav.innerHTML = [
      '<a class="mas0ng-public-brand" href="/p/">Mason</a>',
      '<div class="mas0ng-public-menus">',
      menuMarkup("Public", publicLinks, active),
      menuMarkup("Access", visitorLinks, active),
      "</div>"
    ].join("");

    document.body.prepend(nav);
  }

  function menuMarkup(label, links, active) {
    return [
      '<details class="mas0ng-public-menu">',
      '<summary>' + label + "</summary>",
      '<div class="mas0ng-public-menu-panel">',
      links.map((link) => (
        '<a class="mas0ng-public-link" href="' + link.href + '"' +
        (link.id === active ? ' aria-current="page"' : "") +
        ">" + link.label + "</a>"
      )).join(""),
      "</div>",
      "</details>"
    ].join("");
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

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .mas0ng-public-navbar {
        position: sticky;
        top: 0;
        z-index: 1000;
        min-height: 68px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        border-bottom: 1px solid #e0e3e7;
        background: rgba(255, 255, 255, 0.96);
        color: #101418;
        padding: 13px clamp(18px, 4vw, 34px);
        backdrop-filter: blur(18px);
      }

      .mas0ng-public-navbar,
      .mas0ng-public-navbar * {
        box-sizing: border-box;
      }

      .mas0ng-public-brand,
      .mas0ng-public-link {
        color: inherit;
        text-decoration: none;
      }

      .mas0ng-public-brand {
        font-size: 1rem;
        font-weight: 850;
        letter-spacing: 0;
      }

      .mas0ng-public-menus {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .mas0ng-public-menu {
        position: relative;
      }

      .mas0ng-public-menu summary {
        min-height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid transparent;
        border-radius: 8px;
        padding: 0 12px;
        color: #3c4043;
        font-size: 0.92rem;
        font-weight: 750;
        list-style: none;
        cursor: pointer;
        transition: background 160ms ease, border-color 160ms ease, color 160ms ease;
      }

      .mas0ng-public-menu summary::-webkit-details-marker {
        display: none;
      }

      .mas0ng-public-menu summary::after {
        content: "";
        width: 7px;
        height: 7px;
        margin-left: 9px;
        border-right: 2px solid currentColor;
        border-bottom: 2px solid currentColor;
        transform: translateY(-2px) rotate(45deg);
      }

      .mas0ng-public-menu[open] summary,
      .mas0ng-public-menu summary:hover {
        border-color: #d2e3fc;
        background: #e8f0fe;
        color: #174ea6;
      }

      .mas0ng-public-menu-panel {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        min-width: 184px;
        display: grid;
        gap: 4px;
        border: 1px solid #e0e3e7;
        border-radius: 8px;
        background: #ffffff;
        padding: 6px;
        box-shadow: 0 18px 45px rgba(32, 45, 64, 0.12);
      }

      .mas0ng-public-link {
        min-height: 36px;
        display: flex;
        align-items: center;
        border-radius: 7px;
        padding: 0 10px;
        color: #3c4043;
        font-size: 0.9rem;
        font-weight: 750;
      }

      .mas0ng-public-link:hover,
      .mas0ng-public-link[aria-current="page"] {
        background: #f1f6ff;
        color: #174ea6;
      }

      @media (max-width: 620px) {
        .mas0ng-public-navbar {
          align-items: flex-start;
          flex-direction: column;
        }

        .mas0ng-public-menus {
          width: 100%;
          flex-wrap: wrap;
        }

        .mas0ng-public-menu {
          flex: 1 1 130px;
        }

        .mas0ng-public-menu summary {
          width: 100%;
        }

        .mas0ng-public-menu-panel {
          left: 0;
          right: auto;
          width: min(260px, calc(100vw - 36px));
        }
      }
    `;
    document.head.append(style);
  }
})();
