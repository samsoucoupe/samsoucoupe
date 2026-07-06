/* ============================================================
 * mini-games.ts — Menu de mini-jeux + 3 jeux (canvas 2D)
 * Jeux : Space Invader, Space Snake, Meteor Dodge
 * Overlay piloté par cockpit-ui.ts.
 * ============================================================ */

// --- Canvas partagé ---
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let rafId: number | null = null;
let lastTime = 0;

// --- État ---
type GameId = 'invader' | 'snake' | 'meteor';
type GameState = 'menu' | 'playing' | 'gameover';
let state: GameState = 'menu';
let currentGame: GameId | null = null;

// --- Input ---
let keys: Record<string, boolean> = {};

// --- Score / extra HUD ---
let score = 0;
let extraLabel = '';
let extraVal = '';

// --- Callback score → HUD 3D ---
let onScoreCb: ((pts: number) => void) | null = null;

// --- High scores par jeu (localStorage) ---
const HS_KEY = 'samsoucoupe_highscores';
function loadHighScores(): Record<string, number> {
    try { return JSON.parse(localStorage.getItem(HS_KEY) || '{}'); } catch { return {}; }
}
function saveHighScore(game: string, pts: number): boolean {
    const hs = loadHighScores();
    if (pts > (hs[game] || 0)) { hs[game] = pts; localStorage.setItem(HS_KEY, JSON.stringify(hs)); return true; }
    return false;
}
function getHighScore(game: string): number {
    return loadHighScores()[game] || 0;
}
// Accumule le score mini-jeu (callback uniquement)
function addGameScore(points: number) {
    if (onScoreCb) onScoreCb(points);
}

// ============================================================
// INIT / API
// ============================================================
export function initMiniGames() {
    canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    if (!ctx) return;

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Clic sur le canvas → rejoue depuis gameover
    canvas.addEventListener('click', () => {
        if (state === 'gameover') {
            if (currentGame === 'invader') startInvader();
            else if (currentGame === 'snake') startSnake();
            else if (currentGame === 'meteor') startMeteor();
        }
    });

    // Cartes du menu
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', () => {
            const gid = (card as HTMLElement).dataset.game as GameId;
            if (gid) showGame(gid);
        });
    });

    // Bouton retour menu
    const back = document.getElementById('game-back');
    if (back) back.addEventListener('click', showMenu);

    // Bouton fermer
    const close = document.getElementById('games-close');
    if (close) close.addEventListener('click', closeGamesMenu);
}

export function openGamesMenu() {
    const overlay = document.getElementById('games-overlay');
    if (!overlay) return;
    overlay.classList.add('open');
    showMenu();
}

export function closeGamesMenu() {
    saveCurrentScore();
    stopGame();
    const overlay = document.getElementById('games-overlay');
    if (overlay) overlay.classList.remove('open');
    keys = {};
}

export function setOnGameScore(cb: (pts: number) => void) {
    onScoreCb = cb;
}

function showMenu() {
    saveCurrentScore();
    stopGame();
    state = 'menu';
    currentGame = null;
    const menu = document.getElementById('games-menu');
    const play = document.getElementById('games-play');
    const scoreBar = document.getElementById('games-score-bar');
    if (menu) menu.style.display = '';
    if (play) play.style.display = 'none';
    if (scoreBar) scoreBar.style.display = 'none';
}

function showGame(gameId: GameId) {
    if (!ctx || !canvas) return;
    state = 'playing';
    currentGame = gameId;
    const menu = document.getElementById('games-menu');
    const play = document.getElementById('games-play');
    const scoreBar = document.getElementById('games-score-bar');
    if (menu) menu.style.display = 'none';
    if (play) play.style.display = '';
    if (scoreBar) scoreBar.style.display = '';

    const hint = document.getElementById('game-hint');
    const extraLbl = document.getElementById('game-extra-label');

    if (gameId === 'invader') {
        if (hint) hint.textContent = '← → bouger · ESPACE tirer · Échap fermer';
        if (extraLbl) extraLbl.textContent = 'VIES';
        startInvader();
    } else if (gameId === 'snake') {
        if (hint) hint.textContent = '← → ↑ ↓ diriger · Échap fermer';
        if (extraLbl) extraLbl.textContent = 'LONG.';
        startSnake();
    } else if (gameId === 'meteor') {
        if (hint) hint.textContent = '← → esquiver · Échap fermer';
        if (extraLbl) extraLbl.textContent = 'VIES';
        startMeteor();
    }
}

function stopGame() {
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    state = 'menu';
}

function startLoop() {
    lastTime = performance.now();
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(gameLoop);
}

function endGame() {
    if (state === 'gameover') return;
    state = 'gameover';
    saveCurrentScore();
}

// Sauvegarde le high score si on quitte le jeu en cours (menu/fermeture)
function saveCurrentScore() {
    if (currentGame && score > 0) {
        saveHighScore(currentGame, score);
    }
}

// ============================================================
// INPUT
// ============================================================
function onKeyDown(e: KeyboardEvent) {
    const overlay = document.getElementById('games-overlay');
    if (!overlay || !overlay.classList.contains('open')) return;
    keys[e.key] = true;
    keys[e.code] = true;   // stocke aussi e.code pour Space

    // Bloque la propagation vers cockpit-ui
    if (e.key === ' ' || e.key.startsWith('Arrow')) {
        e.preventDefault();
        e.stopPropagation();
    }
    if (e.key === 'Escape') {
        closeGamesMenu();
        return;
    }
}

function onKeyUp(e: KeyboardEvent) {
    keys[e.key] = false;
    keys[e.code] = false;
}

// Edge detection : relance le jeu quand espace passe de pressé → relâché
let spacePrev = false;
function checkRestart() {
    const spaceNow = !!(keys[' '] || keys['Space'] || keys['Spacebar']);
    if (state === 'gameover' && spaceNow && !spacePrev) {
        if (currentGame === 'invader') startInvader();
        else if (currentGame === 'snake') startSnake();
        else if (currentGame === 'meteor') startMeteor();
    }
    spacePrev = spaceNow;
}

// ============================================================
// BOUCLE PARTAGÉE
// ============================================================
function gameLoop(now: number) {
    if (state === 'menu') return;
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    checkRestart();

    if (state === 'playing') {
        if (currentGame === 'invader') updateInvader(dt);
        else if (currentGame === 'snake') updateSnake(dt);
        else if (currentGame === 'meteor') updateMeteor(dt);
    }

    if (currentGame === 'invader') drawInvader();
    else if (currentGame === 'snake') drawSnake();
    else if (currentGame === 'meteor') drawMeteor();

    rafId = requestAnimationFrame(gameLoop);
}

// ============================================================
// HUD PARTAGÉ
// ============================================================
function updateHUD() {
    const sv = document.getElementById('game-score');
    if (sv) sv.textContent = String(score);
    const ev = document.getElementById('game-extra-val');
    if (ev) ev.textContent = extraVal;
}

function drawCanvasHUD() {
    if (!ctx || !canvas) return;
    ctx.fillStyle = '#5d6f95';
    ctx.font = '10px Orbitron, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE ' + score, 8, 14);
    ctx.textAlign = 'right';
    ctx.fillText((extraLabel || '') + ' ' + (extraVal || ''), canvas.width - 8, 14);
}

function drawGameOver(title: string, hint: string) {
    if (!ctx || !canvas) return;
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ff4d6d';
    ctx.font = 'bold 28px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, H / 2 - 30);
    ctx.fillStyle = '#9fb0d0';
    ctx.font = '14px Inter, monospace';
    ctx.fillText('Score: ' + score, W / 2, H / 2 - 5);
    // High score du jeu
    if (currentGame) {
        const hs = getHighScore(currentGame);
        ctx.fillStyle = hs === score && score > 0 ? '#38ffb0' : '#5d6f95';
        ctx.font = '11px Orbitron, monospace';
        ctx.fillText('RECORD ' + hs, W / 2, H / 2 + 15);
    }
    ctx.fillStyle = '#9fb0d0';
    ctx.font = '14px Inter, monospace';
    ctx.fillText(hint, W / 2, H / 2 + 38);
}

// ============================================================
// GAME 1: SPACE INVADER
// ============================================================
let invPlayerX = 240;
const INV_PY = 330, INV_PW = 28, INV_PH = 12, INV_SPD = 4;

interface Alien { x: number; y: number; alive: boolean; row: number; }
let invAliens: Alien[] = [];
let invDir = 1;
let invSpeed = 30;
const INV_COLS = 8, INV_ROWS = 4;
const INV_GX = 38, INV_GY = 28;
const INV_AW = 20, INV_AH = 14;

interface Bullet { x: number; y: number; vy: number; from: 'player' | 'alien'; }
let invBullets: Bullet[] = [];
let invLives = 3;
let invFireCd = 0;

const ALIEN_PATTERN = [
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,0,1,1,0,1,1],
    [1,1,1,1,1,1,1,1],
    [0,1,0,1,1,0,1,0],
    [1,0,1,0,0,1,0,1],
];
const ALIEN_COLORS = ['#b388ff', '#ec4899', '#ffb340', '#38ffb0'];

function startInvader() {
    score = 0; invLives = 3; extraLabel = 'VIES'; extraVal = '3';
    invBullets = []; invPlayerX = 240; invDir = 1; invSpeed = 30; invFireCd = 0;
    keys = {}; spacePrev = false;
    state = 'playing';
    spawnInvAliens();
    updateHUD();
    startLoop();
}

function spawnInvAliens() {
    invAliens = [];
    for (let r = 0; r < INV_ROWS; r++)
        for (let c = 0; c < INV_COLS; c++)
            invAliens.push({ x: 40 + c * INV_GX, y: 30 + r * INV_GY, alive: true, row: r });
}

function updateInvader(dt: number) {
    if (!canvas) return;
    const W = canvas.width, H = canvas.height;

    // Joueur
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) invPlayerX -= INV_SPD;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) invPlayerX += INV_SPD;
    invPlayerX = Math.max(INV_PW / 2, Math.min(W - INV_PW / 2, invPlayerX));

    // Tir
    invFireCd -= dt;
    const pB = invBullets.filter(b => b.from === 'player').length;
    if ((keys[' '] || keys['Spacebar'] || keys['Space']) && invFireCd <= 0 && pB < 3) {
        invBullets.push({ x: invPlayerX, y: INV_PY - INV_PH / 2, vy: -350, from: 'player' });
        invFireCd = 0.3;
    }

    // Aliens
    let lm = Infinity, rm = -Infinity, alive = 0;
    invAliens.forEach(a => { if (a.alive) { alive++; if (a.x < lm) lm = a.x; if (a.x > rm) rm = a.x; } });
    if (alive === 0) { spawnInvAliens(); invSpeed = Math.min(invSpeed + 15, 120); return; }

    const mul = 1 + (INV_COLS * INV_ROWS - alive) * 0.05;
    invAliens.forEach(a => { if (a.alive) a.x += invDir * invSpeed * mul * dt; });

    const mg = INV_AW / 2;
    const hitRight = rm >= W - mg;
    const hitLeft = lm <= mg;
    // Rebond seulement si on va dans la direction du bord (évite double-bounce)
    if ((hitRight && invDir > 0) || (hitLeft && invDir < 0)) {
        invDir *= -1;
        invAliens.forEach(a => { if (a.alive) a.y += 14; });
    }

    // Alien atteint le joueur
    invAliens.forEach(a => { if (a.alive && a.y + INV_AH / 2 >= INV_PY - INV_PH) endGame(); });

    // Alien tire
    if (Math.random() < 0.015 && alive > 0) {
        const sh = invAliens.filter(a => a.alive);
        const s = sh[Math.floor(Math.random() * sh.length)];
        invBullets.push({ x: s.x, y: s.y + INV_AH / 2, vy: 220, from: 'alien' });
    }

    // Tirs
    for (let i = invBullets.length - 1; i >= 0; i--) {
        const b = invBullets[i];
        b.y += b.vy * dt;
        if (b.y < -10 || b.y > H + 10) { invBullets.splice(i, 1); continue; }

        if (b.from === 'player') {
            for (const a of invAliens) {
                if (!a.alive) continue;
                if (b.x > a.x - INV_AW / 2 && b.x < a.x + INV_AW / 2 &&
                    b.y > a.y - INV_AH / 2 && b.y < a.y + INV_AH / 2) {
                    a.alive = false; invBullets.splice(i, 1);
                    const pts = (INV_ROWS - a.row) * 10;
                    score += pts; addGameScore(pts);
                    updateHUD(); break;
                }
            }
        } else {
            if (b.x > invPlayerX - INV_PW / 2 && b.x < invPlayerX + INV_PW / 2 &&
                b.y > INV_PY - INV_PH / 2 && b.y < INV_PY + INV_PH / 2) {
                invBullets.splice(i, 1); invLives--;
                extraVal = String(invLives); updateHUD();
                if (invLives <= 0) { endGame(); return; }
            }
        }
    }
}

function drawInvader() {
    if (!ctx || !canvas) return;
    const W = canvas.width, H = canvas.height;

    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#1a2a3a';
    for (let i = 0; i < 40; i++) ctx.fillRect((i * 73) % W, (i * 97) % H, 1, 1);

    if (state === 'playing') {
        // Aliens
        const cw = INV_AW / 8, ch = INV_AH / 6;
        invAliens.forEach(a => {
            if (!a.alive) return;
            ctx!.fillStyle = ALIEN_COLORS[a.row % 4];
            const ox = Math.round(a.x - INV_AW / 2), oy = Math.round(a.y - INV_AH / 2);
            for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++)
                if (ALIEN_PATTERN[r][c]) ctx!.fillRect(ox + c * cw, oy + r * ch, cw, ch);
        });
        // Joueur
        const ox = Math.round(invPlayerX - INV_PW / 2), oy = Math.round(INV_PY - INV_PH / 2);
        ctx.fillStyle = '#00e1ff'; ctx.fillRect(ox + 4, oy + 4, INV_PW - 8, INV_PH - 6);
        ctx.fillStyle = '#38ffb0'; ctx.fillRect(ox + 8, oy + 1, INV_PW - 16, 4);
        ctx.fillStyle = '#00e1ff'; ctx.fillRect(ox + INV_PW / 2 - 1, oy - 2, 2, 4);
        // Tirs
        invBullets.forEach(b => {
            ctx!.fillStyle = b.from === 'player' ? '#38ffb0' : '#ff4d6d';
            ctx!.fillRect(b.x - 1, b.y - 4, 2, 8);
        });
    }
    if (state === 'gameover') drawGameOver('GAME OVER', '[ESPACE] rejouer');
    drawCanvasHUD();
}

// ============================================================
// GAME 2: SPACE SNAKE
// ============================================================
const SK_CELL = 20;
const SK_COLS = 24, SK_ROWS = 18;

interface SkCell { x: number; y: number; }
let snake: SkCell[] = [];
let skDir: SkCell = { x: 1, y: 0 };
let skFood: SkCell = { x: 0, y: 0 };
let skTimer = 0;
let skInterval = 0.15;
let skLength = 3;

function startSnake() {
    score = 0; extraLabel = 'LONG.'; extraVal = '3'; skLength = 3;
    snake = [{ x: 12, y: 9 }, { x: 11, y: 9 }, { x: 10, y: 9 }];
    skDir = { x: 1, y: 0 };
    skTimer = 0; skInterval = 0.15;
    keys = {}; spacePrev = false;
    state = 'playing';
    spawnSkFood();
    updateHUD();
    startLoop();
}

function spawnSkFood() {
    let ok = false;
    while (!ok) {
        skFood = { x: Math.floor(Math.random() * SK_COLS), y: Math.floor(Math.random() * SK_ROWS) };
        ok = !snake.some(s => s.x === skFood.x && s.y === skFood.y);
    }
}

function updateSnake(dt: number) {
    // Direction (pas de demi-tour)
    if ((keys['ArrowUp'] || keys['z'] || keys['Z']) && skDir.y === 0) skDir = { x: 0, y: -1 };
    else if ((keys['ArrowDown'] || keys['s']) && skDir.y === 0) skDir = { x: 0, y: 1 };
    else if ((keys['ArrowLeft'] || keys['q'] || keys['Q']) && skDir.x === 0) skDir = { x: -1, y: 0 };
    else if ((keys['ArrowRight'] || keys['d'] || keys['D']) && skDir.x === 0) skDir = { x: 1, y: 0 };

    skTimer += dt;
    if (skTimer < skInterval) return;
    skTimer = 0;

    const head = { x: snake[0].x + skDir.x, y: snake[0].y + skDir.y };

    // Collision mur
    if (head.x < 0 || head.x >= SK_COLS || head.y < 0 || head.y >= SK_ROWS) { endGame(); return; }
    // Collision soi-même
    if (snake.some(s => s.x === head.x && s.y === head.y)) { endGame(); return; }

    snake.unshift(head);

    // Mange
    if (head.x === skFood.x && head.y === skFood.y) {
        score += 10; skLength++;
        extraVal = String(skLength);
        addGameScore(10);
        updateHUD();
        skInterval = Math.max(0.06, skInterval - 0.004);
        spawnSkFood();
    } else {
        snake.pop();
    }
}

function drawSnake() {
    if (!ctx || !canvas) return;
    const W = canvas.width, H = canvas.height;

    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);

    // Grille subtile
    ctx.fillStyle = '#0a1520';
    for (let i = 0; i <= SK_COLS; i++) ctx.fillRect(i * SK_CELL, 0, 1, H);
    for (let i = 0; i <= SK_ROWS; i++) ctx.fillRect(0, i * SK_CELL, W, 1);

    if (state === 'playing' || state === 'gameover') {
        // Food (planète)
        ctx.fillStyle = '#ffb340';
        ctx.beginPath();
        ctx.arc(skFood.x * SK_CELL + SK_CELL / 2, skFood.y * SK_CELL + SK_CELL / 2, SK_CELL / 2 - 2, 0, Math.PI * 2);
        ctx.fill();

        // Snake
        snake.forEach((s, i) => {
            if (i === 0) ctx!.fillStyle = '#00e1ff';
            else ctx!.fillStyle = `rgba(56,255,176,${Math.max(0.3, 1 - i * 0.03)})`;
            ctx!.fillRect(s.x * SK_CELL + 1, s.y * SK_CELL + 1, SK_CELL - 2, SK_CELL - 2);
        });
    }
    if (state === 'gameover') drawGameOver('GAME OVER', '[ESPACE] rejouer');
    drawCanvasHUD();
}

// ============================================================
// GAME 3: COMET DODGE (comètes homing + niveaux + types variés)
// ============================================================
let mtX = 240;
const MT_Y = 330, MT_W = 28, MT_H = 12, MT_SPD = 5;

type CometType = 'normal' | 'fast' | 'big' | 'zigzag' | 'missile';
interface Comet {
    x: number; y: number; vx: number; vy: number;
    size: number; trail: { x: number; y: number }[];
    type: CometType; homing: number;   // 0 = balistique, >0 = vise le joueur
    color: string; glowColor: string;
    phase: number;   // pour zigzag
}
let comets: Comet[] = [];
let mtLives = 3;
let mtSpawnCd = 0;
let mtLevel = 1;
let mtSurvival = 0;
let mtLevelTimer = 0;
const LEVEL_DURATION = 10;   // 10s par niveau

const COMET_TYPES: Record<CometType, { size: number; speed: number; homing: number; color: string; glow: string }> = {
    normal:  { size: 7,  speed: 90,  homing: 0,    color: '#e0f4ff', glow: 'rgba(180,220,255,0.4)' },
    fast:    { size: 5,  speed: 160, homing: 0.3,  color: '#ff6b40', glow: 'rgba(255,107,64,0.4)' },
    big:     { size: 12, speed: 60,  homing: 0.1,  color: '#b388ff', glow: 'rgba(179,136,255,0.4)' },
    zigzag:  { size: 6,  speed: 110, homing: 0,    color: '#38ffb0', glow: 'rgba(56,255,176,0.4)' },
    missile: { size: 6,  speed: 70,  homing: 1.5,  color: '#ff2050', glow: 'rgba(255,32,80,0.5)' },
};

function startMeteor() {
    score = 0; mtLives = 3; extraLabel = 'VIES'; extraVal = '3';
    mtX = 240; comets = []; mtSpawnCd = 1.0;
    mtLevel = 1; mtSurvival = 0; mtLevelTimer = 0;
    keys = {}; spacePrev = false;
    state = 'playing';
    updateHUD();
    startLoop();
}

function updateMeteor(dt: number) {
    if (!canvas) return;
    const W = canvas.width, H = canvas.height;

    // Joueur
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) mtX -= MT_SPD;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) mtX += MT_SPD;
    mtX = Math.max(MT_W / 2, Math.min(W - MT_W / 2, mtX));

    // Niveau : augmente toutes les 10s
    mtSurvival += dt;
    mtLevelTimer += dt;
    if (mtLevelTimer >= LEVEL_DURATION) {
        mtLevel++;
        mtLevelTimer = 0;
    }

    // Score = survie × niveau (1pt/sec au lvl 1, 2pt/sec au lvl 2, etc.)
    const pointsPerSec = mtLevel;
    const prevScore = score;
    score = Math.floor(mtSurvival * pointsPerSec);
    if (score > prevScore) {
        addGameScore(score - prevScore);
    }
    updateHUD();

    // Spawn : fréquence et type selon le niveau
    mtSpawnCd -= dt;
    if (mtSpawnCd <= 0) {
        spawnComet();
        const baseCd = Math.max(0.25, 1.0 - mtLevel * 0.05);
        mtSpawnCd = baseCd + Math.random() * 0.3;
    }

    // Comètes
    for (let i = comets.length - 1; i >= 0; i--) {
        const c = comets[i];
        // Trail
        c.trail.push({ x: c.x, y: c.y });
        if (c.trail.length > 14) c.trail.shift();

        // Homing : ajuste la vx (et vy pour les missiles) vers le joueur
        if (c.homing > 0) {
            const targetDx = mtX - c.x;
            const targetDy = MT_Y - c.y;
            // Plus le homing est fort, plus la correction est agressive
            c.vx += (targetDx > 0 ? 1 : -1) * c.homing * 60 * dt;
            // Missile : traque aussi en Y (vrai autoguidage)
            if (c.type === 'missile') {
                const dist = Math.sqrt(targetDx * targetDx + targetDy * targetDy);
                if (dist > 1) {
                    // Normalise et ajuste la vélocité vers la cible
                    const speed = Math.sqrt(c.vx * c.vx + c.vy * c.vy);
                    const desiredVx = (targetDx / dist) * speed;
                    const desiredVy = (targetDy / dist) * speed;
                    c.vx += (desiredVx - c.vx) * c.homing * dt;
                    c.vy += (desiredVy - c.vy) * c.homing * dt;
                }
            }
            // Limite la vx
            const maxVx = 150;
            c.vx = Math.max(-maxVx, Math.min(maxVx, c.vx));
        }

        // Zigzag : oscillation horizontale
        if (c.type === 'zigzag') {
            c.phase += dt * 5;
            c.x += Math.sin(c.phase) * 40 * dt;
        }

        c.x += c.vx * dt;
        c.y += c.vy * dt;

        // Sortie d'écran → détruire
        if (c.x < -50 || c.x > W + 50 || c.y > H + 50) {
            comets.splice(i, 1);
            continue;
        }

        // Collision joueur
        const dx = c.x - mtX, dy = c.y - MT_Y;
        const hitR = c.size + MT_W / 2 - 4;
        if (dx * dx + dy * dy < hitR * hitR) {
            comets.splice(i, 1);
            mtLives--; extraVal = String(mtLives); updateHUD();
            if (mtLives <= 0) { endGame(); return; }
        }
    }
}

function spawnComet() {
    const W = canvas!.width;
    // Type selon le niveau
    let type: CometType = 'normal';
    const r = Math.random();
    if (mtLevel >= 5 && r < 0.25) type = 'missile';
    else if (mtLevel >= 3 && r < 0.2) type = 'big';
    else if (mtLevel >= 2 && r < 0.4) type = 'fast';
    else if (mtLevel >= 2 && r < 0.6) type = 'zigzag';
    else type = 'normal';

    const cfg = COMET_TYPES[type];
    const side = Math.floor(Math.random() * 3);
    let x: number, y: number, vx: number, vy: number;
    const speed = cfg.speed * (1 + (mtLevel - 1) * 0.08);

    if (type === 'missile') {
        // Le missile spawn loin, vitesse modeste, mais traque en continu
        x = Math.random() * W; y = -30;
        vx = 0; vy = speed;
    } else if (side === 0) {
        x = Math.random() * W; y = -20;
        vx = (Math.random() - 0.5) * 40; vy = speed;
    } else if (side === 1) {
        x = -20; y = Math.random() * 120;
        vx = speed * 0.7; vy = speed * 0.7;
    } else {
        x = W + 20; y = Math.random() * 120;
        vx = -speed * 0.7; vy = speed * 0.7;
    }

    comets.push({
        x, y, vx, vy, size: cfg.size, trail: [],
        type, homing: cfg.homing, color: cfg.color, glowColor: cfg.glow,
        phase: 0,
    });
}

function drawMeteor() {
    if (!ctx || !canvas) return;
    const W = canvas.width, H = canvas.height;

    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#1a2a3a';
    for (let i = 0; i < 40; i++) ctx.fillRect((i * 73) % W, (i * 97) % H, 1, 1);

    if (state === 'playing' || state === 'gameover') {
        // Niveau (en bas à gauche)
        ctx.fillStyle = '#5d6f95';
        ctx.font = '10px Orbitron, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('NIVEAU ' + mtLevel, 8, H - 8);

        // Comètes + trails
        comets.forEach(c => {
            // Missile : trail plus long + pulsant
            const trailAlpha = c.type === 'missile' ? 0.7 : 0.5;
            for (let i = 0; i < c.trail.length; i++) {
                const t = c.trail[i];
                const alpha = (i / c.trail.length) * trailAlpha;
                const sz = c.size * (i / c.trail.length);
                const baseColor = c.color.startsWith('#')
                    ? hexToRgb(c.color) : '110, 180, 255';
                ctx!.fillStyle = `rgba(${baseColor}, ${alpha})`;
                ctx!.beginPath();
                ctx!.arc(t.x, t.y, sz, 0, Math.PI * 2);
                ctx!.fill();
            }
            // Tête comète
            ctx!.fillStyle = c.glowColor;
            ctx!.beginPath(); ctx!.arc(c.x, c.y, c.size * 1.4, 0, Math.PI * 2); ctx!.fill();
            // Missile : halo pulsant
            if (c.type === 'missile') {
                const pulse = 1 + Math.sin(performance.now() / 65) * 0.3;
                ctx!.fillStyle = 'rgba(255,32,80,0.3)';
                ctx!.beginPath(); ctx!.arc(c.x, c.y, c.size * 2 * pulse, 0, Math.PI * 2); ctx!.fill();
            }
            ctx!.fillStyle = c.color;
            ctx!.beginPath(); ctx!.arc(c.x, c.y, c.size, 0, Math.PI * 2); ctx!.fill();
            ctx!.fillStyle = '#ffffff';
            ctx!.beginPath(); ctx!.arc(c.x, c.y, c.size * 0.4, 0, Math.PI * 2); ctx!.fill();
        });

        // Joueur
        if (state === 'playing') {
            const ox = Math.round(mtX - MT_W / 2), oy = Math.round(MT_Y - MT_H / 2);
            ctx!.fillStyle = '#00e1ff'; ctx!.fillRect(ox + 4, oy + 4, MT_W - 8, MT_H - 6);
            ctx!.fillStyle = '#38ffb0'; ctx!.fillRect(ox + 8, oy + 1, MT_W - 16, 4);
        }
    }
    if (state === 'gameover') drawGameOver('GAME OVER', '[ESPACE] rejouer');
    drawCanvasHUD();
}

function hexToRgb(hex: string): string {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
}
