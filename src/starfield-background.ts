/* ============================================================
 * starfield-background.ts — fond spatial warp (canvas 2D)
 * Conservé comme backdrop permanent. API: window.StarfieldBG.setBoost(factor)
 * ============================================================ */

interface Star {
    x: number;
    y: number;
    z: number;
    o: number;
}

interface StarfieldBG {
    setBoost: (f: number) => void;
    getBoost: () => number;
}

declare global {
    interface Window {
        StarfieldBG: StarfieldBG;
    }
}

const canvas = document.getElementById('starfield') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
let stars: Star[] = [];
const STAR_COUNT = 220;
let starSpeed = 0.7;          // base
let boostFactor = 1;          // multiplicateur runtime

function resizeStarfield() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function createStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * canvas.width - canvas.width / 2,
            y: Math.random() * canvas.height - canvas.height / 2,
            z: Math.random() * canvas.width,
            o: 0.7 + Math.random() * 0.3
        });
    }
}

function drawStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const speed = starSpeed * boostFactor;
    for (let i = 0; i < STAR_COUNT; i++) {
        const star = stars[i];
        const k = 128.0 / star.z;
        const sx = star.x * k + canvas.width / 2;
        const sy = star.y * k + canvas.height / 2;
        if (sx < 0 || sx >= canvas.width || sy < 0 || sy >= canvas.height) {
            star.x = Math.random() * canvas.width - canvas.width / 2;
            star.y = Math.random() * canvas.height - canvas.height / 2;
            star.z = canvas.width;
        }
        const size = 1.2 * (1 - star.z / canvas.width) * (1 + boostFactor * 0.8);
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, 2 * Math.PI);
        // Teinte légèrement plus froide quand on booste (hyperspace)
        const blue = boostFactor > 2;
        ctx.fillStyle = blue
            ? `rgba(${180 - boostFactor * 10}, ${210}, 255, ${star.o})`
            : `rgba(200, 255, 255, ${star.o})`;
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 8 + boostFactor * 6;
        ctx.fill();
        ctx.shadowBlur = 0;
        // Streak quand très rapide
        if (boostFactor > 2.5) {
            const prevK = 128.0 / (star.z + speed * 12);
            const px = star.x * prevK + canvas.width / 2;
            const py = star.y * prevK + canvas.height / 2;
            ctx.strokeStyle = `rgba(150, 220, 255, ${0.25 * star.o})`;
            ctx.lineWidth = size * 0.8;
            ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(sx, sy); ctx.stroke();
        }
        star.z -= speed;
        if (star.z <= 0) star.z = canvas.width;
    }
}

const TARGET_FPS = 60;
const FRAME_INTERVAL = 1000 / TARGET_FPS;
let lastFrameTime = 0;

function animateStarfield(timestamp: number) {
    if (timestamp - lastFrameTime >= FRAME_INTERVAL) {
        lastFrameTime = timestamp;
        drawStars();
    }
    requestAnimationFrame(animateStarfield);
}

window.addEventListener('resize', () => { resizeStarfield(); createStars(); });
window.addEventListener('DOMContentLoaded', () => {
    resizeStarfield();
    createStars();
    requestAnimationFrame(animateStarfield);
});

// API publique : permet à la 3D de booster le warp pendant un saut hyperspace
window.StarfieldBG = {
    setBoost: function (f: number) { boostFactor = f; },
    getBoost: function () { return boostFactor; }
};

export {};
