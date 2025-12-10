// Game Systems - Core game logic organized into modules

// ===== PLAYER SYSTEM =====
class PlayerSystem {
  constructor() {
    this.player = {
      x: GAME_CONFIG.player.startX,
      y: GAME_CONFIG.player.startY,
      r: GAME_CONFIG.player.radius,
      vx: 0,
      vy: 0,
      maxSpeed: GAME_CONFIG.player.maxSpeed,
      
      // Stats
      str: GAME_CONFIG.player.startStats.str,
      dex: GAME_CONFIG.player.startStats.dex,
      per: GAME_CONFIG.player.startStats.per,
      manaStat: GAME_CONFIG.player.startStats.mana,
      vit: GAME_CONFIG.player.startStats.vit,
      
      // Resources
      hp: GAME_CONFIG.player.startHp,
      maxHp: GAME_CONFIG.player.startHp,
      mana: GAME_CONFIG.player.startMana,
      maxMana: GAME_CONFIG.player.startMana,
      stam: GAME_CONFIG.player.startStamina,
      maxStam: GAME_CONFIG.player.startStamina,
      
      // Progression
      level: GAME_CONFIG.player.startLevel,
      xp: GAME_CONFIG.player.startXp,
      xpNext: GAME_CONFIG.player.startXpNext,
      
      // Class & abilities
      class: null,
      classKey: null,
      abilities: [],
      freeStatPoints: 0,
      
      // Inventory
      inventory: [],
      
      // Gameplay
      speed: 2,
      isSprinting: false,
      staminaDrain: 0.4
    };
  }

  getPlayer() {
    return this.player;
  }

  gainXP(amount) {
    this.player.xp += amount;
    while (this.player.xp >= this.player.xpNext) {
      this.player.xp -= this.player.xpNext;
      this.levelUp();
    }
  }

  levelUp() {
    this.player.level += 1;
    this.player.xpNext = Math.round(this.player.xpNext * 1.6);
    
    // Apply class bonuses
    if (this.player.classKey) {
      this.applyClassBonus();
    }
    
    // Auto-allocate to class-preferred stat
    if (this.player.classKey) {
      const autoStat = CLASSES[this.player.classKey].autoAlloc;
      this.allocateStat(autoStat, true); // silent allocation
    }
    
    // Award free point for manual allocation
    this.player.freeStatPoints += 1;
  }

  selectClass(classKey) {
    this.player.classKey = classKey;
    this.player.class = CLASSES[classKey].name;
    this.player.abilities = [...CLASSES[classKey].abilities];
    this.player.freeStatPoints = 0;
  }

  applyClassBonus() {
    if (!this.player.classKey) return;
    const bonus = CLASSES[this.player.classKey].bonuses;
    
    this.player.str += bonus.str;
    this.player.dex += bonus.dex;
    this.player.per += bonus.per;
    this.player.manaStat += bonus.manaStat;
    this.player.vit += bonus.vit;
    
    // Update derived stats
    this.player.maxHp += (bonus.str * 10) + (bonus.vit * 10);
    this.player.hp = Math.min(this.player.hp + (bonus.str * 10) + (bonus.vit * 10), this.player.maxHp);
    
    this.player.maxStam += bonus.vit * 10;
    this.player.stam = Math.min(this.player.stam + (bonus.vit * 10), this.player.maxStam);
    
    this.player.maxMana += bonus.manaStat * 6;
    this.player.mana = Math.min(this.player.mana + (bonus.manaStat * 6), this.player.maxMana);
    
    this.player.speed += bonus.dex * 0.15;
  }

  allocateStat(stat, silent = false) {
    if (!silent && this.player.freeStatPoints <= 0) return false;
    if (!silent) this.player.freeStatPoints--;
    
    switch (stat) {
      case 'str':
        this.player.str++;
        this.player.maxHp += 10;
        this.player.hp += 10;
        break;
      case 'dex':
        this.player.dex++;
        this.player.speed += 0.15;
        break;
      case 'per':
        this.player.per++;
        break;
      case 'mana':
        this.player.manaStat++;
        this.player.maxMana += 6;
        this.player.mana += 6;
        break;
      case 'vit':
        this.player.vit++;
        this.player.maxHp += 10;
        this.player.maxStam += 10;
        this.player.hp += 10;
        this.player.stam += 10;
        break;
    }
    return true;
  }

  takeDamage(amount) {
    this.player.hp = Math.max(0, this.player.hp - amount);
    return this.player.hp <= 0;
  }

  heal(amount) {
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + amount);
  }

  restoreMana(amount) {
    this.player.mana = Math.min(this.player.maxMana, this.player.mana + amount);
  }

  drainStamina(amount) {
    this.player.stam = Math.max(0, this.player.stam - amount);
  }

  restoreStamina(amount) {
    this.player.stam = Math.min(this.player.maxStam, this.player.stam + amount);
  }

  isAlive() {
    return this.player.hp > 0;
  }

  reset() {
    // Soft reset for game over
    Object.assign(this.player, {
      hp: GAME_CONFIG.player.startHp,
      maxHp: GAME_CONFIG.player.startHp,
      mana: GAME_CONFIG.player.startMana,
      maxMana: GAME_CONFIG.player.startMana,
      stam: GAME_CONFIG.player.startStamina,
      maxStam: GAME_CONFIG.player.startStamina,
      level: GAME_CONFIG.player.startLevel,
      xp: GAME_CONFIG.player.startXp,
      xpNext: GAME_CONFIG.player.startXpNext,
      inventory: [],
      freeStatPoints: 0
    });
  }
}

// ===== ENEMY SYSTEM =====
class EnemySystem {
  constructor(world) {
    this.enemies = [];
    this.world = world;
    this.nextSpawnTime = Date.now() + SPAWN_CONFIG.baseSpawnInterval;
  }

  spawnEnemy(x = null, y = null, enemyType = null) {
    const w = this.world.w;
    const h = this.world.h;
    
    // Random spawn location if not provided
    if (x === null || y === null) {
      const angle = Math.random() * Math.PI * 2;
      const distance = SPAWN_CONFIG.minDistance + 
        Math.random() * (SPAWN_CONFIG.maxDistance - SPAWN_CONFIG.minDistance);
      x = w / 2 + Math.cos(angle) * distance;
      y = h / 2 + Math.sin(angle) * distance;
    }
    
    // Choose random enemy type if not specified
    if (!enemyType) {
      enemyType = randomElement(ENEMY_TYPES);
    }
    
    // Distance-based scaling
    const scaling = getDistanceScaling(x, y, w, h, 0.5, 2.0);
    
    const enemy = {
      id: generateId(),
      type: enemyType.id,
      name: enemyType.name,
      x: x,
      y: y,
      r: 10,
      vx: 0,
      vy: 0,
      
      // Stats
      baseHp: enemyType.hp * scaling,
      hp: enemyType.hp * scaling,
      damage: enemyType.damage * scaling,
      speed: enemyType.spd,
      color: enemyType.color,
      
      // AI
      state: 'idle',
      stateTimer: 0,
      targetX: x,
      targetY: y,
      
      // Combat
      attackTimer: 0,
      shootCooldown: 0,
      
      // Loot
      xp: enemyType.xp,
      rarity: enemyType.rarity
    };
    
    this.enemies.push(enemy);
    return enemy;
  }

  removeEnemy(id) {
    const index = this.enemies.findIndex(e => e.id === id);
    if (index !== -1) {
      this.enemies.splice(index, 1);
      return true;
    }
    return false;
  }

  updateAI(player, camera) {
    for (const enemy of this.enemies) {
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const aggroRange = 140 + (player.per * 6);
      
      // Simple AI state machine
      if (enemy.state === 'idle') {
        if (Math.random() < 0.01) {
          enemy.state = 'patrol';
          enemy.targetX = enemy.x + (Math.random() - 0.5) * 180;
          enemy.targetY = enemy.y + (Math.random() - 0.5) * 120;
          enemy.stateTimer = 0;
        }
        if (dist < aggroRange) {
          enemy.state = 'chase';
        }
      } else if (enemy.state === 'patrol') {
        const pdx = enemy.targetX - enemy.x;
        const pdy = enemy.targetY - enemy.y;
        const pdist = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
        
        enemy.x += (pdx / pdist) * enemy.speed * 0.8;
        enemy.y += (pdy / pdist) * enemy.speed * 0.8;
        
        if (pdist < 6) {
          enemy.state = 'idle';
        }
        if (dist < aggroRange) {
          enemy.state = 'chase';
        }
      } else if (enemy.state === 'chase') {
        enemy.x += (dx / dist) * enemy.speed;
        enemy.y += (dy / dist) * enemy.speed;
        
        if (dist < enemy.r + player.r + 8) {
          enemy.state = 'attack';
          enemy.attackTimer = 0;
        }
        if (dist > aggroRange * 1.6) {
          enemy.state = 'idle';
        }
      } else if (enemy.state === 'attack') {
        if (enemy.attackTimer <= 0) {
          if (dist < enemy.r + player.r + 8) {
            return { type: 'damage', amount: enemy.damage };
          }
          enemy.attackTimer = 40 + Math.floor(Math.random() * 30);
        } else {
          enemy.attackTimer--;
        }
        
        if (dist > enemy.r + player.r + 20) {
          enemy.state = 'chase';
        }
      }
    }
    return null;
  }

  getEnemies() {
    return this.enemies;
  }

  clear() {
    this.enemies = [];
  }
}

// ===== PROJECTILE SYSTEM =====
class ProjectileSystem {
  constructor() {
    this.projectiles = [];
  }

  spawn(x, y, dx, dy, damage, owner = 'player', type = 'bolt') {
    this.projectiles.push({
      id: generateId(),
      x: x,
      y: y,
      dx: dx,
      dy: dy,
      damage: damage,
      owner: owner,
      type: type,
      ttl: 120,
      vx: dx,
      vy: dy
    });
  }

  update() {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.dx;
      p.y += p.dy;
      p.ttl--;
      
      if (p.ttl <= 0) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  checkCollision(enemies, player) {
    const hits = [];
    
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      
      if (p.owner === 'player') {
        // Check collision with enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
          const en = enemies[j];
          const dist = distance(p.x, p.y, en.x, en.y);
          
          if (dist < en.r + 4) {
            hits.push({
              projectile: i,
              enemy: j,
              damage: p.damage
            });
            p.ttl = 0;
            break;
          }
        }
      } else if (p.owner === 'enemy') {
        // Check collision with player
        const dist = distance(p.x, p.y, player.x, player.y);
        
        if (dist < player.r + 6) {
          hits.push({
            projectile: i,
            target: 'player',
            damage: p.damage
          });
          p.ttl = 0;
        }
      }
    }
    
    return hits;
  }

  getProjectiles() {
    return this.projectiles;
  }

  clear() {
    this.projectiles = [];
  }
}

// ===== ABILITY SYSTEM =====
class AbilitySystem {
  constructor(player) {
    this.player = player;
  }

  executeAbility(abilityIndex, targetX, targetY, projectileSystem) {
    if (!this.player.abilities || abilityIndex >= this.player.abilities.length) {
      return false;
    }
    
    const ability = this.player.abilities[abilityIndex];
    
    // Check mana cost
    if (this.player.mana < ability.cost) {
      return false;
    }
    
    // Execute ability
    this.player.mana -= ability.cost;
    
    const dx = targetX - this.player.x;
    const dy = targetY - this.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const speed = 4 + Math.random() * 2;
    
    // Generic projectile ability
    projectileSystem.spawn(
      this.player.x,
      this.player.y,
      (dx / dist) * speed,
      (dy / dist) * speed,
      6 + this.player.str * 0.5 + this.player.per * 1.5,
      'player',
      ability.name.toLowerCase()
    );
    
    return true;
  }

  getAbilities() {
    return this.player.abilities || [];
  }
}

// ===== LOOT SYSTEM =====
class LootSystem {
  constructor() {
    this.lootTable = LOOT_TABLE;
  }

  generateLoot(rarity = 'common') {
    const items = this.lootTable[rarity] || this.lootTable['common'];
    return randomElement(items);
  }

  dropLoot(x, y, rarity = 'common') {
    const item = this.generateLoot(rarity);
    return {
      id: generateId(),
      x: x,
      y: y,
      ...item,
      quantity: 1
    };
  }
}

// ===== CAMERA SYSTEM =====
class CameraSystem {
  constructor() {
    this.x = 0;
    this.y = 0;
  }

  update(player, worldW, worldH, viewportW, viewportH) {
    this.x = Math.max(0, Math.min(worldW - viewportW, player.x - viewportW / 2));
    this.y = Math.max(0, Math.min(worldH - viewportH, player.y - viewportH / 2));
  }

  getOffset() {
    return { x: this.x, y: this.y };
  }

  toWorldCoordinates(screenX, screenY) {
    return {
      x: screenX + this.x,
      y: screenY + this.y
    };
  }

  toScreenCoordinates(worldX, worldY) {
    return {
      x: worldX - this.x,
      y: worldY - this.y
    };
  }
}

// ===== PARTICLE SYSTEM (for future use) =====
class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawn(x, y, vx, vy, life = 30, color = '#6dd5ff', size = 3) {
    this.particles.push({
      x, y, vx, vy,
      life, maxLife: life,
      color, size,
      alpha: 1
    });
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.alpha = p.life / p.maxLife;
      
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  getParticles() {
    return this.particles;
  }

  clear() {
    this.particles = [];
  }
}

// Export all systems
const gameSystems = {
  PlayerSystem,
  EnemySystem,
  ProjectileSystem,
  AbilitySystem,
  LootSystem,
  CameraSystem,
  ParticleSystem
};
