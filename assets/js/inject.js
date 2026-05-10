var mas0ngInjectConfig = (function readInjectConfig() {
    const currentScript = document.currentScript || Array.from(document.scripts).reverse().find((script) => {
        return (script.getAttribute("src") || "").includes("inject.js");
    });
    const params = new URL(currentScript?.getAttribute("src") || "inject.js", window.location.href).searchParams;

    function readBool(names, defaultValue) {
        for (const name of names) {
            if (!params.has(name)) continue;

            const value = params.get(name).trim().toLowerCase();
            if (["1", "true", "yes", "on", "open", "enabled"].includes(value)) return true;
            if (["0", "false", "no", "off", "closed", "disabled"].includes(value)) return false;
        }

        return defaultValue;
    }

    const config = {
        trackingEnabled: readBool(["tracking", "analytics"], true),
        navEnabled: readBool(["nav", "sidebar"], true),
        startOpen: readBool(["startOpen", "start-open", "navOpen", "nav-open", "open"], false),
        rememberNav: readBool(["rememberNav", "remember-nav"], false),
        externalWarningEnabled: readBool(["externalWarning", "external-warning", "externalLinks", "external-links"], true)
    };

    window.mas0ngInjectConfig = config;
    return config;
})();

(function injectHead() {
    const analyticsId = "G-Z69GPRYZS0";
    const consentStorageKey = "mas0ng-tracking-consent";
    const consentUpdatedStorageKey = "mas0ng-tracking-consent-updated";
    const deniedConsent = {
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        analytics_storage: "denied"
    };

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
        window.dataLayer.push(arguments);
    };
    window.gtag("consent", "default", deniedConsent);
    window[`ga-disable-${analyticsId}`] = true;

    function readTrackingConsent() {
        try {
            const value = localStorage.getItem(consentStorageKey);
            return value === "granted" || value === "denied" ? value : null;
        } catch (error) {
            return null;
        }
    }

    function saveTrackingConsent(choice) {
        try {
            localStorage.setItem(consentStorageKey, choice);
            localStorage.setItem(consentUpdatedStorageKey, new Date().toISOString());
        } catch (error) {
            console.warn("Tracking consent preference could not be saved.", error);
        }
    }

    function clearAnalyticsCookies() {
        const analyticsCookiePattern = /^(_ga|_gid|_gat|_gac|_gcl)/;
        const cookieNames = document.cookie
            .split(";")
            .map((cookie) => cookie.split("=")[0].trim())
            .filter((name) => analyticsCookiePattern.test(name));
        const hostname = window.location.hostname;
        const domains = new Set(["", hostname, hostname ? `.${hostname}` : "", ".mas0ng.com"]);

        cookieNames.forEach((name) => {
            domains.forEach((domain) => {
                const domainPart = domain ? ` domain=${domain};` : "";
                document.cookie = `${name}=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;${domainPart} SameSite=Lax`;
            });
        });
    }

    function loadGoogleAnalytics() {
        if (document.getElementById("google-analytics-tag")) return;

        const script = document.createElement("script");
        script.id = "google-analytics-tag";
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`;
        document.head.appendChild(script);

        window.gtag("js", new Date());
        window.gtag("config", analyticsId, {
            anonymize_ip: true
        });
    }

    function applyTrackingConsent(choice, options = {}) {
        if (!mas0ngInjectConfig.trackingEnabled) {
            window[`ga-disable-${analyticsId}`] = true;
            window.gtag("consent", "update", deniedConsent);
            clearAnalyticsCookies();
            return "disabled";
        }

        const nextChoice = choice === "granted" ? "granted" : "denied";
        if (options.persist !== false) {
            saveTrackingConsent(nextChoice);
        }

        if (nextChoice === "granted") {
            window[`ga-disable-${analyticsId}`] = false;
            window.gtag("consent", "update", {
                ...deniedConsent,
                analytics_storage: "granted"
            });
            loadGoogleAnalytics();
            return nextChoice;
        }

        window[`ga-disable-${analyticsId}`] = true;
        window.gtag("consent", "update", deniedConsent);
        clearAnalyticsCookies();
        return nextChoice;
    }

    window.mas0ngPrivacy = {
        getConsent: readTrackingConsent,
        setConsent: applyTrackingConsent,
        openChoices: () => document.dispatchEvent(new CustomEvent("mas0ng:openPrivacyChoices"))
    };
    window.setTrackingConsent = applyTrackingConsent;
    window.openPrivacyChoices = window.mas0ngPrivacy.openChoices;

    const storedConsent = readTrackingConsent();
    if (!mas0ngInjectConfig.trackingEnabled) {
        clearAnalyticsCookies();
    } else if (storedConsent) {
        applyTrackingConsent(storedConsent, { persist: false });
    }

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
    const mobileSidebarQuery = window.matchMedia("(max-width: 560px)");

    function isInternalMas0ngUrl(url) {
        return url.hostname === "mas0ng.com" || url.hostname.endsWith(".mas0ng.com");
    }

    function readSidebarOpen() {
        if (mobileSidebarQuery.matches) {
            return false;
        }

        if (!mas0ngInjectConfig.rememberNav) {
            return mas0ngInjectConfig.startOpen;
        }

        try {
            const savedValue = localStorage.getItem(sidebarStorageKey);
            return savedValue === null ? mas0ngInjectConfig.startOpen : savedValue === "true";
        } catch (error) {
            return mas0ngInjectConfig.startOpen;
        }
    }

    function saveSidebarOpen(isOpen) {
        if (!mas0ngInjectConfig.rememberNav) return;
        if (mobileSidebarQuery.matches) return;

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
        if (!mas0ngInjectConfig.navEnabled) return;

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
                ${mas0ngInjectConfig.trackingEnabled ? `<button class="site-sidebar__utility-link site-sidebar__utility-link--button" type="button" data-privacy-choices>
                    <span class="site-sidebar__glyph site-sidebar__glyph--privacy-choices" aria-hidden="true">
                        <img src="${rootPrefix}assets/images/sidebar/light/privacy-choices.png" data-themed-icon data-icon-root="${rootPrefix}assets/images/sidebar" data-icon-base="privacy-choices" alt="" />
                    </span>
                    <span>Privacy Choices</span>
                </button>` : ""}
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

        function closeSidebarOnMobile() {
            if (mobileSidebarQuery.matches) {
                setSidebarOpen(false);
            }
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

        const privacyChoiceButton = sidebar.querySelector("[data-privacy-choices]");
        privacyChoiceButton?.addEventListener("click", () => {
            if (typeof window.openPrivacyChoices === "function") {
                window.openPrivacyChoices();
            }
        });

        closeSidebarOnMobile();
        if (typeof mobileSidebarQuery.addEventListener === "function") {
            mobileSidebarQuery.addEventListener("change", closeSidebarOnMobile);
        } else if (typeof mobileSidebarQuery.addListener === "function") {
            mobileSidebarQuery.addListener(closeSidebarOnMobile);
        }
    }

    function setupConsentBanner() {
        if (!mas0ngInjectConfig.trackingEnabled) return;

        const banner = document.createElement("section");
        banner.className = "consent-banner";
        banner.hidden = true;
        banner.innerHTML = `
            <div class="consent-banner__panel" role="dialog" aria-modal="false" aria-labelledby="consent-banner-title">
                <div class="consent-banner__copy">
                    <span class="consent-banner__main-icon" aria-hidden="true">
                        <img src="${rootPrefix}assets/images/sidebar/light/tracking-choice.png" data-themed-icon data-icon-root="${rootPrefix}assets/images/sidebar" data-icon-base="tracking-choice" alt="" />
                    </span>
                    <div>
                        <p class="consent-banner__eyebrow">Privacy choice</p>
                        <h2 id="consent-banner-title">Tracking is off unless you opt in.</h2>
                        <p>
                            Optional Google Analytics helps me understand visits and improve the site.
                            You can keep tracking off, which is best for privacy, or choose to allow analytics.
                        </p>
                        <a href="${rootPrefix}privacy.html">Read the privacy policy</a>
                    </div>
                </div>
                <div class="consent-banner__actions" aria-label="Tracking choices">
                    <button class="consent-banner__button consent-banner__button--deny" type="button" data-consent-deny>
                        <span class="consent-banner__button-icon" aria-hidden="true">
                            <img src="${rootPrefix}assets/images/sidebar/light/tracking-off.png" data-themed-icon data-icon-root="${rootPrefix}assets/images/sidebar" data-icon-base="tracking-off" alt="" />
                        </span>
                        <span>Keep tracking off</span>
                    </button>
                    <button class="consent-banner__button consent-banner__button--allow" type="button" data-consent-allow>
                        <span class="consent-banner__button-icon" aria-hidden="true">
                            <img src="${rootPrefix}assets/images/sidebar/light/analytics.png" data-themed-icon data-icon-root="${rootPrefix}assets/images/sidebar" data-icon-base="analytics" alt="" />
                        </span>
                        <span>Allow analytics</span>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(banner);
        updateThemedIcons(banner);

        const toast = document.createElement("div");
        toast.className = "consent-toast";
        toast.hidden = true;
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");
        document.body.appendChild(toast);

        const denyButton = banner.querySelector("[data-consent-deny]");
        const allowButton = banner.querySelector("[data-consent-allow]");
        let toastTimer = null;

        function showConsentToast(message) {
            toast.textContent = message;
            toast.hidden = false;
            toast.classList.add("is-visible");
            clearTimeout(toastTimer);
            toastTimer = setTimeout(() => {
                toast.classList.remove("is-visible");
                toast.hidden = true;
            }, 3200);
        }

        function hideBanner() {
            banner.hidden = true;
            document.body.classList.remove("has-consent-banner");
        }

        function showBanner(force = false) {
            const currentConsent = window.mas0ngPrivacy?.getConsent?.();
            if (!force && currentConsent) return;

            banner.hidden = false;
            document.body.classList.add("has-consent-banner");
            denyButton?.focus({ preventScroll: true });
        }

        denyButton?.addEventListener("click", () => {
            window.mas0ngPrivacy?.setConsent?.("denied");
            hideBanner();
            showConsentToast("Analytics tracking is off.");
        });

        allowButton?.addEventListener("click", () => {
            window.mas0ngPrivacy?.setConsent?.("granted");
            hideBanner();
            showConsentToast("Analytics tracking is now on.");
        });

        document.addEventListener("mas0ng:openPrivacyChoices", () => showBanner(true));
        showBanner(false);
    }

    function setupExternalWarning() {
        if (!mas0ngInjectConfig.externalWarningEnabled) return;

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
    setupConsentBanner();
    setupExternalWarning();
});
