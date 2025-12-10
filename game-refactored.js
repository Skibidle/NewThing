// Game core - refactored with modular systems

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
addEventListener('resize', resize);
resize();

// Initialize game systems
const playerSystem = new PlayerSystem();
const enemySystem = new EnemySystem(GAME_CONFIG.world);
const projectileSystem = new ProjectileSystem();
const abilitySystem = new AbilitySystem(playerSystem.player);
const lootSystem = new LootSystem();
const camera = new CameraSystem();
const particleSystem = new ParticleSystem();

// Get player reference for convenience
const player = playerSystem.getPlayer();

// UI DOM elements
const classModal = document.getElementById('classModal');
const statScreen = document.getElementById('statScreen');
const lootModal = document.getElementById('lootModal');
const lootList = document.getElementById('lootList');

// Input tracking
const keys = {};
const mouse = { x: 0, y: 0, worldX: 0, worldY: 0, down: false };

addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === 'e') toggleStatScreen();
  if (e.key.toLowerCase() === 'l') openLoot();
});

addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

addEventListener('mousedown', () => {
  mouse.down = true;
});

addEventListener('mouseup', () => {
  mouse.down = false;
});

addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') return; // Don't fire ability if clicking buttons
  fireAbility(0, mouse.x, mouse.y);
});

// ===== GAME LOGIC =====

function fireAbility(abilityIndex, screenX, screenY) {
  if (!player.classKey) return;
  const targetX = camera.x + screenX;
  const targetY = camera.y + screenY;
  abilitySystem.executeAbility(abilityIndex, targetX, targetY, projectileSystem);
}

function selectClass(classKey) {
  playerSystem.selectClass(classKey);
  classModal.style.display = 'none';
  updateStatScreenUI();
  updateUI();
}

function updateUI() {
  const hpEl = document.getElementById('hp');
  const manaEl = document.getElementById('mana');
  const stamEl = document.getElementById('stam');
  if (hpEl) hpEl.textContent = Math.round(player.hp) + '/' + player.maxHp;
  if (manaEl) manaEl.textContent = Math.round(player.mana) + '/' + player.maxMana;
  if (stamEl) stamEl.textContent = Math.round(player.stam);
}

function toggleStatScreen() {
  if (statScreen.style.display === 'block') {
    statScreen.style.display = 'none';
  } else {
    updateStatScreenUI();
    statScreen.style.display = 'block';
  }
}

function updateStatScreenUI() {
  // Stats tab
  document.getElementById('screenStr').textContent = player.str;
  document.getElementById('screenDex').textContent = player.dex;
  document.getElementById('screenPer').textContent = player.per;
  document.getElementById('screenMana').textContent = player.manaStat;
  document.getElementById('screenVit').textContent = player.vit;
  
  // Progression
  document.getElementById('screenLevel').textContent = player.level;
  document.getElementById('screenXp').textContent = `${player.xp} / ${player.xpNext}`;
  document.getElementById('screenClass').textContent = player.class || 'None';
  document.getElementById('screenFreePoints').textContent = player.freeStatPoints;
  
  // Abilities
  const abilitiesList = document.getElementById('screenAbilitiesList');
  abilitiesList.innerHTML = '';
  if (player.abilities && player.abilities.length > 0) {
    player.abilities.forEach((ability, idx) => {
      const el = document.createElement('div');
      el.className = 'ability-item';
      el.innerHTML = `<div class="ability-name">${ability.name}</div><div class="ability-cost">Cost: ${ability.cost}</div><div class="muted">${ability.desc || ''}</div>`;
      abilitiesList.appendChild(el);
    });
  } else {
    abilitiesList.innerHTML = '<div class="muted">No abilities yet. Choose a class to get started.</div>';
  }
}

function allocateStatPoint(stat) {
  playerSystem.allocateStat(stat, false);
  updateStatScreenUI();
  updateUI();
}

function switchStatTab(tabName, buttonEl) {
  document.getElementById('statsTab').classList.remove('active');
  document.getElementById('abilitiesTab').classList.remove('active');
  document.getElementById('equipmentTab').classList.remove('active');
  
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  
  const tabId = tabName + 'Tab';
  if (document.getElementById(tabId)) {
    document.getElementById(tabId).classList.add('active');
  }
  // Activate the provided button element if available
  if (buttonEl && buttonEl.classList) buttonEl.classList.add('active');
}

function openLoot() {
  lootList.innerHTML = '';
  player.inventory.forEach(it => {
    const el = document.createElement('div');
    el.className = 'loot-item';
    el.innerHTML = `<b>${it.name}</b><div class="muted">x${it.quantity || 1}</div>`;
    lootList.appendChild(el);
  });
  lootModal.style.display = 'block';
}

function gameOver() {
  alert('You have fallen. The wilds reclaim another hunter.');
  playerSystem.reset();
  enemySystem.clear();
  projectileSystem.clear();
  player.classKey = null;
  player.class = null;
  player.abilities = [];
  classModal.style.display = 'block';
  updateUI();
}

// ===== UPDATE LOGIC =====

function update() {
  // Player movement
  const inputX = (keys['w'] || keys['arrowup'] ? -1 : 0) + (keys['s'] || keys['arrowdown'] ? 1 : 0);
  const inputY = (keys['a'] || keys['arrowleft'] ? -1 : 0) + (keys['d'] || keys['arrowright'] ? 1 : 0);
  
  const isSprinting = keys['shift'];
  const accelFactor = isSprinting ? 1.2 : 0.7;
  const accel = 0.12 * accelFactor;
  const maxSpeed = player.maxSpeed * (isSprinting ? 1.3 : 1.0);
  
  if (inputX !== 0 || inputY !== 0) {
    const len = Math.sqrt(inputX * inputX + inputY * inputY) || 1;
    player.vx += (inputX / len) * accel;
    player.vy += (inputY / len) * accel;
    
    // Stamina drain on sprint
    if (isSprinting) {
      player.stam = Math.max(0, player.stam - 0.4);
    }
  } else {
    player.vx *= 0.88;
    player.vy *= 0.88;
    // Stamina recovery
    if (player.stam < player.maxStam) {
      player.stam = Math.min(player.stam + 0.2, player.maxStam);
    }
  }
  
  // Clamp velocity
  const sp = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
  if (sp > maxSpeed) {
    player.vx = (player.vx / sp) * maxSpeed;
    player.vy = (player.vy / sp) * maxSpeed;
  }
  
  // Apply velocity
  player.x += player.vx;
  player.y += player.vy;
  
  // World bounds
  player.x = clamp(player.x, 20, GAME_CONFIG.world.w - 20);
  player.y = clamp(player.y, 20, GAME_CONFIG.world.h - 20);
  
  // Update projectiles
  projectileSystem.update();
  
  // Check projectile collisions
  const hits = projectileSystem.checkCollision(enemySystem.getEnemies(), player);
  for (const hit of hits) {
    if (hit.target === 'player') {
      if (playerSystem.takeDamage(hit.damage)) {
        gameOver();
      }
    } else {
      const enemy = enemySystem.getEnemies()[hit.enemy];
      if (enemy) {
        enemy.hp -= hit.damage;
        if (enemy.hp <= 0) {
          const loot = Math.random() < 0.15 ? lootSystem.generateLoot('uncommon') : lootSystem.generateLoot('common');
          player.inventory.push(loot);
          playerSystem.gainXP(enemy.xp);
          enemySystem.removeEnemy(enemy.id);
        }
      }
    }
  }
  
  // Update enemy AI
  enemySystem.updateAI(player, camera);
  
  // Update camera
  camera.update(player, GAME_CONFIG.world.w, GAME_CONFIG.world.h, canvas.width, canvas.height);
  
  // Update particles
  particleSystem.update();
  
  // Update UI
  updateUI();
}

// ===== RENDERING =====

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawEnvironment();
  
  // Draw enemies
  for (const en of enemySystem.getEnemies()) {
    const sx = en.x - camera.x, sy = en.y - camera.y;
    ctx.beginPath();
    ctx.fillStyle = en.color;
    ctx.globalAlpha = 0.95;
    ctx.arc(sx, sy, en.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // Enemy health bar
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(sx - en.r, sy - en.r - 10, en.r * 2, 6);
    ctx.fillStyle = 'rgba(255,120,120,0.9)';
    ctx.fillRect(sx - en.r, sy - en.r - 10, en.r * 2 * Math.max(0, en.hp / en.baseHp), 6);
  }
  
  // Draw projectiles
  for (const p of projectileSystem.getProjectiles()) {
    const px = p.x - camera.x, py = p.y - camera.y;
    ctx.beginPath();
    ctx.fillStyle = '#66e0ff';
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Draw particles
  for (const p of particleSystem.getParticles()) {
    const px = p.x - camera.x, py = p.y - camera.y;
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(px, py, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  
  // Draw player
  const px = player.x - camera.x, py = player.y - camera.y;
  ctx.beginPath();
  ctx.fillStyle = '#e0f6ff';
  ctx.arc(px, py, player.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(80,180,255,0.08)';
  ctx.lineWidth = 10;
  ctx.arc(px, py, player.r + 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1;
  
  // Draw crosshair
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(180,230,255,0.4)';
  ctx.arc(mouse.x, mouse.y, 10, 0, Math.PI * 2);
  ctx.stroke();
}

function drawHUD() {
  if (!ctx) return;
  
  // Top-left: Health, Stamina, Mana bars
  const barWidth = 180, barHeight = 14, padding = 14, gap = 8;
  let y = padding;
  
  // Background panel
  ctx.fillStyle = 'rgba(15, 25, 40, 0.6)';
  ctx.fillRect(padding - 6, y - 6, barWidth + 12, 90);
  ctx.strokeStyle = 'rgba(100, 180, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(padding - 6, y - 6, barWidth + 12, 90);
  
  // Health bar
  ctx.fillStyle = 'rgba(60, 20, 20, 0.7)';
  ctx.fillRect(padding, y, barWidth, barHeight);
  ctx.fillStyle = '#ff5555';
  const hpRatio = Math.max(0, Math.min(1, player.hp / (player.maxHp || 50)));
  ctx.fillRect(padding, y, barWidth * hpRatio, barHeight);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px Inter';
  ctx.fillText(`HP: ${Math.round(player.hp)}/${player.maxHp}`, padding + 4, y + 11);
  y += barHeight + gap;
  
  // Stamina bar
  ctx.fillStyle = 'rgba(60, 45, 20, 0.7)';
  ctx.fillRect(padding, y, barWidth, barHeight);
  ctx.fillStyle = '#ffcc66';
  const stamRatio = Math.max(0, Math.min(1, player.stam / (player.maxStam || 100)));
  ctx.fillRect(padding, y, barWidth * stamRatio, barHeight);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px Inter';
  ctx.fillText(`STAM: ${Math.round(player.stam)}/${player.maxStam}`, padding + 4, y + 11);
  y += barHeight + gap;
  
  // Mana bar
  ctx.fillStyle = 'rgba(20, 40, 60, 0.7)';
  ctx.fillRect(padding, y, barWidth, barHeight);
  ctx.fillStyle = '#6dd5ff';
  const manaRatio = Math.max(0, Math.min(1, player.mana / (player.maxMana || 30)));
  ctx.fillRect(padding, y, barWidth * manaRatio, barHeight);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px Inter';
  ctx.fillText(`MANA: ${Math.round(player.mana)}/${player.maxMana}`, padding + 4, y + 11);
  
  // Top-middle: Level/XP bar
  const levelBarWidth = 200, levelBarHeight = 16;
  const centerX = canvas.width / 2 - levelBarWidth / 2;
  const levelBarY = padding;
  
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(centerX, levelBarY, levelBarWidth, levelBarHeight);
  const xpRatio = Math.max(0, Math.min(1, player.xp / (player.xpNext || 100)));
  ctx.fillStyle = '#6dd5ff';
  ctx.fillRect(centerX, levelBarY, levelBarWidth * xpRatio, levelBarHeight);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px Inter';
  ctx.textAlign = 'center';
  ctx.fillText(`Level ${player.level} - ${player.xp}/${player.xpNext} XP`, centerX + levelBarWidth / 2, levelBarY + 12);
  ctx.textAlign = 'left';
  
  // Bottom-left: Shortcut notices
  const shortcutY = canvas.height - 60;
  const shortcuts = [
    'E - Stats',
    'Click - Attack',
    'W/A/S/D - Move',
    'Shift - Sprint'
  ];
  
  ctx.font = '11px Inter';
  ctx.fillStyle = 'rgba(180,200,220,0.7)';
  shortcuts.forEach((text, idx) => {
    ctx.fillText(text, padding, shortcutY + (idx * 14));
  });
}

function drawEnvironment() {
  // Plains biome background
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, 'rgba(135,206,235,0.3)'); // sky blue
  g.addColorStop(1, 'rgba(85,180,100,0.2)'); // grass green
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Grass patches
  for (let i = 0; i < 40; i++) {
    const wx = (i * 373) % GAME_CONFIG.world.w;
    const wy = (i * 137) % GAME_CONFIG.world.h;
    const sx = wx - camera.x;
    const sy = wy - camera.y;
    if (sx < -120 || sx > canvas.width + 120 || sy < -80 || sy > canvas.height + 80) continue;
    ctx.beginPath();
    ctx.fillStyle = 'rgba(100,180,80,0.15)';
    ctx.ellipse(sx, sy, 80, 40, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Trees
  for (let i = 0; i < 8; i++) {
    const fx = (i * 587) % GAME_CONFIG.world.w;
    const fy = (i * 431) % GAME_CONFIG.world.h;
    const sx = fx - camera.x;
    const sy = fy - camera.y;
    if (sx < -60 || sx > canvas.width + 60 || sy < -60 || sy > canvas.height + 60) continue;
    ctx.fillStyle = 'rgba(101,67,33,0.4)';
    ctx.fillRect(sx - 4, sy, 8, 30);
    ctx.fillStyle = 'rgba(34,139,34,0.4)';
    ctx.beginPath();
    ctx.arc(sx, sy - 5, 20, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ===== MAIN LOOP =====

function loop() {
  mouse.worldX = camera.x + mouse.x;
  mouse.worldY = camera.y + mouse.y;
  update();
  draw();
  drawHUD();
  requestAnimationFrame(loop);
}

loop();

// ===== AUTO-SPAWN & LOOT COLLECTION =====

setInterval(() => {
  if (player.inventory && player.inventory.length > 0 && lootModal.style.display === 'none') {
    openLoot();
  }
}, 1100);

setInterval(() => {
  if (player.classKey) {
    const count = 1 + Math.floor(Math.random() * (1 + Math.floor(player.level / 4)));
    for (let i = 0; i < count; i++) {
      enemySystem.spawnEnemy();
    }
  }
}, 2400 + Math.random() * 1200);

// ===== INITIALIZATION =====

classModal.style.display = 'block';
updateUI();
