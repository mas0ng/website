(function injectHead() {
    try {
        if (!document.head) return; // Safety check
        const fragment = document.createDocumentFragment();

        const add = (type, attrs, inlineScript = null) => {
            const el = document.createElement(type);
            for (const [key, value] of Object.entries(attrs)) {
                el.setAttribute(key, value);
            }
            if (inlineScript) {
                el.textContent = inlineScript;
            }
            fragment.appendChild(el);
        };

        // Inject CookieYes
        add("script", { id: "cookieyes", type: "text/javascript", src: "https://cdn-cookieyes.com/client_data/152416f70a69c8655ea60feb58656f08/script.js" });

        // Inject Google Tag Manager & Consent
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
        add("script", { async: "true", src: "https://www.googletagmanager.com/gtag/js?id=G-Z69GPRYZS0" });
        add("script", {}, `
            gtag('js', new Date());
            gtag('config', 'G-Z69GPRYZS0');
        `);

        // Inject Favicons & PWA Manifest
        add("link", { rel: "icon", type: "image/png", sizes: "96x96", href: "/assets/icons/siteIcons/favicons/favicon-96x96.png" });
        add("link", { rel: "icon", type: "image/svg+xml", href: "/assets/icons/siteIcons/favicons/favicon.svg" });
        add("link", { rel: "shortcut icon", href: "/assets/icons/siteIcons/favicons/favicon.ico" });
        add("link", { rel: "apple-touch-icon", sizes: "180x180", href: "/assets/icons/siteIcons/favicons/apple-touch-icon.png" });
        add("meta", { name: "apple-mobile-web-app-title", content: "mas0ng.com" });
        add("link", { rel: "manifest", href: "/assets/icons/siteIcons/favicons/site.webmanifest" });

        document.head.appendChild(fragment);
    } catch (error) {
        console.error("Head injection failed:", error);
    }
})();

document.addEventListener("DOMContentLoaded", function injectFooter() {
    try {
        const currentYear = new Date().getFullYear();

        const config = {
            columns: {
                col1: {
                    title: "Navigation",
                    links: [
                        { name: "Home", url: "/" },
                        { name: "Expertise", url: "/#skills" },
                        { name: "Impact", url: "/#stats" },
                        { name: "Socials", url: "/#connect" }
                    ]
                },
                col2: {
                    title: "Legal",
                    links: [
                        { name: "Privacy Policy", url: "/privacy.html" }
                    ]
                }
            }
        };

        const footer = document.createElement('footer');
        footer.className = "w-full max-w-4xl mx-auto mt-16 mb-12";
        
        const style = document.createElement('style');
        style.textContent = `
            .brutal-footer-box {
                border: 3px solid #000;
                box-shadow: 6px 6px 0px #000;
                background: #fff;
                font-family: 'Space Grotesk', sans-serif;
            }
            .brutal-link {
                font-weight: 800;
                text-transform: uppercase;
                border-bottom: 3px solid transparent;
                transition: all 0.2s;
                display: inline-block;
            }
            .brutal-link:hover {
                border-bottom: 3px solid #000;
                transform: translateX(4px);
            }
        `;
        document.head.appendChild(style);

        const generateLinks = (linkArray) => {
            return linkArray.map(link => 
                `<li><a href="${link.url}" class="brutal-link text-sm">${link.name}</a></li>`
            ).join('');
        };

        footer.innerHTML = `
            <div class="brutal-footer-box p-8 md:p-12 flex flex-col md:flex-row justify-between gap-12">
                
                <div class="flex gap-16">
                    <div>
                        <h3 class="font-extrabold uppercase text-xl border-b-4 border-black inline-block pb-1 mb-6">${config.columns.col1.title}</h3>
                        <ul class="space-y-4">
                            ${generateLinks(config.columns.col1.links)}
                        </ul>
                    </div>
                    <div>
                        <h3 class="font-extrabold uppercase text-xl border-b-4 border-black inline-block pb-1 mb-6">${config.columns.col2.title}</h3>
                        <ul class="space-y-4">
                            ${generateLinks(config.columns.col2.links)}
                        </ul>
                    </div>
                </div>

                <div class="flex flex-col items-start md:items-end justify-between border-t-4 border-black md:border-t-0 pt-6 md:pt-0">
                    <h2 class="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none">Mason.</h2>
                    <p class="font-bold uppercase tracking-widest text-xs mt-6 bg-yellow-300 px-2 py-1 border-2 border-black">
                        © ${currentYear} All Rights Reserved
                    </p>
                </div>

            </div>
        `;

        // If the index page already has a small footer at the bottom, we insert before it or replace it
        // The safest approach is just appending to the body, but it looks great as a massive standalone block.
        document.body.appendChild(footer);
    } catch (error) {
        console.error("Footer injection failed:", error);
    }
});