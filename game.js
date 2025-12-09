// Basic single-file game logic moved to game.js: player, abilities, enemies, loot, leveling
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
function resize(){canvas.width = innerWidth; canvas.height = innerHeight}
addEventListener('resize', resize); resize();

// UI elements
const xpBar = document.getElementById('xpBar');
const levelEl = document.getElementById('level');
const xpEl = document.getElementById('xp');
const xpNextEl = document.getElementById('xpNext');
const className = document.getElementById('className');
const hpEl = document.getElementById('hp');
const manaEl = document.getElementById('mana');
const statStr = document.getElementById('statStr');
const statDex = document.getElementById('statDex');
const statPer = document.getElementById('statPer');
const statMana = document.getElementById('statMana');
const statVit = document.getElementById('statVit');
const invCount = document.getElementById('invCount');

// Modals
const levelModal = document.getElementById('levelModal');
const lootModal = document.getElementById('lootModal');
const lootList = document.getElementById('lootList');

// Player (movement, stamina)
const player = {
  x: canvas.width/2, y: canvas.height/2, r:16,
  vx:0, vy:0, maxSpeed:3,
  hp:50, maxHp:50, mana:30, maxMana:30,
  stam:100, maxStam:100,
  str:3,dex:3,per:3,manaStat:10,vit:10,
  level:1, xp:0, xpNext:100, class:'Rookie', inv:[],
  speed:2,
};

function updateUI(){
  levelEl.textContent = player.level;
  xpEl.textContent = player.xp;
  xpNextEl.textContent = player.xpNext;
  xpBar.style.width = Math.min(100, (player.xp/player.xpNext*100))+'%';
  className.textContent = player.class;
  hpEl.textContent = Math.round(player.hp)+'/'+player.maxHp;
  manaEl.textContent = Math.round(player.mana)+'/'+player.maxMana;
  statStr.textContent = player.str;
  statDex.textContent = player.dex;
  statPer.textContent = player.per;
  statMana.textContent = player.manaStat;
  statVit.textContent = player.vit;
  invCount.textContent = player.inv.length;
  document.getElementById('stam').textContent = Math.round(player.stam);
}

// Projectiles
const projectiles = [];
function spawnProjectile(x,y,dx,dy,dmg){projectiles.push({x,y,dx,dy,dmg,ttl:120})}

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
  const ex = x|| (Math.random()<0.5?50:canvas.width-50);
  const ey = y|| (Math.random()*canvas.height);
  enemies.push({x:ex,y:ey,r:18,hp:t.hp,baseHp:t.hp,spd:t.spd,damage:t.damage,color:t.color,name:t.name,xp:t.xp});
}

// Interaction: Explore button spawns enemies (no timers)
document.getElementById('exploreBtn').addEventListener('click',()=>{
  const count = 1 + Math.floor(Math.random()*3);
  for(let i=0;i<count;i++) spawnEnemy();
});

// Camp button: show crafting hint, small heal, mana restore
document.getElementById('campBtn').addEventListener('click',()=>{
  player.hp = Math.min(player.maxHp, player.hp + Math.round(10 + player.vit*0.5));
  player.mana = Math.min(player.maxMana, player.mana + Math.round(12 + player.manaStat*0.6));
  alert('You rest at a small campfire — healing and mana restored. Crafting hints: combine herbs + crystal shards into Mana Salve.');
  updateUI();
});

// Basic input
let mouse = {x:0,y:0,down:false};
const keys = {};
canvas.addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY});
canvas.addEventListener('mousedown',e=>{mouse.down=true; fireManaBolt();});
canvas.addEventListener('mouseup',e=>{mouse.down=false});
addEventListener('keydown', (e)=>{ keys[e.key.toLowerCase()] = true; });
addEventListener('keyup', (e)=>{ keys[e.key.toLowerCase()] = false; });

// Abilities
function fireManaBolt(){
  if(player.mana < 6) return; // need mana
  player.mana -= 6;
  const ang = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  const speed = 8 + player.per*0.5;
  spawnProjectile(player.x, player.y, Math.cos(ang)*speed, Math.sin(ang)*speed, 6 + Math.floor(player.per*1.5));
}

function shadeStep(){
  if(player.mana < 10 || player.stam < 20) return;
  player.mana -= 10;
  player.stam = Math.max(0, player.stam - 20);
  const ang = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  // shorter, more tactical dash
  player.x += Math.cos(ang)*120;
  player.y += Math.sin(ang)*120;
  player.x = Math.max(20, Math.min(canvas.width-20, player.x));
  player.y = Math.max(20, Math.min(canvas.height-20, player.y));
}

addEventListener('keydown', (e)=>{
  if(e.key==='e' || e.key==='E') shadeStep();
  if(e.key==='l' || e.key==='L') showLevelModal();
});

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
  // apply input to velocity
  if(inputX !== 0 || inputY !== 0){
    const len = Math.sqrt(inputX*inputX + inputY*inputY) || 1;
    player.vx += (inputX/len) * accel;
    player.vy += (inputY/len) * accel;
  } else {
    // friction
    player.vx *= 0.88; player.vy *= 0.88;
  }
  // clamp speed
  const sp = Math.sqrt(player.vx*player.vx + player.vy*player.vy);
  if(sp > maxSpeed){ player.vx = (player.vx/sp) * maxSpeed; player.vy = (player.vy/sp) * maxSpeed; }
  player.x += player.vx; player.y += player.vy;

  for(let i=projectiles.length-1;i>=0;i--){
    const p = projectiles[i];
    p.x += p.dx; p.y += p.dy; p.ttl--;
    // projectile collisions: can hit enemies (owner==='player') or player (owner==='enemy')
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

  // Enemy AI with simple states: idle/patrol/chase/attack
  for(let i=enemies.length-1;i>=0;i--){
    const en = enemies[i];
    if(!en.state) en.state = 'idle';
    // simple avoidance (repel nearby enemies)
    let ax=0, ay=0;
    for(const other of enemies){ if(other===en) continue; const ddx = en.x - other.x, ddy = en.y - other.y; const d2 = ddx*ddx+ddy*ddy; if(d2 < 1200){ ax += ddx*0.002; ay += ddy*0.002; } }

    const dx = player.x - en.x, dy = player.y - en.y;
    const dist = Math.sqrt(dx*dx+dy*dy);
    // aggro radius influenced by player's Perception
    const aggro = 140 + (player.per*6);
    if(en.state === 'idle'){
      // small chance to patrol
      if(Math.random()<0.01) { en.state='patrol'; en.px = en.x + (Math.random()-0.5)*180; en.py = en.y + (Math.random()-0.5)*120; }
      if(dist < aggro) en.state='chase';
    } else if(en.state === 'patrol'){
      const pdx = en.px - en.x, pdy = en.py - en.y; const pd = Math.sqrt(pdx*pdx + pdy*pdy) || 1;
      en.x += pdx/pd * en.spd * 0.8; en.y += pdy/pd * en.spd * 0.8;
      if(pd < 6) en.state = 'idle';
      if(dist < aggro) en.state='chase';
    } else if(en.state === 'chase'){
      // different behavior for ranged vs melee
      if(en.type === 'ranged'){
        // keep distance
        const desired = 220;
        if(dist < desired*0.9) { en.x -= dx/dist * en.spd * 0.8; en.y -= dy/dist * en.spd * 0.8; }
        else if(dist > desired*1.1) { en.x += dx/dist * en.spd * 0.9; en.y += dy/dist * en.spd * 0.9; }
        // fire if line clear and cooldown
        if(!en.cooldown) en.cooldown = 0;
        if(en.cooldown <= 0 && dist < 600){
          // fire projectile
          const speed = 4 + Math.random()*2;
          const ang = Math.atan2(player.y - en.y, player.x - en.x);
          projectiles.push({x:en.x, y:en.y, dx:Math.cos(ang)*speed, dy:Math.sin(ang)*speed, dmg: en.damage, ttl: 180, owner:'enemy'});
          en.cooldown = 80 + Math.floor(Math.random()*40);
        }
        en.cooldown = Math.max(0, (en.cooldown||0) - 1);
      } else {
        // melee: move to player
        en.x += dx/dist * en.spd; en.y += dy/dist * en.spd;
      }
      if(dist < en.r + player.r + 8) en.state = 'attack';
      if(dist > aggro*1.6) en.state = 'idle';
    } else if(en.state === 'attack'){
      // attack burst
      if(!en.attackTimer) en.attackTimer = 0;
      if(en.attackTimer <= 0){
        // melee attack reduces player hp
        if(dist < en.r + player.r + 8){ player.hp -= en.damage; }
        en.attackTimer = 40 + Math.floor(Math.random()*30);
      } else {
        en.attackTimer--;
      }
      if(dist > en.r + player.r + 20) en.state = 'chase';
    }
    // apply avoidance
    en.x += ax; en.y += ay;
  }

  player.x = Math.max(20, Math.min(canvas.width-20, player.x));
  player.y = Math.max(20, Math.min(canvas.height-20, player.y));
  updateUI();
}

function gainXP(amount){
  player.xp += amount;
  while(player.xp >= player.xpNext){
    player.xp -= player.xpNext; player.level += 1; player.xpNext = Math.round(player.xpNext * 1.6);
    showLevelModal();
  }
}

function showLevelModal(){ levelModal.style.display = 'block'; }
function hideLevelModal(){ levelModal.style.display = 'none'; }

document.getElementById('addStr').addEventListener('click', ()=>{ player.str++; player.maxHp += 4; player.hp +=4; hideLevelModal(); updateUI(); });
document.getElementById('addDex').addEventListener('click', ()=>{ player.dex++; player.speed += 0.15; hideLevelModal(); updateUI(); });
document.getElementById('addPer').addEventListener('click', ()=>{ player.per++; hideLevelModal(); updateUI(); });
document.getElementById('addMana').addEventListener('click', ()=>{ player.manaStat += 4; player.maxMana += 6; player.mana +=6; hideLevelModal(); updateUI(); });
document.getElementById('addVit').addEventListener('click', ()=>{ player.vit++; player.maxHp += 6; player.hp +=6; hideLevelModal(); updateUI(); });
document.getElementById('closeLevel').addEventListener('click', hideLevelModal);

// Loot modal
document.getElementById('takeLoot').addEventListener('click', ()=>{ player.inv = []; lootModal.style.display='none'; updateUI(); });

function openLoot(){
  lootList.innerHTML='';
  player.inv.forEach(it=>{
    const el = document.createElement('div'); el.className='loot-item'; el.innerHTML = `<b>${it.name}</b><div class="muted">x${it.qty}</div>`; lootList.appendChild(el);
  });
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
  for(const en of enemies){ ctx.beginPath(); ctx.fillStyle = en.color; ctx.globalAlpha = 0.95; ctx.arc(en.x,en.y,en.r,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(en.x-en.r, en.y-en.r-10, en.r*2,6); ctx.fillStyle='rgba(255,120,120,0.9)'; ctx.fillRect(en.x-en.r, en.y-en.r-10, en.r*2 * Math.max(0,en.hp/en.baseHp),6); }
  for(const p of projectiles){ctx.beginPath(); ctx.fillStyle='#66e0ff'; ctx.arc(p.x,p.y,4,0,Math.PI*2); ctx.fill();}
  ctx.beginPath(); ctx.fillStyle='#e0f6ff'; ctx.arc(player.x, player.y, player.r,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.strokeStyle='rgba(80,180,255,0.08)'; ctx.lineWidth=10; ctx.arc(player.x, player.y, player.r+20,0,Math.PI*2); ctx.stroke(); ctx.lineWidth=1; ctx.beginPath(); ctx.strokeStyle='rgba(180,230,255,0.4)'; ctx.arc(mouse.x, mouse.y, 10, 0, Math.PI*2); ctx.stroke();
}

function drawEnvironment(){
  for(let i=0;i<24;i++){ const x = (i*73) % canvas.width; const y = ((i*137) % canvas.height); ctx.beginPath(); ctx.fillStyle = 'rgba(70,120,220,0.03)'; ctx.ellipse(x,y,60,24,0,0,Math.PI*2); ctx.fill(); }
  const g = ctx.createLinearGradient(0,0,0,canvas.height); g.addColorStop(0,'rgba(12,18,24,0.2)'); g.addColorStop(1,'rgba(0,0,0,0.6)'); ctx.fillStyle = g; ctx.fillRect(0,0,canvas.width,canvas.height);
  for(let i=0;i<14;i++){const fx = (i*199)%canvas.width; const fy=canvas.height-40 - (i%4)*30; ctx.beginPath(); ctx.fillStyle='rgba(90,180,160,0.06)'; ctx.ellipse(fx,fy,90,40,0,0,Math.PI*2); ctx.fill();}
}

// main loop
function loop(){update(); draw(); requestAnimationFrame(loop);} loop();

// open loot when inventory grows
setInterval(()=>{ if(player.inv.length>0 && lootModal.style.display==='none') openLoot(); }, 1100);

// initial placement
player.x = canvas.width/2; player.y = canvas.height/2; updateUI();
