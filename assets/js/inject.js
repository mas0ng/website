

(function injectHead() {
    const add = (type, attrs) => {
        const el = document.createElement(type);
        for (const [key, value] of Object.entries(attrs)) {
            el.setAttribute(key, value);
        }
        document.head.appendChild(el);
    };

    
    add("link", { rel: "icon", type: "image/png", sizes: "96x96", href: "/assets/icons/siteIcons/favicons/favicon-96x96.png" });
    add("link", { rel: "icon", type: "image/svg+xml", href: "/assets/icons/siteIcons/favicons/favicon.svg" });
    add("link", { rel: "shortcut icon", href: "/assets/icons/siteIcons/favicons/favicon.ico" });
    add("link", { rel: "apple-touch-icon", sizes: "180x180", href: "/assets/icons/siteIcons/favicons/apple-touch-icon.png" });
    
    add("meta", { name: "apple-mobile-web-app-title", content: "mas0ng.com" });
    
    add("link", { rel: "manifest", href: "/assets/icons/siteIcons/favicons/site.webmanifest" });
})();


document.addEventListener("DOMContentLoaded", function injectFooter() {
    const currentYear = new Date().getFullYear();

    const config = {
        socials: [
            { name: "TikTok", url: "https://www.tiktok.com/@mas0ng", icon: "/assets/icons/socials/tiktok.svg" },
            { name: "Instagram", url: "https://www.instagram.com/mas0ngi/", icon: "/assets/icons/socials/instagram.svg" },
            { name: "LinkedIn", url: "/404", icon: "/assets/icons/socials/linkedin.svg" },
            { name: "Github", url: "https://github.com/mas0ng", icon: "/assets/icons/socials/github.svg" },
            { name: "Signal", url: "https://signal.me/#eu/Js8_IVmBa0zw4nGdLTvE1Fbcg6mUcmm11h34T-4CjCwgk8jx76hAQbvCkyHjY9JO", icon: "/assets/icons/socials/signal.svg" },
            { name: "Email", url: "mailto:mason@mas0ng.com", icon: "/assets/icons/socials/email.svg" }
        ],
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
    footer.className = "w-full max-w-4xl mx-auto p-4 md:p-8 mt-12 mb-12";
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes footerFadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-footer { animation: footerFadeIn 0.6s ease-out forwards; }
        .footer-terminal {
            border: 2px solid #e2e8f0;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 30px -10px rgba(59, 130, 246, 0.1);
        }
        .footer-header {
            background: #f1f5f9;
            padding: 8px 12px;
            display: flex;
            align-items: center;
            border-bottom: 2px solid #e2e8f0;
        }
        .footer-dot { width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; }
        .social-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .social-card:hover {
            border-color: #3b82f6;
            background: #eff6ff;
            transform: translateY(-2px);
        }
        .custom-icon { width: 24px; height: 24px; object-fit: contain; }
    `;
    document.head.appendChild(style);
    footer.classList.add('animate-footer');

    const generateLinks = (linkArray) => {
        return linkArray.map(link => 
            `<li><a href="${link.url}" class="text-slate-400 hover:text-blue-500 transition-colors duration-200 text-xs font-medium tracking-tight font-mono">${link.name}</a></li>`
        ).join('');
    };

    const generateSocials = (socialArray) => {
        return socialArray.map(social => `
            <a href="${social.url}" target="_blank" class="social-card p-6 rounded-xl flex flex-col items-center justify-center gap-3">
                <img src="${social.icon}" alt="${social.name}" class="custom-icon" onerror="this.style.opacity='0.5'">
                <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">${social.name}</span>
            </a>
        `).join('');
    };

    footer.innerHTML = `
        <div class="footer-terminal font-sans">
            <!-- Terminal Header -->
            <div class="footer-header justify-between">
                <div class="flex">
                    <div class="footer-dot" style="background: #ff5f56;"></div>
                    <div class="footer-dot" style="background: #ffbd2e;"></div>
                    <div class="footer-dot" style="background: #27c93f;"></div>
                </div>
                <div class="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">mas0ng.com — footer</div>
                <div class="w-10"></div>
            </div>

            <div class="p-8 md:p-12">
                
                <div class="mb-12">
                    <div class="flex items-center gap-2 mb-6">
                        <span class="text-green-500 font-bold font-mono">mason@home:~$</span>
                        <span class="text-blue-500 font-bold font-mono">connect --grid</span>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        ${generateSocials(config.socials)}
                    </div>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10 pt-10 border-t border-slate-50">
                    <div>
                        <h3 class="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-4 font-mono">${config.columns.col1.title}</h3>
                        <ul class="space-y-2" style="list-style: none; padding: 0;">
                            ${generateLinks(config.columns.col1.links)}
                        </ul>
                    </div>
                    <div>
                        <h3 class="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-4 font-mono">${config.columns.col2.title}</h3>
                        <ul class="space-y-2" style="list-style: none; padding: 0;">
                            ${generateLinks(config.columns.col2.links)}
                        </ul>
                    </div>
                    <div class="col-span-2 flex flex-col md:items-end md:justify-start">
                        <span class="text-xl font-black tracking-tighter text-slate-900 mb-2" style="font-family: 'Plus Jakarta Sans', sans-serif;">
                            mas0ng<span class="text-blue-500">.com</span>
                        </span>
                        <p class="text-[10px] text-slate-400 uppercase tracking-widest font-mono">&copy; ${currentYear} All Rights Reserved</p>
                    </div>
                </div>

                <div class="flex justify-between items-center pt-8 border-t border-slate-50">
                    
                    <div class="flex items-center gap-2">
                         <span class="text-green-500 font-bold font-mono">~$</span>
                         <span class="w-1.5 h-4 bg-blue-500 animate-pulse"></span>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(footer);
});