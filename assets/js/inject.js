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

document.addEventListener("DOMContentLoaded", function injectFooter() {
    try {
        const currentYear = new Date().getFullYear();

        const style = document.createElement("style");
        style.textContent = `
            .mx-footer-wrap {
                width: 100%;
                margin-top: auto;
                padding: 0;
            }

            .mx-footer {
                position: relative;
                overflow: hidden;
                margin-top: 8px;
                padding: 28px 0;
                color: #ffffff;
                background:
                    radial-gradient(circle at 14% 20%, rgba(255,255,255,0.11), transparent 18%),
                    radial-gradient(circle at 84% 16%, rgba(255,255,255,0.09), transparent 16%),
                    radial-gradient(circle at 50% 0%, rgba(18, 196, 255, 0.12), transparent 28%),
                    linear-gradient(135deg, #090914 0%, #171036 20%, #4420b7 48%, #1d61e7 76%, #b44be9 100%);
            }

            .mx-footer-inner {
                width: min(100% - 32px, 1220px);
                margin: 0 auto;
                position: relative;
                z-index: 1;
            }

            .mx-footer-top {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                margin-bottom: 14px;
                padding-bottom: 14px;
                border-bottom: 1px solid rgba(255,255,255,0.16);
            }

            .mx-footer-brand {
                font-size: 1rem;
                font-weight: 800;
                letter-spacing: -0.04em;
                color: #ffffff;
            }

            .mx-footer-copy {
                font-size: 0.82rem;
                color: rgba(255,255,255,0.82);
                font-weight: 600;
                text-align: right;
            }

            .mx-footer-links {
                display: flex;
                flex-wrap: wrap;
                gap: 8px 16px;
            }

            .mx-footer-link {
                text-decoration: none;
                color: rgba(255,255,255,0.86);
                font-size: 0.88rem;
                font-weight: 600;
                transition: color .16s ease, opacity .16s ease;
            }

            .mx-footer-link:hover {
                color: #ffffff;
                opacity: 1;
            }

            @media (max-width: 640px) {
                .mx-footer {
                    padding: 22px 0;
                }

                .mx-footer-inner {
                    width: calc(100% - 24px);
                }

                .mx-footer-top {
                    flex-direction: column;
                    align-items: flex-start;
                }

                .mx-footer-copy {
                    text-align: left;
                }
            }
        `;
        document.head.appendChild(style);

        const footer = document.createElement("footer");
        footer.className = "mx-footer-wrap";
        footer.innerHTML = `
            <div class="mx-footer">
                <div class="mx-footer-inner">
                    <div class="mx-footer-top">
                        <div class="mx-footer-brand">Mason / @mas0ng</div>
                        <div class="mx-footer-copy">© ${currentYear} All Rights Reserved</div>
                    </div>
                    <div class="mx-footer-links">
                        <a href="https://www.mas0ng.com/" class="mx-footer-link">Home</a>
                        <a href="https://www.mas0ng.com/privacy" class="mx-footer-link">Privacy Policy</a>
                        <a href="https://www.mas0ng.com/terms" class="mx-footer-link">Terms & Conditions</a>
                        <a href="mailto:mason@mas0ng.com" class="mx-footer-link">Email</a>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(footer);
    } catch (error) {
        console.error("Footer injection failed:", error);
    }
});