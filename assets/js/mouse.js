(function trailingOutlineCursor() {
    if (window.matchMedia("(max-width: 768px)").matches) return;

    const style = document.createElement('style');
    style.textContent = `
        body { cursor: none; }
        .ghost-layer {
            position: fixed; top: 0; left: 0;
            pointer-events: none; z-index: 9999;
            transform: translate(-50%, -50%);
        }
        #ghost-core {
            width: 12px; height: 12px; background-color: #000;
            transition: background-color 0.15s, width 0.15s, height 0.15s;
        }
        #ghost-outline {
            width: 24px; height: 24px; border: 2px solid #000; background-color: transparent;
            transition: width 0.15s, height 0.15s, border-color 0.15s;
        }
        #ghost-core.hovering { width: 32px; height: 32px; background-color: #fde047; border: 2px solid #000; }
        #ghost-outline.hovering { width: 32px; height: 32px; border-color: transparent; }
        a, button { cursor: none; }
    `;
    document.head.appendChild(style);

    const core = document.createElement('div'); core.id = 'ghost-core'; core.className = 'ghost-layer';
    const outline = document.createElement('div'); outline.id = 'ghost-outline'; outline.className = 'ghost-layer';

    document.body.appendChild(outline); document.body.appendChild(core);

    let mx = 0, my = 0, ox = 0, oy = 0;
    document.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });

    function animate() {
        core.style.left = `${mx}px`; core.style.top = `${my}px`;
        ox += (mx - ox) * 0.25; oy += (my - oy) * 0.25;
        outline.style.left = `${ox}px`; outline.style.top = `${oy}px`;
        requestAnimationFrame(animate);
    }
    animate();

    document.addEventListener('mouseover', (e) => {
        if (e.target.closest('a') || e.target.closest('button')) {
            core.classList.add('hovering'); outline.classList.add('hovering');
        }
    });
    document.addEventListener('mouseout', (e) => {
        if (e.target.closest('a') || e.target.closest('button')) {
            core.classList.remove('hovering'); outline.classList.remove('hovering');
        }
    });
})();