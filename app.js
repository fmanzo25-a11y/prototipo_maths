const levels = [
    { id: 1, type: 'main', label: '1', x: 100, y: 220 },
    { id: 2, type: 'main', label: '2', x: 280, y: 220, parent: 1 },
    { id: 3, type: 'extra', label: '🌿', x: 330, y: 110, parent: 2 },
    { id: 4, type: 'main', label: '3', x: 480, y: 220, parent: 2 },
    { id: 5, type: 'main', label: '4', x: 670, y: 220, parent: 4 },
    { id: 6, type: 'extra', label: '🌿', x: 740, y: 340, parent: 5 },
    { id: 7, type: 'challenge', label: '🍎', x: 760, y: 410, parent: 6 },
    { id: 8, type: 'main', label: '5', x: 860, y: 220, parent: 5 },
    { id: 9, type: 'extra', label: '🌿', x: 920, y: 110, parent: 8 },
    { id: 10, type: 'challenge', label: '🍎', x: 960, y: 180, parent: 9 },
    { id: 11, type: 'main', label: '6', x: 1050, y: 220, parent: 8 },
    { id: 12, type: 'main', label: '7', x: 1250, y: 220, parent: 11 },
    { id: 13, type: 'main', label: '8', x: 1450, y: 220, parent: 12 }
];

let completedLevels = new Set([]);

const svgContainer = document.getElementById('tree-svg');
const nodesContainer = document.getElementById('nodes-container');
const btnReset = document.getElementById('btn-reset');
const treeContainer = document.getElementById('tree-container');
const treeWrapper = document.getElementById('tree-wrapper');

const tooltip = document.getElementById('node-tooltip');
const tooltipTitle = document.getElementById('tooltip-title');
const tooltipSub = document.getElementById('tooltip-sub');
const elTotalStars = document.getElementById('total-stars');
const elStarsChip = document.getElementById('stars-chip');
const elProgressText = document.getElementById('progress-text');
const elProgressFill = document.getElementById('progress-mini-fill');

/* ───────── Estado persistente ───────── */

function saveState() {
    const state = {
        completed: Array.from(completedLevels),
        stars: {}
    };
    levels.forEach(l => {
        if (l.starsEarned !== undefined && l.starsEarned !== null) {
            state.stars[l.id] = l.starsEarned;
        }
    });
    localStorage.setItem('mathsics_tree_state', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('mathsics_tree_state');
    if (saved) {
        const state = JSON.parse(saved);
        completedLevels = new Set(state.completed || []);
        levels.forEach(l => {
            if (state.stars && state.stars[l.id]) {
                l.starsEarned = state.stars[l.id];
            }
        });
    }
}

/* ───────── HUD (estrellas y progreso) ───────── */

function updateHud(animate = false) {
    const mains = levels.filter(l => l.type === 'main');
    const doneMains = mains.filter(l => completedLevels.has(l.id)).length;
    const totalStars = levels.reduce((sum, l) => {
        return sum + (completedLevels.has(l.id) ? (l.starsEarned || 0) : 0);
    }, 0);

    elProgressText.textContent = `${doneMains} de ${mains.length}`;
    elProgressFill.style.width = `${(doneMains / mains.length) * 100}%`;

    const prev = parseInt(elTotalStars.textContent) || 0;
    elTotalStars.textContent = totalStars;
    if (animate && totalStars !== prev) {
        elStarsChip.classList.remove('bump');
        void elStarsChip.offsetWidth;
        elStarsChip.classList.add('bump');
    }
}

/* ───────── Tooltip ───────── */

function starsText(n) {
    return '★'.repeat(n) + '☆'.repeat(3 - n);
}

function showTooltip(level, nodeEl) {
    const status = getStatus(level);
    let title = '', sub = '';

    if (level.type === 'main') {
        title = `Nivel ${level.label}`;
        if (status === 'completed') { title += `  ${starsText(level.starsEarned || 0)}`; sub = 'Haz clic para repetirlo'; }
        else if (status === 'current') sub = 'Haz clic para empezar';
        else { title += ' 🔒'; sub = 'Completa el nivel anterior'; }
    } else if (level.type === 'extra') {
        title = 'Nivel opcional 🌿';
        if (status === 'completed') { title += `  ${starsText(level.starsEarned || 0)}`; sub = 'Haz clic para repetirlo'; }
        else sub = 'Es un extra, no es obligatorio';
    } else {
        title = 'Reto 🍎';
        if (status === 'completed') { title += `  ${starsText(level.starsEarned || 0)}`; sub = 'Haz clic para repetirlo'; }
        else if (status === 'current') sub = '¡Desbloqueado! Atrévete';
        else sub = 'Completa la hoja opcional para desbloquearlo';
    }

    tooltipTitle.textContent = title;
    tooltipSub.textContent = sub;

    const rect = nodeEl.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.bottom + 14}px`;
    tooltip.classList.add('visible');
}

function hideTooltip() {
    tooltip.classList.remove('visible');
}

treeWrapper.addEventListener('scroll', hideTooltip, { passive: true });

/* ───────── Inicio y renderizado ───────── */

function init() {
    const maxX = Math.max(...levels.map(l => l.x)) + 200;
    treeContainer.style.width = `${maxX}px`;

    loadState();

    const urlParams = new URLSearchParams(window.location.search);
    const justCompleted = parseInt(urlParams.get('completed'));
    const earnedStars = parseInt(urlParams.get('stars'));

    if (justCompleted) {
        // Limpiar URL para que no se repita al recargar
        window.history.replaceState({}, document.title, window.location.pathname);

        const level = levels.find(l => l.id === justCompleted);
        const isReplay = completedLevels.has(justCompleted);

        if (isReplay) {
            if (level && earnedStars > (level.starsEarned || 0)) {
                level.starsEarned = earnedStars;
                saveState();
            }
            renderFullTree();
            updateHud();
            setTimeout(() => {
                treeWrapper.scrollTo({ left: Math.max(0, level.x - window.innerWidth / 2), behavior: 'smooth' });
            }, 100);
        } else {
            // Primera vez que se completa, lo removemos para animarlo
            completedLevels.delete(justCompleted);
            if (level) level.starsEarned = null;

            renderFullTree(); // Renderizamos el árbol hasta antes de completar
            updateHud();

            setTimeout(() => {
                const nodeEl = document.getElementById(`node-${justCompleted}`);
                if (level && nodeEl) {
                    completeNode(level, nodeEl, earnedStars);
                }
            }, 500);
        }
    } else {
        renderFullTree();
        updateHud();
    }
}

function renderFullTree() {
    const visibleLevels = levels.filter(level => {
        const status = getStatus(level);
        if (status === 'completed' || status === 'current') return true;
        if (status === 'locked' && level.type === 'challenge') {
            const parentLevel = levels.find(l => l.id === level.parent);
            if (parentLevel && getStatus(parentLevel) === 'current') return true;
        }
        return false;
    });

    visibleLevels.forEach(level => {
        if (level.parent) {
            const parentLevel = levels.find(l => l.id === level.parent);
            if (parentLevel) {
                drawLine(parentLevel, level, null, true); // true = instant
            }
        }
    });

    visibleLevels.forEach(level => {
        createNode(level, true); // true = instant
    });

    const currentNodes = visibleLevels.filter(l => getStatus(l) === 'current');
    if (currentNodes.length > 0) {
        const target = currentNodes.find(l => l.type === 'main') || currentNodes[0];
        treeWrapper.scrollTo({ left: Math.max(0, target.x - window.innerWidth / 2 + 150) });
    }
}

function getStatus(level) {
    if (completedLevels.has(level.id)) return 'completed';
    if (!level.parent || completedLevels.has(level.parent)) return 'current';
    return 'locked';
}

function getTypeClass(level) {
    let typeClass = level.type === 'challenge'
        ? 'extra theme-pink challenge-fruit'
        : level.type;
    if (level.type === 'extra') typeClass += ' theme-emerald';
    return typeClass;
}

function getNodeInnerHTML(level, status) {
    if (status !== 'completed') {
        if (level.type === 'challenge') return `<span class="node-icon" style="font-size:2.4rem;">🍎</span>`;
        if (level.type === 'extra') return `<span class="node-icon">🌿</span>`;
        return `<span class="node-icon">${level.label}</span>`;
    }

    const earned = level.starsEarned || 0;

    // SVG 3 líneas curvas (halo top)
    const linesSvg = `
        <svg viewBox="0 0 100 100" class="lines-view">
            <path d="M 15.3 30 A 40 40 0 0 1 30 15.3" class="star-line ${earned >= 1 ? 'earned' : ''}" />
            <path d="M 39.6 11.3 A 40 40 0 0 1 60.4 11.3" class="star-line ${earned >= 2 ? 'earned' : ''}" />
            <path d="M 70 15.3 A 40 40 0 0 1 84.6 30" class="star-line ${earned >= 3 ? 'earned' : ''}" />
        </svg>
    `;

    const starPath = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";
    let starsHtml = '';
    for (let i = 1; i <= 3; i++) {
        starsHtml += `<svg viewBox="0 0 24 24" class="star-icon ${i <= earned ? 'earned' : 'unearned'}"><path d="${starPath}"/></svg>`;
    }

    let defaultIcon = '✓';
    let fs = '';
    if (level.type === 'challenge') { defaultIcon = '🍎'; fs = 'style="font-size:2.4rem;"'; }
    if (level.type === 'extra') { defaultIcon = '🌿'; }

    return `
        <div class="node-content">
            <span class="icon-default" ${fs}>${defaultIcon}</span>
            <span class="icon-hover">⟳</span>
        </div>
        <div class="node-decorations">
            ${linesSvg}
            <div class="stars-view">
                ${starsHtml}
            </div>
        </div>
    `;
}

function createNode(level, instant = false) {
    if (document.getElementById(`node-${level.id}`)) return;

    const status = getStatus(level);

    const nodeEl = document.createElement('div');
    nodeEl.id = `node-${level.id}`;
    nodeEl.className = `node ${getTypeClass(level)} ${status}${instant ? '' : ' is-hidden'}`;
    nodeEl.style.left = `${level.x}px`;
    nodeEl.style.top  = `${level.y}px`;

    nodeEl.innerHTML = getNodeInnerHTML(level, status);

    nodeEl.addEventListener('mouseenter', () => showTooltip(level, nodeEl));
    nodeEl.addEventListener('mouseleave', hideTooltip);

    nodeEl.addEventListener('click', () => {
        const s = getStatus(level);
        if (s === 'current' || s === 'completed') {
            // Ir al ejercicio en lugar de completarlo instantáneamente
            hideTooltip();
            window.location.href = `ejercicio.html?levelId=${level.id}`;
        } else if (s === 'locked') {
            nodeEl.classList.remove('nope');
            void nodeEl.offsetWidth;
            nodeEl.classList.add('nope');
        }
    });

    nodesContainer.appendChild(nodeEl);

    if (!instant) {
        // El pop-in lo resuelve la transición de `scale` al quitar .is-hidden
        requestAnimationFrame(() => requestAnimationFrame(() => {
            nodeEl.classList.remove('is-hidden');
        }));
    }
}

function updateNode(level) {
    const nodeEl = document.getElementById(`node-${level.id}`);
    if (!nodeEl) return;
    nodeEl.className = `node ${getTypeClass(level)} ${getStatus(level)}`;
    nodeEl.innerHTML = getNodeInnerHTML(level, getStatus(level));
}

/* ───────── Ramas ───────── */

// Colorea cada rama según el estado del nivel al que lleva:
//  - completed: el nivel destino ya está hecho (rama azul/verde)
//  - active: el nivel destino está disponible pero aún no se hace
function refreshLines() {
    svgContainer.querySelectorAll('.branch-line').forEach(path => {
        const toId = parseInt(path.dataset.to);
        const isExtra = path.dataset.kind === 'extra';
        const state = completedLevels.has(toId) ? 'completed' : 'active';
        path.setAttribute('class', `branch-line ${state}${isExtra ? ' to-extra' : ''}`);
    });
}

function drawLine(fromLevel, toLevel, onComplete, instant = false) {
    const lineId = `branch-${fromLevel.id}-${toLevel.id}`;
    if (document.getElementById(lineId)) {
        refreshLines();
        if (instant && onComplete) onComplete();
        return;
    }

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.id = lineId;
    path.dataset.to = toLevel.id;
    path.dataset.kind = toLevel.type === 'extra' ? 'extra' : 'main';

    let d = '';
    let sw = 16;

    if (fromLevel.type === 'main' && toLevel.type === 'main') {
        const dx = toLevel.x - fromLevel.x;
        const wave = (fromLevel.id % 2 === 0) ? -25 : 25;
        d = `M ${fromLevel.x} ${fromLevel.y} C ${fromLevel.x + dx/2.5} ${fromLevel.y + wave}, ${toLevel.x - dx/2.5} ${toLevel.y - wave}, ${toLevel.x} ${toLevel.y}`;
        sw = 22;
    } else if (toLevel.type === 'challenge') {
        d = `M ${fromLevel.x} ${fromLevel.y} Q ${fromLevel.x + 10} ${toLevel.y - 30}, ${toLevel.x} ${toLevel.y}`;
        sw = 4;
        path.style.stroke = '#65a30d';
        path.dataset.kind = 'challenge';
    } else {
        const cx = fromLevel.x + (toLevel.x - fromLevel.x) / 1.5;
        d = `M ${fromLevel.x} ${fromLevel.y} Q ${cx} ${fromLevel.y}, ${toLevel.x} ${toLevel.y}`;
        sw = 12;
    }

    path.setAttribute('d', d);
    path.setAttribute('class', 'branch-line active');
    path.style.strokeWidth = sw;
    svgContainer.appendChild(path);
    refreshLines();

    if (instant) {
        path.style.strokeDashoffset = '0';
        if (toLevel.type === 'main') addDecorativeLeaves(path, fromLevel.id * 100 + toLevel.id);
        if (onComplete) onComplete();
        return;
    }

    path.getBoundingClientRect();
    const len = path.getTotalLength();
    path.style.strokeDasharray  = len;
    path.style.strokeDashoffset = len;
    path.getBoundingClientRect();

    path.style.transition = 'stroke-dashoffset 1s linear, stroke .6s ease';

    let fired = false;
    const done = () => {
        if (fired) return;
        fired = true;
        path.removeEventListener('transitionend', onTransEnd);
        clearTimeout(fallback);
        if (toLevel.type === 'main') addDecorativeLeaves(path, fromLevel.id * 100 + toLevel.id);
        if (onComplete) onComplete();
    };
    const onTransEnd = (e) => { if (e.propertyName === 'stroke-dashoffset') done(); };
    path.addEventListener('transitionend', onTransEnd);
    const fallback = setTimeout(done, 1300);

    requestAnimationFrame(() => {
        path.style.strokeDashoffset = '0';
    });
}

// Generador pseudo-aleatorio con semilla: las hojas quedan siempre en el mismo lugar
function seededRandom(seed) {
    let a = seed + 0x6D2B79F5;
    return function () {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

function addDecorativeLeaves(path, seed) {
    const len = path.getTotalLength();
    if (!len) return;
    const rand = seededRandom(seed);
    const colors = ['#86efac', '#4ade80', '#a7f3d0'];

    for (let i = 0; i < 3; i++) {
        const pt = path.getPointAtLength(len * (0.25 + rand() * 0.5));
        const side = rand() < 0.5 ? -1 : 1;
        const rot = side * (20 + rand() * 50) + (side < 0 ? 180 : 0);

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${pt.x} ${pt.y}) rotate(${rot})`);

        const leaf = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        leaf.setAttribute('d', 'M 0 0 C -12 -8,-12 -20, 0 -28 C 12 -20, 12 -8, 0 0');
        leaf.setAttribute('fill', colors[Math.floor(rand() * colors.length)]);
        leaf.setAttribute('class', 'leaf');
        leaf.style.setProperty('--s', (0.6 + rand() * 0.6).toFixed(2));
        leaf.style.animationDelay = `${(rand() * 0.4).toFixed(2)}s, ${(rand() * 2).toFixed(2)}s`;

        g.appendChild(leaf);
        svgContainer.appendChild(g);
    }
}

/* ───────── Completar un nivel ───────── */

function completeNode(level, nodeEl, forcedStars) {
    if (nodeEl.classList.contains('spin-reward') || nodeEl.classList.contains('animating-stars')) return;

    level.starsEarned = forcedStars;

    // 1. Giro 3D de recompensa
    nodeEl.classList.add('spin-reward');
    if (level.type === 'main') nodeEl.innerHTML = '✓';

    setTimeout(() => {
        nodeEl.classList.remove('spin-reward');
        completedLevels.add(level.id);
        saveState();
        refreshLines(); // la rama que llega a este nivel se pinta de azul

        // 2. Actualizamos el nodo y bloqueamos el hover temporalmente con 'animating-stars'
        updateNode(level);
        nodeEl.classList.add('animating-stars');

        // 3. Animación escalonada de las estrellas ganadas
        const stars = nodeEl.querySelectorAll('.star-icon.earned');
        stars.forEach((star, index) => {
            setTimeout(() => {
                star.classList.add('animate-fill');
                const r = star.getBoundingClientRect();
                burstConfetti(r.left + r.width / 2, r.top + r.height / 2, 10);
            }, index * 320);
        });

        const totalAnimTime = stars.length > 0 ? (stars.length * 320) + 600 : 500;

        // Si fue perfecto, gran explosión final
        if (stars.length === 3) {
            setTimeout(() => {
                const r = nodeEl.getBoundingClientRect();
                burstConfetti(r.left + r.width / 2, r.top, 40);
            }, 3 * 320);
        }

        // Suma de estrellas al HUD
        setTimeout(() => updateHud(true), stars.length * 320);

        // 4. Terminar la animación y empezar a ramificar
        setTimeout(() => {
            nodeEl.classList.remove('animating-stars');

            const children = levels.filter(l => l.parent === level.id);
            children.forEach(child => {
                drawLine(level, child, () => {
                    createNode(child);
                    if (child.type === 'extra') {
                        const grandchildren = levels.filter(l => l.parent === child.id);
                        grandchildren.forEach(gc => {
                            if (gc.type === 'challenge') {
                                drawLine(child, gc, () => createNode(gc));
                            }
                        });
                    }
                });
            });

            setTimeout(() => {
                const nextMain = children.find(l => l.type === 'main');
                if (nextMain) {
                    treeWrapper.scrollTo({
                        left: Math.max(0, nextMain.x - window.innerWidth / 2 + 150),
                        behavior: 'smooth'
                    });
                }
            }, 200);

        }, totalAnimTime);

    }, 600); // Esperar que acabe el giro 3D
}

btnReset.addEventListener('click', () => {
    completedLevels.clear();
    levels.forEach(l => l.starsEarned = null);
    localStorage.removeItem('mathsics_tree_state');
    svgContainer.innerHTML  = '';
    nodesContainer.innerHTML = '';
    hideTooltip();
    treeWrapper.scrollTo({ left: 0, behavior: 'smooth' });
    init();
});

init();
