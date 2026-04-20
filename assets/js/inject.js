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
                    linear-gradient(112deg, rgba(255,255,255,0.18) 0%, transparent 18%, rgba(110,216,255,0.08) 38%, transparent 64%),
                    radial-gradient(circle at 18% 18%, rgba(255,255,255,0.22), transparent 0 18%),
                    radial-gradient(circle at 82% 16%, rgba(110,216,255,0.26), transparent 0 18%),
                    linear-gradient(118deg, #010308 0%, #02060d 12%, #05111f 28%, #0a1f34 52%, #123f66 76%, #dbf4ff 112%);
                background-size: 180% 180%;
                animation: mxFooterShift 10s ease-in-out infinite alternate;
            }

            .mx-footer::before {
                content: "";
                position: absolute;
                inset: -42% -10% -8%;
                background:
                    radial-gradient(circle at 18% 28%, rgba(255,255,255,0.36), transparent 0 16%),
                    radial-gradient(circle at 76% 20%, rgba(110,216,255,0.44), transparent 0 18%),
                    radial-gradient(circle at 52% 12%, rgba(255,255,255,0.18), transparent 0 14%),
                    radial-gradient(circle at 40% 42%, rgba(37,127,213,0.28), transparent 0 22%),
                    linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 32%, rgba(110,216,255,0.12) 58%, transparent 84%);
                background-size: 130% 130%;
                filter: blur(18px);
                opacity: 0.98;
                animation: mxFooterFloat 12s ease-in-out infinite alternate;
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
                border-bottom: 1px solid rgba(255,255,255,0.2);
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

            @keyframes mxFooterShift {
                0% {
                    background-position: 0% 44%;
                }

                100% {
                    background-position: 100% 58%;
                }
            }

            @keyframes mxFooterFloat {
                0% {
                    transform: translate3d(-4%, -3%, 0) scale(1.08);
                    opacity: 0.86;
                }

                50% {
                    transform: translate3d(2%, -6%, 0) scale(1.14);
                    opacity: 1;
                }

                100% {
                    transform: translate3d(5%, 4%, 0) scale(1.1);
                    opacity: 0.92;
                }
            }

            @media (prefers-reduced-motion: reduce) {
                .mx-footer,
                .mx-footer::before {
                    animation: none;
                }
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
                        <div class="mx-footer-copy">&copy; ${currentYear} All Rights Reserved</div>
                    </div>
                    <div class="mx-footer-links">
                        <a href="https://www.mas0ng.com/" class="mx-footer-link">Home</a>
                        <a href="https://www.mas0ng.com/privacy" class="mx-footer-link">Privacy Policy</a>
                        <a href="https://www.mas0ng.com/terms" class="mx-footer-link">Terms &amp; Conditions</a>
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
