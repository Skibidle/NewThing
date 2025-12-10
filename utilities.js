// Utility Functions

// Distance calculation
function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// Distance squared (avoid sqrt for performance)
function distanceSquared(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

// Angle between two points
function getAngle(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

// Normalize vector
function normalize(x, y) {
  const len = Math.sqrt(x * x + y * y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
}

// Clamp value between min and max
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// Random integer between min and max (inclusive)
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random float between min and max
function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

// Random element from array
function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Random weighted selection
function weightedRandom(items, weights) {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }
  return items[items.length - 1];
}

// Check circle-circle collision
function circleCollision(x1, y1, r1, x2, y2, r2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < r1 + r2;
}

// Check if point is within bounds
function inBounds(x, y, w, h) {
  return x >= 0 && x <= w && y >= 0 && y <= h;
}

// Lerp (linear interpolation)
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Ease out quadratic
function easeOutQuad(t) {
  return 1 - (1 - t) * (1 - t);
}

// Format number with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Calculate scaling multiplier based on distance from center
function getDistanceScaling(x, y, worldW, worldH, minScale = 0.5, maxScale = 2.0) {
  const centerX = worldW / 2;
  const centerY = worldH / 2;
  const dist = distance(x, y, centerX, centerY);
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
  const ratio = Math.min(dist / maxDist, 1.0);
  return minScale + (maxScale - minScale) * ratio;
}

// Get stat scaling from base stat (STR/DEX/PER/VIT/MANA)
function getStatScaling(statName, statValue) {
  switch (statName) {
    case 'str':
      return { hp: statValue * 10, damage: statValue * 0.5 };
    case 'dex':
      return { speed: statValue * 0.15, accuracy: statValue * 0.02 };
    case 'per':
      return { critChance: statValue * 0.02, xpBonus: statValue * 0.05 };
    case 'mana':
      return { manaPool: statValue * 6, magicDamage: statValue * 0.8 };
    case 'vit':
      return { hp: statValue * 10, stamina: statValue * 10, resistance: statValue * 0.02 };
    default:
      return {};
  }
}

// Create UI element helper
function createUIPanel(x, y, w, h, borderColor = '#6dd5ff') {
  return { x, y, w, h, borderColor };
}

// Hex color to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// RGB to hex
function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Generate unique ID
function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

// Deep clone object
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (obj instanceof Object) {
    const cloned = {};
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) cloned[key] = deepClone(obj[key]);
    }
    return cloned;
  }
}
