// --- PART 1: HEAD INJECTION (Favicons & Meta) ---
(function() {
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


// --- PART 2: BODY INJECTION (Footer) ---
document.addEventListener("DOMContentLoaded", function () {
    const currentYear = new Date().getFullYear();
    const currentUrl = encodeURIComponent(window.location.href);

    // CONFIGURATION: Edit links AND icon paths here
    const config = {
        socials: {
            tiktok: {
                url: "https://tiktok.com/@yourusername",
                icon: "/assets/icons/socials/tiktok.svg"
            },
            instagram: {
                url: "https://instagram.com/yourusername",
                icon: "/assets/icons/socials/instagram.svg"
            },
            signal: {
                url: "https://signal.me/#p/yourusername", 
                icon: "/assets/icons/socials/signal.svg"
            },
            github: {
                url: "https://github.com/yourusername",
                icon: "/assets/icons/socials/github.svg"
            }
        },
        columns: {
            col1: {
                title: "Pages",
                links: [
                    { name: "Home", url: "/" },
                    { name: "Socials", url: "/socials" },
                    { name: "Projects", url: "/projects" },
                    { name: "Docs", url: "/docs" }
                ]
            },
            col2: {
                title: "",
                links: [
                    //{ name: "File Browser", url: "/files" },
                    //{ name: "Plex Media", url: "/media" },
                    //{ name: "Requestrr", url: "/requests" },
                    //{ name: "Overseerr", url: "/overseerr" }
                ]
            },
            col3: {
                title: "",
                links: [
                    //{ name: "Uptime Kuma", url: "/status" },
                    //{ name: "Grafana", url: "/grafana" },
                    //{ name: "Portainer", url: "/portainer" },
                    //{ name: "Logs", url: "/logs" }
                ]
            },
            col4: {
                title: "Legal",
                links: [
                    { name: "Privacy Policy", url: `/legal.html?doc=privacy` },
                    { name: "Terms of Service", url: `/legal.html?doc=tos` },
                    { name: "Contact", url: "mailto:contact@mas0ng.com" }
                ]
            }
        }
    };

    const footer = document.createElement('footer');
    footer.className = "w-full p-4 md:p-8 mt-auto fade-in";
    footer.style.animation = "fadeIn 0.5s ease-out forwards"; 
    footer.style.animationDelay = "0.3s";

    const generateLinks = (linkArray) => {
        return linkArray.map(link => 
            `<li><a href="${link.url}" class="text-slate-400 hover:text-blue-400 transition-colors duration-200 text-sm font-medium tracking-wide">${link.name}</a></li>`
        ).join('');
    };

    // Note: I added 'group' to the <a> tags and 'group-hover:invert group-hover:brightness-0' to the <img> tags.
    // This ensures that when you hover the button, the SVG turns white (assuming your SVGs are black or colored).
    footer.innerHTML = `
        <div class="bg-slate-900/90 backdrop-blur-md rounded-[2rem] p-8 md:p-12 shadow-2xl border border-slate-800 mx-auto max-w-7xl relative overflow-hidden group/card">
            
            <div class="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none group-hover/card:bg-blue-600/20 transition-all duration-700"></div>

            <div class="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 mb-12">
                <div><h3 class="font-bold text-slate-200 mb-4 tracking-tight">${config.columns.col1.title}</h3><ul class="space-y-3">${generateLinks(config.columns.col1.links)}</ul></div>
                <div><h3 class="font-bold text-slate-200 mb-4 tracking-tight">${config.columns.col2.title}</h3><ul class="space-y-3">${generateLinks(config.columns.col2.links)}</ul></div>
                <div><h3 class="font-bold text-slate-200 mb-4 tracking-tight">${config.columns.col3.title}</h3><ul class="space-y-3">${generateLinks(config.columns.col3.links)}</ul></div>
                <div><h3 class="font-bold text-slate-200 mb-4 tracking-tight">${config.columns.col4.title}</h3><ul class="space-y-3">${generateLinks(config.columns.col4.links)}</ul></div>
            </div>

            <div class="relative z-10 flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-800/50 gap-6">
                
                <div class="flex items-center gap-2">
                    <span class="text-2xl font-black tracking-tighter text-white cursor-default">
                        mas0ng<span class="text-blue-500">.com</span>
                    </span>
                </div>

                <div class="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-medium hidden md:block">
                    &copy; ${currentYear} All Rights Reserved
                </div>

                <div class="flex gap-3">
                    <a href="${config.socials.tiktok.url}" target="_blank" class="group h-10 w-10 rounded-full bg-slate-800 hover:bg-[#000000] border border-slate-700 hover:border-[#ff0050] flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:shadow-[#00f2ea]/20 hover:-translate-y-1">
                        <img src="${config.socials.tiktok.icon}" alt="TikTok" class="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:brightness-0 group-hover:invert transition-all">
                    </a>
                    
                    <a href="${config.socials.instagram.url}" target="_blank" class="group h-10 w-10 rounded-full bg-slate-800 hover:bg-gradient-to-tr hover:from-yellow-500 hover:via-red-500 hover:to-purple-600 border border-slate-700 hover:border-transparent flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-1">
                        <img src="${config.socials.instagram.icon}" alt="Instagram" class="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:brightness-0 group-hover:invert transition-all">
                    </a>

                    <a href="${config.socials.signal.url}" target="_blank" class="group h-10 w-10 rounded-full bg-slate-800 hover:bg-[#3A76F0] border border-slate-700 hover:border-[#3A76F0] flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1">
                        <img src="${config.socials.signal.icon}" alt="Signal" class="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:brightness-0 group-hover:invert transition-all">
                    </a>

                    <a href="${config.socials.github.url}" target="_blank" class="group h-10 w-10 rounded-full bg-slate-800 hover:bg-black border border-slate-700 hover:border-slate-500 flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:shadow-white/10 hover:-translate-y-1">
                        <img src="${config.socials.github.icon}" alt="GitHub" class="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:brightness-0 group-hover:invert transition-all">
                    </a>
                </div>
            </div>

            <div class="text-center text-slate-600 text-[10px] uppercase tracking-widest mt-6 md:hidden">
                &copy; ${currentYear} mas0ng.com
            </div>
        </div>
    `;

    document.body.appendChild(footer);
});