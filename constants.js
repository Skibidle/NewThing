// Game Constants and Configuration
const GAME_CONFIG = {
  world: { w: 3000, h: 2000 },
  player: {
    startX: 1500,
    startY: 1000,
    radius: 16,
    maxSpeed: 3,
    startStats: { str: 10, dex: 10, per: 10, mana: 10, vit: 10 },
    startHp: 50,
    startMana: 30,
    startStamina: 100,
    startLevel: 1,
    startXp: 0,
    startXpNext: 100
  },
  camera: {
    offsetX: 0,
    offsetY: 0
  }
};

// Class Definitions with stat bonuses per level and abilities
const CLASSES = {
  warrior: {
    name: 'Warrior',
    description: '+2 STR, +1 VIT per level',
    bonuses: { str: 2, dex: 0, per: 0, manaStat: 0, vit: 1 },
    autoAlloc: 'str',
    color: '#ff6b6b',
    abilities: [
      { name: 'Cleave', key: 'click', cost: 8, desc: 'Slash with great force', damage: 1.3 },
      { name: 'Fortify', key: 'E', cost: 12, desc: 'Reduce damage by 30%', duration: 5 }
    ]
  },
  rogue: {
    name: 'Rogue',
    description: '+2 DEX, +1 PER per level',
    bonuses: { str: 0, dex: 2, per: 1, manaStat: 0, vit: 0 },
    autoAlloc: 'dex',
    color: '#6b7cff',
    abilities: [
      { name: 'Backstab', key: 'click', cost: 5, desc: 'Quick deadly strike', damage: 1.5, critChance: 0.25 },
      { name: 'Shadow Step', key: 'E', cost: 8, desc: 'Teleport a short distance', range: 120 }
    ]
  },
  mage: {
    name: 'Mage',
    description: '+3 MANA, +1 PER per level',
    bonuses: { str: 0, dex: 0, per: 1, manaStat: 3, vit: 0 },
    autoAlloc: 'mana',
    color: '#a78bfa',
    abilities: [
      { name: 'Mana Bolt', key: 'click', cost: 6, desc: 'Ranged magical projectile', damage: 0.8, aoe: 15 },
      { name: 'Fireball', key: 'E', cost: 15, desc: 'Area explosion attack', damage: 2.0, aoe: 50 }
    ]
  },
  ranger: {
    name: 'Ranger',
    description: '+1 STR, +1 DEX, +1 PER per level',
    bonuses: { str: 1, dex: 1, per: 1, manaStat: 0, vit: 0 },
    autoAlloc: 'per',
    color: '#34d399',
    abilities: [
      { name: 'Arrow Shot', key: 'click', cost: 4, desc: 'Precise ranged attack', damage: 1.0, accuracy: 0.95 },
      { name: 'Dash', key: 'E', cost: 10, desc: 'Quick movement', range: 150 }
    ]
  },
  paladin: {
    name: 'Paladin',
    description: '+1 STR, +2 VIT, +1 MANA per level',
    bonuses: { str: 1, dex: 0, per: 0, manaStat: 1, vit: 2 },
    autoAlloc: 'vit',
    color: '#fbbf24',
    abilities: [
      { name: 'Holy Strike', key: 'click', cost: 8, desc: 'Blessed melee attack', damage: 1.2, healing: 0.3 },
      { name: 'Light Shield', key: 'E', cost: 10, desc: 'Defensive barrier', reduction: 0.5, duration: 4 }
    ]
  }
};

// Enemy Types
const ENEMY_TYPES = [
  { id: 'hydra', name: 'Hydra-Serpent', hp: 40, spd: 0.8, damage: 10, color: '#8dc0ff', xp: 60, rarity: 'rare' },
  { id: 'shadow', name: 'Shadow Panther', hp: 24, spd: 2.4, damage: 8, color: '#2b2a3a', xp: 30, rarity: 'uncommon' },
  { id: 'wolf', name: 'Eldritch Wolf', hp: 20, spd: 1.8, damage: 6, color: '#6b7cff', xp: 25, rarity: 'common' },
  { id: 'hive', name: 'Insectoid Horror', hp: 30, spd: 1.2, damage: 7, color: '#9bf48b', xp: 40, rarity: 'uncommon' }
];

// Loot Table
const LOOT_TABLE = {
  common: [
    { name: 'Beast Pelt', rarity: 'common', value: 10, weight: 1 },
    { name: 'Bone Shard', rarity: 'common', value: 5, weight: 0.5 }
  ],
  uncommon: [
    { name: 'Mana Crystal', rarity: 'uncommon', value: 50, weight: 0.5 },
    { name: 'Essence Vial', rarity: 'uncommon', value: 30, weight: 0.3 }
  ],
  rare: [
    { name: 'Legendary Gem', rarity: 'rare', value: 200, weight: 0.1 },
    { name: 'Ancient Rune', rarity: 'rare', value: 150, weight: 0.2 }
  ]
};

// UI Colors
const UI_COLORS = {
  accent: '#6dd5ff',
  accentAlt: '#d095ff',
  health: '#ff5555',
  stamina: '#ffcc66',
  mana: '#6dd5ff',
  xp: '#34d399',
  text: '#e8f4fa',
  muted: '#b8c5d1'
};

// Spawn Configuration
const SPAWN_CONFIG = {
  minDistance: 300,
  maxDistance: 700,
  baseSpawnInterval: 2400,
  spawnVariance: 1200,
  maxEnemiesPerSpawn: 3
};

// Audio Configuration (for future sound implementation)
const AUDIO_CONFIG = {
  enabled: false,
  volume: 0.7,
  sounds: {
    attack: 'attack.mp3',
    levelUp: 'levelup.mp3',
    hit: 'hit.mp3',
    death: 'death.mp3'
  }
};

// Regeneration settings (per second)
const REGEN = {
  hpBase: 0.5,        // flat HP per second
  hpPerVit: 0.6,      // additional HP per second per VIT
  manaBase: 0.6,      // flat Mana per second
  manaPerStat: 0.8    // additional Mana per second per Mana stat
};
