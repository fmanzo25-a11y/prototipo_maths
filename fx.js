/* ─────────────────────────────────────────────
   MATHSICS — efectos compartidos (confeti)
───────────────────────────────────────────── */
(function () {
    const COLORS = ['#3b82f6', '#6366f1', '#10b981', '#ec4899', '#f97316', '#fbbf24'];
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function layer() {
        let el = document.getElementById('fx-layer');
        if (!el) {
            el = document.createElement('div');
            el.id = 'fx-layer';
            document.body.appendChild(el);
        }
        return el;
    }

    function makePiece(extraClass) {
        const p = document.createElement('span');
        p.className = 'confetti-piece ' + (extraClass || '');
        const round = Math.random() < 0.35;
        const size = 6 + Math.random() * 7;
        p.style.width = size + 'px';
        p.style.height = (round ? size : size * 1.6) + 'px';
        p.style.borderRadius = round ? '50%' : '2px';
        p.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
        p.addEventListener('animationend', () => p.remove());
        return p;
    }

    // Explosión de confeti desde un punto de la pantalla (coordenadas de viewport)
    window.burstConfetti = function (x, y, count) {
        if (reduceMotion) return;
        count = count || 24;
        const host = layer();
        for (let i = 0; i < count; i++) {
            const p = makePiece();
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
            const dist = 70 + Math.random() * 150;
            p.style.left = x + 'px';
            p.style.top = y + 'px';
            p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
            p.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
            p.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
            p.style.setProperty('--dur', (0.9 + Math.random() * 0.7) + 's');
            host.appendChild(p);
        }
    };

    // Lluvia de confeti desde arriba (pantalla de resultados)
    window.rainConfetti = function (count) {
        if (reduceMotion) return;
        count = count || 70;
        const host = layer();
        for (let i = 0; i < count; i++) {
            const p = makePiece('fall');
            p.style.left = Math.random() * 100 + 'vw';
            p.style.top = '-20px';
            p.style.setProperty('--sway', (Math.random() * 120 - 60) + 'px');
            p.style.setProperty('--rot', (Math.random() * 900 - 450) + 'deg');
            p.style.setProperty('--dur', (2.2 + Math.random() * 1.8) + 's');
            p.style.animationDelay = Math.random() * 0.9 + 's';
            host.appendChild(p);
        }
    };
})();
