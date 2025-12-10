// Game core: world, camera, player, enemies, abilities, and auto-spawn
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
function resize(){canvas.width = innerWidth; canvas.height = innerHeight}
addEventListener('resize', resize); resize();

// world bounds
const WORLD = { w: 3000, h: 2000 };

// Class definitions with stat bonuses per level and abilities
const CLASSES = {
  warrior: {
    name: 'Warrior',
    description: '+2 STR, +1 VIT per level',
    bonuses: { str: 2, dex: 0, per: 0, manaStat: 0, vit: 1 },
    autoAlloc: 'str',
    abilities: [
      { name: 'Cleave', key: 'click', cost: '8 Mana', desc: 'Slash with great force' },
      { name: 'Fortify', key: 'E', cost: '12 Mana', desc: 'Temporary damage reduction' }
    ]
  },
  rogue: {
    name: 'Rogue',
    description: '+2 DEX, +1 PER per level',
    bonuses: { str: 0, dex: 2, per: 1, manaStat: 0, vit: 0 },
    autoAlloc: 'dex',
    abilities: [
      { name: 'Backstab', key: 'click', cost: '5 Mana', desc: 'Quick deadly strike' },
      { name: 'Shadow Step', key: 'E', cost: '8 Mana', desc: 'Teleport a short distance' }
    ]
  },
  mage: {
    name: 'Mage',
    description: '+3 MANA, +1 PER per level',
    bonuses: { str: 0, dex: 0, per: 1, manaStat: 3, vit: 0 },
    autoAlloc: 'mana',
    // Mage only has Mana Bolt as requested
    abilities: [
      { name: 'Mana Bolt', key: 'click', cost: '6 Mana', desc: 'Ranged magical projectile' }
    ]
  },
  ranger: {
    name: 'Ranger',
    description: '+1 STR, +1 DEX, +1 PER per level',
    bonuses: { str: 1, dex: 1, per: 1, manaStat: 0, vit: 0 },
    autoAlloc: 'per',
    abilities: [
      { name: 'Arrow Shot', key: 'click', cost: '4 Mana', desc: 'Precise ranged attack' },
      { name: 'Dash', key: 'E', cost: '10 Mana', desc: 'Quick movement' }
    ]
  },
  paladin: {
    name: 'Paladin',
    description: '+1 STR, +2 VIT, +1 MANA per level',
    bonuses: { str: 1, dex: 0, per: 0, manaStat: 1, vit: 2 },
    autoAlloc: 'vit',
    abilities: [
      { name: 'Holy Strike', key: 'click', cost: '8 Mana', desc: 'Blessed melee attack' },
      { name: 'Light Shield', key: 'E', cost: '10 Mana', desc: 'Defensive barrier' }
    ]
  }
};

// UI elements
const hpEl = document.getElementById('hp');
const manaEl = document.getElementById('mana');

// Modals
const classModal = document.getElementById('classModal');
const statScreen = document.getElementById('statScreen');
const lootModal = document.getElementById('lootModal');
const lootList = document.getElementById('lootList');

// Player (movement, stamina)
const player = {
  x: WORLD.w/2, y: WORLD.h/2, r:16,
  vx:0, vy:0, maxSpeed:3,
  hp:50, maxHp:50, mana:30, maxMana:30,
  stam:100, maxStam:100,
  str:10, dex:10, per:10, manaStat:10, vit:10,
  level:1, xp:0, xpNext:100, class:null, classKey:null, inv:[],
  speed:2, abilities:[], freeStatPoints:0,
};

function updateUI(){
  hpEl.textContent = Math.round(player.hp)+'/'+player.maxHp;
  manaEl.textContent = Math.round(player.mana)+'/'+player.maxMana;
  document.getElementById('stam').textContent = Math.round(player.stam);
}

// Projectiles
const projectiles = [];
function spawnProjectile(x,y,dx,dy,dmg,owner='player'){ projectiles.push({x,y,dx,dy,dmg,ttl:120,owner}); }

// Enemies
const enemies = [];
const enemyTypes = [
  {id:'hydra',name:'Hydra-Serpent',hp:40,spd:0.8,damage:10,color:'#8dc0ff',xp:60},
  {id:'shadow',name:'Shadow Panther',hp:24,spd:2.4,damage:8,color:'#2b2a3a',xp:30},
  {id:'wolf',name:'Eldritch Wolf',hp:20,spd:1.8,damage:6,color:'#6b7cff',xp:25},
  {id:'hive',name:'Insectoid Horror',hp:30,spd:1.2,damage:7,color:'#9bf48b',xp:40},
];

function spawnEnemy(type, x=null,y=null){
  const t = type || enemyTypes[Math.floor(Math.random()*enemyTypes.length)];
  let ex, ey;
  if(x!==null && y!==null){ ex = x; ey = y; }
  else {
    // spawn in a ring around player (300-700 units)
    const angle = Math.random()*Math.PI*2;
    const dist = 300 + Math.random()*400;
    ex = Math.max(40, Math.min(WORLD.w-40, player.x + Math.cos(angle)*dist));
    ey = Math.max(40, Math.min(WORLD.h-40, player.y + Math.sin(angle)*dist));
  }
  const isRanged = Math.random() < 0.28;
  const e = {x:ex,y:ey,r:18,hp:t.hp,baseHp:t.hp,spd:t.spd,damage:t.damage,color:t.color,name:t.name,xp:t.xp};
  e.type = isRanged ? 'ranged' : 'melee';
  
  // Scale enemy stats based on distance from world center (starting point)
  const startX = WORLD.w/2, startY = WORLD.h/2;
  const distFromStart = Math.sqrt((ex - startX)*(ex - startX) + (ey - startY)*(ey - startY));
  const maxDistFromStart = Math.sqrt(startX*startX + startY*startY); // diagonal to corner
  const distanceRatio = Math.min(1, distFromStart / maxDistFromStart); // 0 to 1
  const levelMultiplier = 0.5 + (distanceRatio * 1.5); // scale from 0.5x to 2x at edges
  
  e.hp = Math.round(e.hp * levelMultiplier);
  e.baseHp = e.hp;
  e.spd = e.spd * (0.9 + distanceRatio * 0.3); // slight speed increase at edges
  e.damage = Math.round(e.damage * levelMultiplier);
  e.xp = Math.round(e.xp * levelMultiplier);
  
  enemies.push(e);
}

// Explore button is informational now (enemies spawn automatically)
// Removed - button no longer in DOM

// Camp button: rest for heal/mana/stamina
// Removed - button no longer in DOM

// Basic input (mouse screen coords; we'll derive world coords via camera each frame)
let mouse = {x:0,y:0,down:false, worldX:0, worldY:0};
const keys = {};
canvas.addEventListener('mousemove',e=>{ mouse.x = e.clientX; mouse.y = e.clientY; });
canvas.addEventListener('mousedown',e=>{ mouse.down=true; if(player.abilities && player.abilities[0]) fireAbility(0); });
canvas.addEventListener('mouseup',e=>{ mouse.down=false });
addEventListener('keydown', (e)=>{ keys[e.key.toLowerCase()] = true; });
addEventListener('keyup', (e)=>{ keys[e.key.toLowerCase()] = false; });

// Abilities - generic system for all classes
function fireAbility(index){
  if(!player.abilities || !player.abilities[index]) return;
  if(!player.classKey) return;
  // Parse cost from ability description
  const abilityName = player.abilities[index].name;
  const baseDamage = 6 + Math.floor(player.str * 0.5) + Math.floor(player.per * 1.5);
  const ang = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  const speed = 8 + player.per*0.5;
  spawnProjectile(player.x, player.y, Math.cos(ang)*speed, Math.sin(ang)*speed, baseDamage, 'player');
  player.mana -= 6; // generic mana cost
}

function secondAbility(){
  if(!player.abilities || !player.abilities[1]) return;
  if(player.mana < 10 || player.stam < 20) return;
  player.mana -= 10;
  player.stam = Math.max(0, player.stam - 20);
  const ang = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  player.x += Math.cos(ang)*120;
  player.y += Math.sin(ang)*120;
  player.x = Math.max(20, Math.min(WORLD.w-20, player.x));
  player.y = Math.max(20, Math.min(WORLD.h-20, player.y));
}

addEventListener('keydown', (e)=>{
  if(e.key==='e' || e.key==='E') toggleStatScreen();
  if(e.key==='l' || e.key==='L') showLevelModal();
});

// camera object (top-left world coordinate)
const camera = { x: player.x - canvas.width/2, y: player.y - canvas.height/2 };

// Combat / update loop
function update(){
  // regen mana and stamina
  player.mana = Math.min(player.maxMana, player.mana + 0.06 + player.manaStat*0.001);
  player.stam = Math.min(player.maxStam, player.stam + 0.12 + player.vit*0.02);

  // player movement (WASD)
  const accel = 0.6 + player.dex*0.02;
  let inputX = 0, inputY = 0;
  if(keys['w']||keys['arrowup']) inputY -= 1;
  if(keys['s']||keys['arrowdown']) inputY += 1;
  if(keys['a']||keys['arrowleft']) inputX -= 1;
  if(keys['d']||keys['arrowright']) inputX += 1;
  const sprinting = keys['shift'] && player.stam > 5 && (inputX !== 0 || inputY !== 0);
  if(sprinting){ player.stam = Math.max(0, player.stam - 0.6); }
  const maxSpeed = sprinting ? player.maxSpeed * 1.9 : player.maxSpeed;
  if(inputX !== 0 || inputY !== 0){
    const len = Math.sqrt(inputX*inputX + inputY*inputY) || 1;
    player.vx += (inputX/len) * accel;
    player.vy += (inputY/len) * accel;
  } else { player.vx *= 0.88; player.vy *= 0.88; }
  const sp = Math.sqrt(player.vx*player.vx + player.vy*player.vy);
  if(sp > maxSpeed){ player.vx = (player.vx/sp) * maxSpeed; player.vy = (player.vy/sp) * maxSpeed; }
  player.x += player.vx; player.y += player.vy;
  // clamp to world
  player.x = Math.max(20, Math.min(WORLD.w-20, player.x));
  player.y = Math.max(20, Math.min(WORLD.h-20, player.y));

  for(let i=projectiles.length-1;i>=0;i--){
    const p = projectiles[i];
    p.x += p.dx; p.y += p.dy; p.ttl--;
    if(p.owner === 'player'){
      for(let j=enemies.length-1;j>=0;j--){
        const en = enemies[j];
        const dx = en.x - p.x, dy = en.y - p.y;
        if(dx*dx+dy*dy < (en.r+4)*(en.r+4)){
          en.hp -= p.dmg;
          p.ttl = 0;
          if(en.hp <= 0){
            const loot = {name: (Math.random()<0.15? 'Mana Crystal':'Beast Pelt'), qty:1};
            player.inv.push(loot);
            gainXP(en.xp);
            enemies.splice(j,1);
          }
          break;
        }
      }
    } else if(p.owner === 'enemy'){
      const dx = player.x - p.x, dy = player.y - p.y;
      if(dx*dx+dy*dy < (player.r+6)*(player.r+6)){
        player.hp -= p.dmg;
        p.ttl = 0;
        if(player.hp <= 0){ player.hp = 0; gameOver(); break; }
      }
    }
    if(p.ttl<=0) projectiles.splice(i,1);
  }

  // Enemy AI: idle/patrol/chase/attack
  for(let i=enemies.length-1;i>=0;i--){
    const en = enemies[i];
    if(!en.state) en.state = 'idle';
    let ax=0, ay=0;
    for(const other of enemies){ if(other===en) continue; const ddx = en.x - other.x, ddy = en.y - other.y; const d2 = ddx*ddx+ddy*ddy; if(d2 < 1200){ ax += ddx*0.002; ay += ddy*0.002; } }
    const dx = player.x - en.x, dy = player.y - en.y;
    const dist = Math.sqrt(dx*dx+dy*dy);
    const aggro = 140 + (player.per*6);
    if(en.state === 'idle'){
      if(Math.random()<0.01) { en.state='patrol'; en.px = en.x + (Math.random()-0.5)*180; en.py = en.y + (Math.random()-0.5)*120; }
      if(dist < aggro) en.state='chase';
    } else if(en.state === 'patrol'){
      const pdx = en.px - en.x, pdy = en.py - en.y; const pd = Math.sqrt(pdx*pdx + pdy*pdy) || 1;
      en.x += pdx/pd * en.spd * 0.8; en.y += pdy/pd * en.spd * 0.8;
      if(pd < 6) en.state = 'idle';
      if(dist < aggro) en.state='chase';
    } else if(en.state === 'chase'){
      if(en.type === 'ranged'){
        const desired = 220;
        if(dist < desired*0.9) { en.x -= dx/dist * en.spd * 0.8; en.y -= dy/dist * en.spd * 0.8; }
        else if(dist > desired*1.1) { en.x += dx/dist * en.spd * 0.9; en.y += dy/dist * en.spd * 0.9; }
        if(!en.cooldown) en.cooldown = 0;
        if(en.cooldown <= 0 && dist < 600){
          const speed = 4 + Math.random()*2;
          const ang = Math.atan2(player.y - en.y, player.x - en.x);
          spawnProjectile(en.x, en.y, Math.cos(ang)*speed, Math.sin(ang)*speed, en.damage, 'enemy');
          en.cooldown = 80 + Math.floor(Math.random()*40);
        }
        en.cooldown = Math.max(0, (en.cooldown||0) - 1);
      } else {
        en.x += dx/dist * en.spd; en.y += dy/dist * en.spd;
      }
      if(dist < en.r + player.r + 8) en.state = 'attack';
      if(dist > aggro*1.6) en.state = 'idle';
    } else if(en.state === 'attack'){
      if(!en.attackTimer) en.attackTimer = 0;
      if(en.attackTimer <= 0){ if(dist < en.r + player.r + 8){ player.hp -= en.damage; } en.attackTimer = 40 + Math.floor(Math.random()*30); }
      else { en.attackTimer--; }
      if(dist > en.r + player.r + 20) en.state = 'chase';
    }
    en.x += ax; en.y += ay;
  }

  // update camera so player stays centered (clamped to world)
  camera.x = Math.max(0, Math.min(WORLD.w - canvas.width, player.x - canvas.width/2));
  camera.y = Math.max(0, Math.min(WORLD.h - canvas.height, player.y - canvas.height/2));
  updateUI();
}

function gainXP(amount){
  player.xp += amount;
  while(player.xp >= player.xpNext){ 
    player.xp -= player.xpNext; 
    player.level += 1; 
    player.xpNext = Math.round(player.xpNext * 1.6);
    // Apply class per-level bonuses
    if(player.classKey) {
      applyClassBonus();
    }
    // Automatically allocate the normal stat point to the class-preferred stat
    if(player.classKey && CLASSES[player.classKey].autoAlloc){
      const target = CLASSES[player.classKey].autoAlloc;
      if(target === 'str'){ player.str++; player.maxHp += 10; player.hp += 10; }
      else if(target === 'dex'){ player.dex++; player.speed += 0.15; }
      else if(target === 'per'){ player.per++; }
      else if(target === 'mana'){ player.manaStat += 1; player.maxMana += 6; player.mana += 6; }
      else if(target === 'vit'){ player.vit++; player.maxHp += 10; player.maxStam += 10; player.hp += 10; player.stam += 10; }
    }
    // After automatic allocation, award 1 free stat point for the player to spend manually
    player.freeStatPoints = (player.freeStatPoints || 0) + 1;
    // no blocking prompt shown on level-up anymore
  }
}

function showLevelModal(){
  if(!player.classKey){ showClassModal(); return; }
  // intentionally no modal shown for level-ups
}

function showClassModal(){
  classModal.style.display = 'block';
}

function hideClassModal(){
  classModal.style.display = 'none';
}

function selectClass(classKey){
  player.classKey = classKey;
  player.class = CLASSES[classKey].name;
  player.abilities = CLASSES[classKey].abilities;
  player.freeStatPoints = 0;
  hideClassModal();
  updateAbilitiesUI();
  updateUI();
}

function updateAbilitiesUI(){
  const abilitiesDiv = document.querySelector('.abilities');
  abilitiesDiv.innerHTML = '';
  if(player.abilities && player.abilities.length > 0){
    player.abilities.forEach(ability => {
      const el = document.createElement('div');
      el.className = 'ability';
      el.innerHTML = `<b>${ability.name}</b> ${ability.key === 'click' ? 'Click to activate' : `Press <kbd>${ability.key}</kbd>`}<br><span class="muted">Cost: ${ability.cost}</span>`;
      abilitiesDiv.appendChild(el);
    });
  }
}

function applyClassBonus(){
  if(!player.classKey) return;
  const bonus = CLASSES[player.classKey].bonuses;
  player.str += bonus.str;
  player.dex += bonus.dex;
  player.per += bonus.per;
  player.manaStat += bonus.manaStat;
  player.vit += bonus.vit;
  
  // Update derived stats
  player.maxHp += (bonus.str * 10) + (bonus.vit * 10);
  player.hp = player.maxHp;
  player.maxStam += bonus.vit * 10;
  player.stam = Math.min(player.stam + (bonus.vit * 10), player.maxStam);
  player.maxMana += bonus.manaStat * 6;
  player.mana = player.maxMana;
  player.speed += bonus.dex * 0.15;
}

// Stat button click handlers removed - buttons no longer in main DOM (moved to stat screen)

// Loot modal
// Loot modal button removed - handled via lootModal element directly

function openLoot(){
  lootList.innerHTML='';
  player.inv.forEach(it=>{ const el = document.createElement('div'); el.className='loot-item'; el.innerHTML = `<b>${it.name}</b><div class="muted">x${it.qty}</div>`; lootList.appendChild(el); });
  lootModal.style.display = 'block';
}

// Game over
function gameOver(){
  alert('You have fallen. The wilds reclaim another hunter.');
  player.hp = player.maxHp = 50; player.mana = player.maxMana = 30; player.xp = 0; player.level = 1; player.inv = []; enemies.length=0; projectiles.length=0; updateUI();
}

// Draw
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawEnvironment();
  for(const en of enemies){
    const sx = en.x - camera.x, sy = en.y - camera.y;
    ctx.beginPath(); ctx.fillStyle = en.color; ctx.globalAlpha = 0.95; ctx.arc(sx,sy,en.r,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(sx-en.r, sy-en.r-10, en.r*2,6);
    ctx.fillStyle='rgba(255,120,120,0.9)'; ctx.fillRect(sx-en.r, sy-en.r-10, en.r*2 * Math.max(0,en.hp/en.baseHp),6);
  }
  for(const p of projectiles){ const px = p.x - camera.x, py = p.y - camera.y; ctx.beginPath(); ctx.fillStyle='#66e0ff'; ctx.arc(px,py,4,0,Math.PI*2); ctx.fill(); }
  const px = player.x - camera.x, py = player.y - camera.y;
  ctx.beginPath(); ctx.fillStyle='#e0f6ff'; ctx.arc(px, py, player.r,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.strokeStyle='rgba(80,180,255,0.08)'; ctx.lineWidth=10; ctx.arc(px, py, player.r+20,0,Math.PI*2); ctx.stroke(); ctx.lineWidth=1;
  ctx.beginPath(); ctx.strokeStyle='rgba(180,230,255,0.4)'; ctx.arc(mouse.x, mouse.y, 10, 0, Math.PI*2); ctx.stroke();
}

function drawHUD(){
  if(!ctx) return; // Early return if context isn't available
  
  // Top-left: Health, Stamina, Mana bars
  const barWidth = 150, barHeight = 12, padding = 12, gap = 6;
  let y = padding;
  
  // Health bar
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(padding, y, barWidth, barHeight);
  ctx.fillStyle = '#ff4444';
  const hpRatio = Math.max(0, Math.min(1, player.hp / (player.maxHp || 50)));
  ctx.fillRect(padding, y, barWidth * hpRatio, barHeight);
  ctx.fillStyle = '#fff';
  ctx.font = '11px Inter';
  ctx.fillText(`HP: ${Math.round(player.hp)}/${player.maxHp}`, padding + 4, y + 10);
  y += barHeight + gap;
  
  // Stamina bar
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(padding, y, barWidth, barHeight);
  ctx.fillStyle = '#ffaa44';
  const stamRatio = Math.max(0, Math.min(1, player.stam / (player.maxStam || 100)));
  ctx.fillRect(padding, y, barWidth * stamRatio, barHeight);
  ctx.fillStyle = '#fff';
  ctx.fillText(`STAM: ${Math.round(player.stam)}/${player.maxStam}`, padding + 4, y + 10);
  y += barHeight + gap;
  
  // Mana bar
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(padding, y, barWidth, barHeight);
  ctx.fillStyle = '#6dd5ff';
  const manaRatio = Math.max(0, Math.min(1, player.mana / (player.maxMana || 30)));
  ctx.fillRect(padding, y, barWidth * manaRatio, barHeight);
  ctx.fillStyle = '#fff';
  ctx.fillText(`MANA: ${Math.round(player.mana)}/${player.maxMana}`, padding + 4, y + 10);
  
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

function drawEnvironment(){
  // Plains biome background
  const g = ctx.createLinearGradient(0,0,0,canvas.height); 
  g.addColorStop(0,'rgba(135,206,235,0.3)'); // sky blue
  g.addColorStop(1,'rgba(85,180,100,0.2)'); // grass green
  ctx.fillStyle = g; 
  ctx.fillRect(0,0,canvas.width,canvas.height);
  
  // Grass patches (plains)
  for(let i=0;i<40;i++){
    const wx = (i*373) % WORLD.w; const wy = ((i*137) % WORLD.h);
    const sx = wx - camera.x; const sy = wy - camera.y;
    if(sx < -120 || sx > canvas.width+120 || sy < -80 || sy > canvas.height+80) continue;
    ctx.beginPath(); ctx.fillStyle = 'rgba(100,180,80,0.15)'; ctx.ellipse(sx,sy,80,40,0,0,Math.PI*2); ctx.fill();
  }
  
  // Trees scattered (plains)
  for(let i=0;i<8;i++){
    const fx = (i*587)%WORLD.w; const fy = (i*431)%WORLD.h; 
    const sx = fx - camera.x; const sy = fy - camera.y;
    if(sx < -60 || sx > canvas.width+60 || sy < -60 || sy > canvas.height+60) continue;
    // Tree trunk
    ctx.fillStyle='rgba(101,67,33,0.4)';
    ctx.fillRect(sx-4, sy, 8, 30);
    // Tree foliage
    ctx.fillStyle='rgba(34,139,34,0.4)';
    ctx.beginPath();
    ctx.arc(sx, sy-5, 20, 0, Math.PI*2);
    ctx.fill();
  }
}

// Stat Screen UI functions
function toggleStatScreen(){
  if(statScreen.style.display === 'block'){
    statScreen.style.display = 'none';
  } else {
    updateStatScreenUI();
    statScreen.style.display = 'block';
  }
}

function updateStatScreenUI(){
  // Update stats tab
  document.getElementById('screenStr').textContent = player.str;
  document.getElementById('screenDex').textContent = player.dex;
  document.getElementById('screenPer').textContent = player.per;
  document.getElementById('screenMana').textContent = player.manaStat;
  document.getElementById('screenVit').textContent = player.vit;
  
  // Derived stats
  document.getElementById('screenHp').textContent = `${Math.round(player.hp)} / ${player.maxHp}`;
  document.getElementById('screenStam').textContent = `${Math.round(player.stam)} / ${player.maxStam}`;
  document.getElementById('screenManaPool').textContent = `${Math.round(player.mana)} / ${player.maxMana}`;
  document.getElementById('screenSpeed').textContent = player.speed.toFixed(2);
  document.getElementById('screenCritChance').textContent = '0%'; // placeholder
  
  // Progression
  document.getElementById('screenLevel').textContent = player.level;
  document.getElementById('screenXp').textContent = `${player.xp} / ${player.xpNext}`;
  document.getElementById('screenClass').textContent = player.class || 'None';
  document.getElementById('screenFreePoints').textContent = player.freeStatPoints;
  
  // Update abilities tab
  const abilitiesList = document.getElementById('screenAbilitiesList');
  abilitiesList.innerHTML = '';
  if(player.abilities && player.abilities.length > 0){
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

function allocateStatPoint(stat){
  if(player.freeStatPoints <= 0) return;
  
  player.freeStatPoints--;
  
  if(stat === 'str'){
    player.str++;
    player.maxHp += 10;
    player.hp += 10;
  } else if(stat === 'dex'){
    player.dex++;
    player.speed += 0.15;
  } else if(stat === 'per'){
    player.per++;
  } else if(stat === 'mana'){
    player.manaStat++;
    player.maxMana += 6;
    player.mana += 6;
  } else if(stat === 'vit'){
    player.vit++;
    player.maxHp += 10;
    player.maxStam += 10;
    player.hp += 10;
    player.stam += 10;
  }
  
  updateStatScreenUI();
  updateUI();
}

function switchStatTab(tabName){
  // Hide all tabs
  document.getElementById('statsTab').classList.remove('active');
  document.getElementById('abilitiesTab').classList.remove('active');
  document.getElementById('equipmentTab').classList.remove('active');
  
  // Deactivate all tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  
  // Show selected tab and activate button
  const tabId = tabName + 'Tab';
  if(document.getElementById(tabId)){
    document.getElementById(tabId).classList.add('active');
  }
  // Activate corresponding button
  event.target.classList.add('active');
}

// main loop
function loop(){
  // compute mouse world coords
  mouse.worldX = camera.x + mouse.x;
  mouse.worldY = camera.y + mouse.y;
  update(); draw(); drawHUD(); requestAnimationFrame(loop);
}
loop();

// open loot when inventory grows
setInterval(()=>{ if(player.inv.length>0 && lootModal.style.display==='none') openLoot(); }, 1100);

// automatic enemy spawning (internal timer, no UI countdown)
setInterval(()=>{
  const count = 1 + Math.floor(Math.random() * (1 + Math.floor(player.level/4)));
  for(let i=0;i<count;i++) spawnEnemy();
}, 2400 + Math.random()*1200);

// initial placement
player.x = WORLD.w/2; player.y = WORLD.h/2;
// Show class selection at start
showClassModal();
updateUI();
