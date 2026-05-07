(function injectHead() {
    try {
        if (!document.head) return;
        const fragment = document.createDocumentFragment();

        const add = (type, attrs = {}, inlineScript = null) => {
            const el = document.createElement(type);
            for (const [key, value] of Object.entries(attrs)) {
                el.setAttribute(key, value);
            }
            if (inlineScript) {
                el.textContent = inlineScript;
            }
            fragment.appendChild(el);
        };

        add("script", {
            id: "cookieyes",
            type: "text/javascript",
            src: "https://cdn-cookieyes.com/client_data/152416f70a69c8655ea60feb58656f08/script.js"
        });

        add("script", {}, `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'analytics_storage': 'denied'
            });
        `);

        add("script", {
            async: "true",
            src: "https://www.googletagmanager.com/gtag/js?id=G-Z69GPRYZS0"
        });

        add("script", {}, `
            gtag('js', new Date());
            gtag('config', 'G-Z69GPRYZS0');
        `);

        add("link", {
            rel: "icon",
            type: "image/png",
            sizes: "96x96",
            href: "https://www.mas0ng.com/assets/icons/siteIcons/favicons/favicon-96x96.png"
        });

        add("link", {
            rel: "icon",
            type: "image/svg+xml",
            href: "https://www.mas0ng.com/assets/icons/siteIcons/favicons/favicon.svg"
        });

        add("link", {
            rel: "shortcut icon",
            href: "https://www.mas0ng.com/assets/icons/siteIcons/favicons/favicon.ico"
        });

        add("link", {
            rel: "apple-touch-icon",
            sizes: "180x180",
            href: "https://www.mas0ng.com/assets/icons/siteIcons/favicons/apple-touch-icon.png"
        });

        add("meta", {
            name: "apple-mobile-web-app-title",
            content: "mas0ng.com"
        });

        add("link", {
            rel: "manifest",
            href: "https://www.mas0ng.com/assets/icons/siteIcons/favicons/site.webmanifest"
        });

        document.head.appendChild(fragment);
    } catch (error) {
        console.error("Head injection failed:", error);
    }
})();

document.addEventListener("DOMContentLoaded", function initSharedUi() {
    const path = window.location.pathname.replace(/\\/g, "/");
    const rootPrefix = path.includes("/errors/") ? "../" : "";
    const sidebarStorageKey = "mas0ng-sidebar-open";

    function isInternalMas0ngUrl(url) {
        return url.hostname === "mas0ng.com" || url.hostname.endsWith(".mas0ng.com");
    }

    function readSidebarOpen() {
        try {
            return localStorage.getItem(sidebarStorageKey) === "true";
        } catch (error) {
            return false;
        }
    }

    function saveSidebarOpen(isOpen) {
        try {
            localStorage.setItem(sidebarStorageKey, String(isOpen));
        } catch (error) {
            console.warn("Sidebar preference could not be saved.", error);
        }
    }

    function getIconTheme() {
        return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    }

    function updateThemedIcons(root = document) {
        const iconTheme = getIconTheme();
        root.querySelectorAll("img[data-themed-icon]").forEach((img) => {
            const iconRoot = img.dataset.iconRoot;
            const iconBase = img.dataset.iconBase || (img.dataset.iconName || "").replace(/\.(svg|png)$/i, "");
            if (!iconRoot || !iconBase) return;

            if (!img.dataset.fallbackBound) {
                img.dataset.fallbackBound = "true";
                img.addEventListener("error", () => {
                    if (img.dataset.iconFallbackTried !== "true") {
                        img.dataset.iconFallbackTried = "true";
                        img.dataset.iconExtension = img.dataset.iconFallbackExtension;
                        img.src = `${img.dataset.currentIconRoot}/${img.dataset.currentIconTheme}/${img.dataset.currentIconBase}.${img.dataset.iconFallbackExtension}`;
                        return;
                    }

                    img.dataset.iconMissing = "true";
                });
                img.addEventListener("load", () => {
                    img.dataset.iconMissing = "false";
                });
            }

            img.dataset.currentIconRoot = iconRoot;
            img.dataset.currentIconTheme = iconTheme;
            img.dataset.currentIconBase = iconBase;
            const preferredExtension = (img.dataset.iconPreferredExtension || "png").toLowerCase() === "svg" ? "svg" : "png";
            img.dataset.iconExtension = preferredExtension;
            img.dataset.iconFallbackExtension = preferredExtension === "png" ? "svg" : "png";
            img.dataset.iconFallbackTried = "false";
            img.dataset.iconMissing = "false";
            img.src = `${iconRoot}/${iconTheme}/${iconBase}.${preferredExtension}`;
        });
    }

    function injectSidebar() {
        document.body.classList.add("has-site-sidebar");
        if (readSidebarOpen()) {
            document.body.classList.add("site-sidebar-open");
        }

        const sidebar = document.createElement("aside");
        sidebar.className = "site-sidebar";
        sidebar.setAttribute("aria-label", "Site navigation");
        sidebar.innerHTML = `
            <div class="site-sidebar__top">
                <div class="site-sidebar__brand">
                    <span class="site-sidebar__glyph site-sidebar__glyph--brand" aria-hidden="true">
                        <img src="${rootPrefix}assets/images/sidebar/light/brand-mark.svg" data-themed-icon data-icon-root="${rootPrefix}assets/images/sidebar" data-icon-base="brand-mark" data-icon-preferred-extension="svg" alt="" />
                    </span>
                    <div class="site-sidebar__brand-text">
                        <strong>mas0ng.com</strong>
                        <span>Mason / @mas0ng</span>
                    </div>
                </div>
                <button class="site-sidebar__toggle" type="button" aria-expanded="${document.body.classList.contains("site-sidebar-open")}">
                    <span class="site-sidebar__glyph site-sidebar__glyph--menu" aria-hidden="true">
                        <img src="${rootPrefix}assets/images/sidebar/light/menu.png" data-themed-icon data-icon-root="${rootPrefix}assets/images/sidebar" data-icon-base="menu" alt="" />
                    </span>
                    <span class="site-sidebar__text">Menu</span>
                </button>
            </div>

            <nav class="site-sidebar__nav" aria-label="Sidebar">
                <a class="site-sidebar__link site-sidebar__link--primary" href="${rootPrefix}index.html">
                    <span class="site-sidebar__glyph site-sidebar__glyph--home" aria-hidden="true">
                        <img src="${rootPrefix}assets/images/sidebar/light/home.png" data-themed-icon data-icon-root="${rootPrefix}assets/images/sidebar" data-icon-base="home" alt="" />
                    </span>
                    <span class="site-sidebar__text">Home</span>
                </a>

                <section class="site-sidebar__group">
                    <button class="site-sidebar__group-toggle" type="button" aria-expanded="false" aria-controls="sidebar-socials">
                        <span class="site-sidebar__glyph site-sidebar__glyph--socials" aria-hidden="true">
                            <img src="${rootPrefix}assets/images/sidebar/light/socials.png" data-themed-icon data-icon-root="${rootPrefix}assets/images/sidebar" data-icon-base="socials" alt="" />
                        </span>
                        <span class="site-sidebar__text">Socials</span>
                        <span class="site-sidebar__arrow" aria-hidden="true">
                            <img src="${rootPrefix}assets/images/sidebar/light/dropdown-arrow.svg" data-themed-icon data-icon-root="${rootPrefix}assets/images/sidebar" data-icon-base="dropdown-arrow" data-icon-preferred-extension="svg" alt="" />
                        </span>
                    </button>
                    <div class="site-sidebar__submenu" id="sidebar-socials" hidden>
                        <a class="site-sidebar__link" href="https://www.tiktok.com/@mas0ng" target="_blank" rel="noopener">
                            <img src="${rootPrefix}assets/icons/socials/light/tiktok.png" data-themed-icon data-icon-root="${rootPrefix}assets/icons/socials" data-icon-base="tiktok" alt="" />
                            <span class="site-sidebar__text">TikTok</span>
                        </a>
                        <a class="site-sidebar__link" href="https://www.instagram.com/mas0ngi/" target="_blank" rel="noopener">
                            <img src="${rootPrefix}assets/icons/socials/light/instagram.png" data-themed-icon data-icon-root="${rootPrefix}assets/icons/socials" data-icon-base="instagram" alt="" />
                            <span class="site-sidebar__text">Instagram</span>
                        </a>
                        <a class="site-sidebar__link" href="https://github.com/mas0ng" target="_blank" rel="noopener">
                            <img src="${rootPrefix}assets/icons/socials/light/github.png" data-themed-icon data-icon-root="${rootPrefix}assets/icons/socials" data-icon-base="github" alt="" />
                            <span class="site-sidebar__text">GitHub</span>
                        </a>
                        <a class="site-sidebar__link" href="https://signal.me/#eu/Js8_IVmBa0zw4nGdLTvE1Fbcg6mUcmm11h34T-4CjCwgk8jx76hAQbvCkyHjY9JO" target="_blank" rel="noopener">
                            <img src="${rootPrefix}assets/icons/socials/light/signal.png" data-themed-icon data-icon-root="${rootPrefix}assets/icons/socials" data-icon-base="signal" alt="" />
                            <span class="site-sidebar__text">Signal</span>
                        </a>
                        <a class="site-sidebar__link" href="mailto:mason@mas0ng.com">
                            <img src="${rootPrefix}assets/icons/socials/light/email.png" data-themed-icon data-icon-root="${rootPrefix}assets/icons/socials" data-icon-base="email" alt="" />
                            <span class="site-sidebar__text">Email</span>
                        </a>
                    </div>
                </section>

                <button class="site-sidebar__theme" type="button" data-theme-toggle>
                    <span class="site-sidebar__glyph site-sidebar__glyph--light" aria-hidden="true">
                        <img src="${rootPrefix}assets/images/sidebar/light/light.png" data-themed-icon data-icon-root="${rootPrefix}assets/images/sidebar" data-icon-base="light" alt="" />
                    </span>
                    <span class="site-sidebar__text" data-theme-toggle-label>Display</span>
                </button>
            </nav>

            <div class="site-sidebar__bottom">
                <a class="site-sidebar__utility-link" href="${rootPrefix}privacy.html">
                    <span class="site-sidebar__glyph site-sidebar__glyph--privacy" aria-hidden="true">
                        <img src="${rootPrefix}assets/images/sidebar/light/privacy.png" data-themed-icon data-icon-root="${rootPrefix}assets/images/sidebar" data-icon-base="privacy" alt="" />
                    </span>
                    <span>Privacy Policy</span>
                </a>
                <a class="site-sidebar__utility-link" href="${rootPrefix}terms.html">
                    <span class="site-sidebar__glyph site-sidebar__glyph--terms" aria-hidden="true">
                        <img src="${rootPrefix}assets/images/sidebar/light/terms.png" data-themed-icon data-icon-root="${rootPrefix}assets/images/sidebar" data-icon-base="terms" alt="" />
                    </span>
                    <span>Terms &amp; Conditions</span>
                </a>
            </div>
        `;

        document.body.prepend(sidebar);
    }

    function setupSidebar() {
        const sidebar = document.querySelector(".site-sidebar");
        if (!sidebar) return;

        const toggle = sidebar.querySelector(".site-sidebar__toggle");
        const groupToggles = Array.from(sidebar.querySelectorAll(".site-sidebar__group-toggle"));

        function setSidebarOpen(isOpen) {
            document.body.classList.toggle("site-sidebar-open", isOpen);
            toggle.setAttribute("aria-expanded", String(isOpen));
            saveSidebarOpen(isOpen);
        }

        function closeAllGroups(exceptToggle = null) {
            groupToggles.forEach((button) => {
                if (button === exceptToggle) return;
                const submenu = document.getElementById(button.getAttribute("aria-controls"));
                button.setAttribute("aria-expanded", "false");
                if (submenu) submenu.hidden = true;
            });
        }

        toggle.addEventListener("click", () => {
            const willOpen = !document.body.classList.contains("site-sidebar-open");
            setSidebarOpen(willOpen);
            if (!willOpen) closeAllGroups();
        });

        groupToggles.forEach((button) => {
            button.addEventListener("click", () => {
                if (!document.body.classList.contains("site-sidebar-open")) {
                    setSidebarOpen(true);
                }

                const submenu = document.getElementById(button.getAttribute("aria-controls"));
                const willExpand = button.getAttribute("aria-expanded") !== "true";
                closeAllGroups(button);
                button.setAttribute("aria-expanded", String(willExpand));
                if (submenu) submenu.hidden = !willExpand;
            });
        });

        const themeToggle = sidebar.querySelector("[data-theme-toggle]");
        const themeToggleLabel = sidebar.querySelector("[data-theme-toggle-label]");
        const themeToggleGlyph = themeToggle?.querySelector(".site-sidebar__glyph");

        function updateThemeToggle() {
            if (!themeToggle || !themeToggleLabel || !themeToggleGlyph) return;

            const resolvedTheme = document.documentElement.getAttribute("data-theme") || "light";
            const isDark = resolvedTheme === "dark";
            themeToggleLabel.textContent = isDark ? "Dark mode" : "Light mode";
            themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
            themeToggleGlyph.classList.toggle("site-sidebar__glyph--dark", isDark);
            themeToggleGlyph.classList.toggle("site-sidebar__glyph--light", !isDark);
            themeToggleGlyph.classList.remove("site-sidebar__glyph--auto");
            const themeImg = themeToggleGlyph.querySelector("img[data-themed-icon]");
            if (themeImg) {
                themeImg.dataset.iconBase = isDark ? "dark" : "light";
                updateThemedIcons(themeToggle);
            }
        }

        if (themeToggle) {
            themeToggle.addEventListener("click", () => {
                if (typeof window.setSiteTheme === "function") {
                    const resolvedTheme = document.documentElement.getAttribute("data-theme") || "light";
                    window.setSiteTheme(resolvedTheme === "dark" ? "light" : "dark");
                    updateThemeToggle();
                }
            });

            updateThemeToggle();

            const observer = new MutationObserver(updateThemeToggle);
            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ["data-theme"]
            });
        }

        sidebar.querySelectorAll("a[href]").forEach((link) => {
            const url = new URL(link.getAttribute("href"), window.location.href);
            const currentFile = path.split("/").pop() || "index.html";
            if (url.pathname.endsWith(currentFile) || (currentFile === "" && url.pathname.endsWith("index.html"))) {
                link.setAttribute("aria-current", "page");
            }
        });
    }

    function setupExternalWarning() {
        const warning = document.createElement("div");
        warning.className = "external-warning";
        warning.hidden = true;
        warning.innerHTML = `
            <div class="external-warning__dialog" role="dialog" aria-modal="true" aria-labelledby="external-warning-title">
                <div class="external-warning__header">
                    <span class="external-warning__icon" aria-hidden="true">
                        <img src="${rootPrefix}assets/images/sidebar/light/external-warning.png" data-themed-icon data-icon-root="${rootPrefix}assets/images/sidebar" data-icon-base="external-warning" alt="" />
                    </span>
                    <h2 id="external-warning-title">External link</h2>
                </div>
                <p>You are about to open <span class="external-warning__host" id="external-warning-host"></span>.</p>
                <details>
                    <summary>More details</summary>
                    <code id="external-warning-url"></code>
                </details>
                <div class="button-row">
                    <button class="site-button" type="button" id="external-warning-continue">Continue</button>
                    <button class="site-button" type="button" id="external-warning-cancel">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(warning);
        updateThemedIcons(warning);

        const hostEl = warning.querySelector("#external-warning-host");
        const urlEl = warning.querySelector("#external-warning-url");
        const continueButton = warning.querySelector("#external-warning-continue");
        const cancelButton = warning.querySelector("#external-warning-cancel");
        let pendingLink = null;
        let pendingUrl = null;

        function closeWarning() {
            warning.hidden = true;
            pendingLink = null;
            pendingUrl = null;
        }

        function openWarning(link, url) {
            pendingLink = link;
            pendingUrl = url;
            hostEl.textContent = url.host;
            urlEl.textContent = url.href;
            warning.hidden = false;
            cancelButton.focus();
        }

        document.addEventListener("click", (event) => {
            const link = event.target.closest("a[href]");
            if (!link || link.dataset.noExternalWarning === "true") return;

            const rawHref = link.getAttribute("href");
            if (!rawHref || rawHref.startsWith("#")) return;

            const url = new URL(rawHref, window.location.href);
            if (url.protocol !== "http:" && url.protocol !== "https:") return;
            if (isInternalMas0ngUrl(url)) return;

            event.preventDefault();
            openWarning(link, url);
        });

        continueButton.addEventListener("click", () => {
            if (!pendingLink || !pendingUrl) {
                closeWarning();
                return;
            }

            const shouldOpenNewTab = pendingLink.target === "_blank";
            const nextUrl = pendingUrl.href;
            closeWarning();

            if (shouldOpenNewTab) {
                window.open(nextUrl, "_blank", "noopener");
            } else {
                window.location.href = nextUrl;
            }
        });

        cancelButton.addEventListener("click", closeWarning);

        warning.addEventListener("click", (event) => {
            if (event.target === warning) closeWarning();
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && !warning.hidden) closeWarning();
        });
    }

    injectSidebar();
    setupSidebar();
    updateThemedIcons();
    new MutationObserver(() => updateThemedIcons()).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"]
    });
    setupExternalWarning();
});
