(function dynamicShadowCursor() {
    if (window.matchMedia("(max-width: 768px)").matches) return;

    const style = document.createElement('style');
    style.textContent = `
        body { cursor: none; }
        .brutal-cursor-layer {
            position: fixed; top: 0; left: 0;
            width: 20px; height: 20px;
            pointer-events: none; z-index: 9999;
            transform: translate(-50%, -50%);
        }
        #cursor-shadow { background-color: #000; transition: width 0.15s, height 0.15s; }
        #cursor-main {
            background-color: #fff; border: 2px solid #000;
            transition: background-color 0.15s, width 0.15s, height 0.15s;
        }
        #cursor-main.hovering { background-color: #fde047; width: 40px; height: 40px; }
        #cursor-shadow.hovering { width: 40px; height: 40px; }
        a, button { cursor: none; }
    `;
    document.head.appendChild(style);

    const shadow = document.createElement('div');
    shadow.id = 'cursor-shadow'; shadow.className = 'brutal-cursor-layer';
    
    const main = document.createElement('div');
    main.id = 'cursor-main'; main.className = 'brutal-cursor-layer';

    document.body.appendChild(shadow); document.body.appendChild(main);

    let mouseX = 0, mouseY = 0, shadowX = 0, shadowY = 0;
    document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

    function animate() {
        // Main box follows instantly
        main.style.left = `${mouseX}px`; main.style.top = `${mouseY}px`;
        // Shadow drags slightly behind, creating a dynamic 3D effect
        shadowX += (mouseX - shadowX) * 0.4; shadowY += (mouseY - shadowY) * 0.4;
        shadow.style.left = `${shadowX + 4}px`; shadow.style.top = `${shadowY + 4}px`;
        requestAnimationFrame(animate);
    }
    animate();

    document.addEventListener('mouseover', (e) => {
        if (e.target.closest('a') || e.target.closest('button')) {
            main.classList.add('hovering'); shadow.classList.add('hovering');
        }
    });
    document.addEventListener('mouseout', (e) => {
        if (e.target.closest('a') || e.target.closest('button')) {
            main.classList.remove('hovering'); shadow.classList.remove('hovering');
        }
    });
})();