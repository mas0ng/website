(function () {
  const NAV_ID = "mas0ng-public-navbar";
  const STYLE_ID = "mas0ng-public-navbar-style";
  const LOGIN_URL = "/auth/login?return_to=https%3A%2F%2Fwww.mas0ng.com%2Fapps%2F";

  const links = [
    { id: "home", label: "Home", href: "/p/" },
    { id: "legal", label: "Legal", href: "/p/legal/" },
    { id: "privacy", label: "Privacy", href: "/p/legal/privacy/" },
    { id: "login", label: "Login", href: LOGIN_URL }
  ];

  if (document.getElementById(NAV_ID)) return;

  injectStyles();

  const script = document.currentScript;
  const active = script?.dataset.active || inferActive();
  const nav = document.createElement("nav");
  nav.id = NAV_ID;
  nav.className = "mas0ng-public-navbar";
  nav.setAttribute("aria-label", "Primary");
  nav.innerHTML = [
    '<a class="mas0ng-public-brand" href="/p/">Mason</a>',
    '<div class="mas0ng-public-links">',
    links.map((link) => (
      '<a class="mas0ng-public-link" href="' + link.href + '"' +
      (link.id === active ? ' aria-current="page"' : "") +
      ">" + link.label + "</a>"
    )).join(""),
    "</div>"
  ].join("");

  document.body.prepend(nav);

  function inferActive() {
    const path = window.location.pathname.replace(/\/index\.html$/, "/");
    if (path.startsWith("/p/legal/privacy")) return "privacy";
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

      .mas0ng-public-links {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .mas0ng-public-link {
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
        transition: background 160ms ease, border-color 160ms ease, color 160ms ease;
      }

      .mas0ng-public-link:hover,
      .mas0ng-public-link[aria-current="page"] {
        border-color: #d2e3fc;
        background: #e8f0fe;
        color: #174ea6;
      }

      @media (max-width: 620px) {
        .mas0ng-public-navbar {
          align-items: flex-start;
          flex-direction: column;
        }

        .mas0ng-public-links {
          width: 100%;
          overflow-x: auto;
          padding-bottom: 2px;
        }

        .mas0ng-public-link {
          flex: 0 0 auto;
        }
      }
    `;
    document.head.append(style);
  }
})();
