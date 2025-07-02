
// starfield-background.js : animation du fond spatial (warp)
// (copie de starfield.js, version étoile simple)
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let stars = [];
const STAR_COUNT = 180;
const STAR_SPEED = 0.7;
const STAR_SIZE = 1.2;
function resizeStarfield() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
function createStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            z: Math.random() * canvas.width,
            o: 0.7 + Math.random() * 0.3
        });
    }
}
function drawStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < STAR_COUNT; i++) {
        let star = stars[i];
        let k = 128.0 / star.z;
        let sx = star.x * k + canvas.width / 2;
        let sy = star.y * k + canvas.height / 2;
        if (sx < 0 || sx >= canvas.width || sy < 0 || sy >= canvas.height) {
            // Reset star
            star.x = Math.random() * canvas.width - canvas.width / 2;
            star.y = Math.random() * canvas.height - canvas.height / 2;
            star.z = canvas.width;
        }
        let size = STAR_SIZE * (1 - star.z / canvas.width);
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(200,255,255,${star.o})`;
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}
function moveStars() {
    for (let i = 0; i < STAR_COUNT; i++) {
        stars[i].z -= STAR_SPEED;
        if (stars[i].z <= 0) {
            stars[i].z = canvas.width;
        }
    }
}
function animateStarfield() {
    moveStars();
    drawStars();
    requestAnimationFrame(animateStarfield);
}
window.addEventListener('resize', () => {
    resizeStarfield();
    createStars();
});
window.addEventListener('DOMContentLoaded', () => {
    resizeStarfield();
    createStars();
    animateStarfield();
});
