document.addEventListener("DOMContentLoaded", function () {
    const currentYear = new Date().getFullYear();
    
   
    const currentUrl = encodeURIComponent(window.location.href);
    
    const footer = document.createElement('footer');
    
    footer.className = "w-full bg-slate-900 text-white pt-16 pb-8 mt-auto border-t border-slate-800";

    footer.innerHTML = `
        <div class="max-w-7xl mx-auto px-6">
            
            <div class="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                
                <div class="text-3xl font-black tracking-tighter">
                    mas0ng<span class="text-blue-500">.com</span>
                </div>

                <nav>
                    <a href="/privacy/?return_to=${currentUrl}" class="text-slate-400 hover:text-white transition-colors duration-200 font-medium">
                        Privacy Policy
                    </a>
                </nav>
            </div>

            <div class="pt-8 border-t border-slate-800 text-center text-slate-500 text-xs tracking-[0.2em] uppercase">
                &copy; ${currentYear} mas0ng.com | All Rights Reserved
            </div>
        </div>
    `;

    document.body.appendChild(footer);
});