const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const scoreDisplay = document.getElementById('scoreDisplay');
const finalScoreSpan = document.getElementById('finalScore');
const highscoreSpan = document.getElementById('highscore');
const resultMsg = document.getElementById('resultMsg');

const W = 500, H = 500;
canvas.width = W;
canvas.height = H;

const PLAYER_SIZE = 13;
const BULLET_RADIUS = 4;
const ENEMY_SIZE = 20;
let player, enemies, bullets, score, gameRunning, animationId, enemiesSpawned;
let dying, deathTime, explosionParticles;
let accumulator, stepCounter, lastSpawnStep, lastFrameTime;
const FIXED_DT = 1000 / 60;

const stars = Array.from({ length: 60 }, () => {
    const s = 0.5 + Math.random() * 0.8;
    return { x: Math.random() * W, y: Math.random() * H, r: 0.4 + Math.random() * 1.2, a: 0.2 + Math.random() * 0.5, s, origS: s };
});

function lerpColor(c1, c2, t) {
    return [
        Math.round(c1[0] + (c2[0] - c1[0]) * t),
        Math.round(c1[1] + (c2[1] - c1[1]) * t),
        Math.round(c1[2] + (c2[2] - c1[2]) * t)
    ];
}

function colorStr(c) {
    return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function resetStars() {
    for (const s of stars) s.s = s.origS;
}

function init() {
    player = { x: W / 2, y: H - 40, size: PLAYER_SIZE, vx: 0, vy: 0 };
    enemies = [];
    bullets = [];
    explosionParticles = [];
    score = 0;
    gameRunning = false;
    dying = false;
    enemiesSpawned = 0;
    scoreDisplay.textContent = '0';
    startScreen.style.display = 'flex';
    gameOverScreen.style.display = 'none';
    resetStars();
    drawBackground();
}

function startGame() {
    player = { x: W / 2, y: H - 40, size: PLAYER_SIZE, vx: 0, vy: 0 };
    enemies = [];
    bullets = [];
    explosionParticles = [];
    score = 0;
    gameRunning = true;
    dying = false;
    enemiesSpawned = 0;
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    document.getElementById('highscoreSection').style.display = 'none';
    scoreDisplay.textContent = '0';
    resetStars();
    stepCounter = 0;
    lastSpawnStep = 0;
    accumulator = 0;
    lastFrameTime = performance.now();
    if (animationId) cancelAnimationFrame(animationId);
    update();
}

function spawnEnemy() {
    const x = 20 + Math.random() * (W - 40);
    enemiesSpawned++;
    const isPurple = enemiesSpawned % 4 === 0;
    enemies.push({ x, y: -ENEMY_SIZE, size: ENEMY_SIZE, lastShotStep: stepCounter, purple: isPurple });
}

function update() {
    const now = performance.now();
    if (dying) {
        updateDeath();
        draw();
        lastFrameTime = now;
        animationId = requestAnimationFrame(update);
        return;
    }
    if (!gameRunning) return;
    const frameDelta = Math.min(now - lastFrameTime, 5000);
    lastFrameTime = now;
    accumulator += frameDelta;
    movePlayer();
    const steps = Math.min(Math.floor(accumulator / FIXED_DT), 60);
    accumulator -= steps * FIXED_DT;
    for (let i = 0; i < steps; i++) {
        stepCounter++;
        if (stepCounter - lastSpawnStep >= 60) {
            spawnEnemy();
            lastSpawnStep = stepCounter;
        }
        moveEnemies();
        moveBullets();
        checkCollisions();
        if (dying) break;
        score++;
    }
    draw();
    scoreDisplay.textContent = Math.floor(score / 4);
    animationId = requestAnimationFrame(update);
}

function movePlayer() {
    const speed = 5;
    player.vx = 0; player.vy = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) player.vx -= speed;
    if (keys['ArrowRight'] || keys['KeyD']) player.vx += speed;
    if (keys['ArrowUp'] || keys['KeyW']) player.vy -= speed;
    if (keys['ArrowDown'] || keys['KeyS']) player.vy += speed;
    if (touchTarget) {
        const dx = touchTarget.x - player.x;
        const dy = touchTarget.y - player.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 8) {
            player.vx = (dx / dist) * speed;
            player.vy = (dy / dist) * speed;
        }
    }
    player.x += player.vx;
    player.y += player.vy;
    player.x = Math.max(PLAYER_SIZE, Math.min(W - PLAYER_SIZE, player.x));
    player.y = Math.max(PLAYER_SIZE, Math.min(H - PLAYER_SIZE, player.y));
}

function moveEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.y += e.purple ? 1.2 : 2;
        if (e.y > H + 50) { enemies.splice(i, 1); continue; }
        if (stepCounter - e.lastShotStep >= 120) {
            if (e.purple) {
                for (let j = 0; j < 8; j++) {
                    const angle = (Math.PI * 2 / 8) * j;
                    bullets.push({ x: e.x, y: e.y, vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4, radius: BULLET_RADIUS, purple: true });
                }
            } else {
                const dx = player.x - e.x;
                const dy = player.y - e.y;
                const d = Math.hypot(dx, dy);
                bullets.push({ x: e.x, y: e.y, vx: (dx / d) * 4, vy: (dy / d) * 4, radius: BULLET_RADIUS });
            }
            e.shotAtStep = stepCounter;
            e.lastShotStep = stepCounter;
        }
    }
}

function moveBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) {
            bullets.splice(i, 1);
        }
    }
}

function checkCollisions() {
    for (const b of bullets) {
        const dx = b.x - player.x;
        const dy = b.y - player.y;
        if (Math.hypot(dx, dy) < PLAYER_SIZE + BULLET_RADIUS) {
            startDeath();
            return;
        }
    }
    for (const e of enemies) {
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        if (Math.hypot(dx, dy) < PLAYER_SIZE + e.size / 2) {
            startDeath();
            return;
        }
    }
}

function startDeath() {
    dying = true;
    deathTime = performance.now();
    if (animationId) cancelAnimationFrame(animationId);
    accumulator = 0;
    explosionParticles = [];
    for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        explosionParticles.push({
            x: player.x, y: player.y,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            size: 2 + Math.random() * 4,
            color: ['#00ffff', '#0088ff', '#ffffff', '#00ffaa'][Math.floor(Math.random() * 4)],
            life: 1
        });
    }
    update();
}

function updateDeath() {
    const elapsed = performance.now() - deathTime;
    const progress = Math.min(elapsed / 800, 1);

    for (const s of stars) {
        s.s = s.origS * (1 - progress);
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.y += (e.purple ? 1.2 : 2) * (1 - progress);
        if (e.y > H + 50) { enemies.splice(i, 1); }
    }

    for (const b of bullets) {
        b.x += b.vx * (1 - progress);
        b.y += b.vy * (1 - progress);
    }

    for (const p of explosionParticles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.life = Math.max(0, 1 - progress);
    }

    if (elapsed > 800) {
        dying = false;
        gameRunning = false;
        gameOver();
    }
}

function gameOver() {
    const survived = Math.floor(score / 4);
    finalScoreSpan.textContent = survived;
    gameOverScreen.style.display = 'flex';
    submitScore(survived);
}

async function submitScore(score) {
    try {
        const res = await fetch('/game/submit-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score })
        });
        const data = await res.json();
        highscoreSpan.textContent = data.highscore;
        resultMsg.textContent = data.isNewHighscore ? 'NEW HIGHSCORE!' : 'Try again!';
        resultMsg.style.color = data.isNewHighscore ? '#4CAF50' : '#ff9800';
    } catch (e) {
        highscoreSpan.textContent = '?';
        resultMsg.textContent = 'Error submitting score';
    }
    document.getElementById('highscoreSection').style.display = 'block';
}

function drawBackground() {
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, W, H);
    for (const s of stars) {
        s.y += s.s;
        if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
        ctx.fillStyle = `rgba(255,255,255,${s.a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
    }
}

function draw() {
    drawBackground();

    if (!dying) {
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(player.x, player.y - PLAYER_SIZE);
        ctx.lineTo(player.x - PLAYER_SIZE, player.y + PLAYER_SIZE * 0.7);
        ctx.lineTo(player.x + PLAYER_SIZE, player.y + PLAYER_SIZE * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    for (const e of enemies) {
        const charge = Math.min((stepCounter - e.lastShotStep) / 120, 1);
        const radius = e.purple ? e.size / 1.3 : e.size / 2;

        let fill, glow;
        if (e.purple) {
            const c = lerpColor([100, 50, 170], [200, 120, 255], charge);
            fill = colorStr(c);
            glow = `rgba(${c[0]},${c[1]},${c[2]},0.6)`;
            ctx.shadowColor = glow;
            const boostP = charge > 0.6 ? 1 + (charge - 0.6) / 0.4 : 1;
            ctx.shadowBlur = 12 + charge * 20 * boostP;
        } else {
            const c = lerpColor([180, 40, 70], [255, 50, 100], charge);
            fill = colorStr(c);
            glow = `rgba(${c[0]},${c[1]},${c[2]},0.6)`;
            ctx.shadowColor = glow;
            const boostR = charge > 0.6 ? 1 + (charge - 0.6) / 0.4 : 1;
            ctx.shadowBlur = 10 + charge * 18 * boostR;
        }

        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(e.x, e.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (e.purple) {
            ctx.fillStyle = '#cc88ff';
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.size / 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = '#ff6699';
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.size / 4, 0, Math.PI * 2);
            ctx.fill();
        }

        if (e.shotAtStep && stepCounter - e.shotAtStep < 15) {
            const elapsed = stepCounter - e.shotAtStep;
            const pulseRadius = radius + 2 + elapsed * 0.08;
            const alpha = 1 - elapsed / 15;
            ctx.strokeStyle = e.purple ? `rgba(204,136,255,${alpha})` : `rgba(255,255,255,${alpha})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(e.x, e.y, pulseRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    for (const b of bullets) {
        if (b.purple) {
            ctx.fillStyle = '#cc88ff';
            ctx.shadowColor = '#cc88ff';
        } else {
            ctx.fillStyle = '#ffdd00';
            ctx.shadowColor = '#ffdd00';
        }
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(b.x, b.y, BULLET_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    }

    if (dying) {
        for (const p of explosionParticles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    ctx.shadowBlur = 0;
}

const keys = {};
document.addEventListener('keydown', e => { keys[e.code] = true; if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault(); });
document.addEventListener('keyup', e => { keys[e.code] = false; });

let touchTarget = null;

function getTouchPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    return {
        x: (touch.clientX - rect.left) * (canvas.width / rect.width),
        y: (touch.clientY - rect.top) * (canvas.height / rect.height)
    };
}

canvas.addEventListener('touchstart', e => { e.preventDefault(); touchTarget = getTouchPos(e); }, { passive: false });
canvas.addEventListener('touchmove', e => { e.preventDefault(); touchTarget = getTouchPos(e); }, { passive: false });
canvas.addEventListener('touchend', e => { e.preventDefault(); touchTarget = null; }, { passive: false });
canvas.addEventListener('touchcancel', e => { touchTarget = null; });

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

init();
