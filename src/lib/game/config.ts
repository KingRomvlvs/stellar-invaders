// Game Configuration Constants
// Centralized configuration for all game parameters

import type { InvaderType, AsteroidSize } from './types'

// ========== CANVAS ==========

export const CANVAS = {
  width: 800,
  height: 600,
} as const

// ========== TIMING ==========

export const TIMING = {
  fixedTimestep: 1000 / 60, // 60 updates per second (~16.67ms)
  maxFrameTime: 250, // Cap to prevent spiral of death
} as const

// ========== PLAYER ==========

export const PLAYER = {
  width: 48,
  height: 32,
  speed: 300, // pixels per second
  shootCooldown: 500, // ms between shots (classic feel)
  respawnTime: 1500, // ms
  invincibilityTime: 2000, // ms after respawn
  startLives: 3,
  startY: CANVAS.height - 50,
} as const

// ========== FORMATION ==========

export const FORMATION = {
  rows: 5,
  cols: 11,
  invaderWidth: 32,
  invaderHeight: 24,
  spacingX: 48,
  spacingY: 36,
  startX: 60,
  startY: 100,

  // Step-based movement (the Space Invaders signature)
  horizontalStep: 8, // pixels per step sideways
  verticalDrop: 16, // pixels when dropping
  minStepInterval: 100, // fastest speed (ms)
  maxStepInterval: 800, // slowest speed (ms)
  shootChance: 0.02, // 2% chance per step for bottom invaders

  // Difficulty scaling per wave
  stepIntervalReductionPerWave: 50, // ms faster per wave
} as const

// ========== INVADER TYPES ==========

export const INVADER_CONFIG: Record<
  InvaderType,
  { points: number; health: number }
> = {
  squid: { points: 30, health: 1 }, // Top row
  crab: { points: 20, health: 1 }, // Middle rows
  octopus: { points: 10, health: 1 }, // Bottom rows
}

// Row layout: which type on which row (0 = top)
export const INVADER_ROW_TYPES: InvaderType[] = [
  'squid',
  'crab',
  'crab',
  'octopus',
  'octopus',
]

// ========== PROJECTILES ==========

export const PROJECTILE = {
  player: {
    width: 4,
    height: 16,
    speed: 500, // pixels per second
  },
  enemy: {
    width: 4,
    height: 12,
    speed: 200, // pixels per second (slower than player)
  },
  boss: {
    width: 6,
    height: 14,
    speed: 280,
  },
} as const

// ========== BUNKERS ==========

export const BUNKER = {
  count: 4,
  width: 64,
  height: 48,
  cellSize: 4,
  yPosition: CANVAS.height - 120,
  cellHealth: 4, // hits before destroyed
} as const

// ========== BOSS ==========

export const BOSS = {
  width: 96,
  height: 64,
  baseHealth: 50,
  healthMultiplierPerBoss: 0.5, // +50% per subsequent boss
  speed: 100,
  waveInterval: 5, // Boss every 5 waves

  // Telegraphing
  telegraphDuration: 1000, // 1 second warning

  // Attack cooldowns by phase
  attackCooldown: {
    1: 2000,
    2: 1500,
    3: 1000,
  },

  // Phase thresholds
  phase2Threshold: 0.6, // 60% health
  phase3Threshold: 0.3, // 30% health

  // Limited adds
  maxAdds: 3,
  addsCooldown: 8000,
} as const

// ========== MYSTERY UFO ==========

export const UFO = {
  width: 48,
  height: 20,
  speed: 120,
  minPoints: 50,
  maxPoints: 300,
  spawnInterval: 20000, // ms between spawn checks
  spawnChance: 0.3, // 30% chance when interval passes
} as const

// ========== ASTEROIDS ==========

export const ASTEROID_CONFIG: Record<
  AsteroidSize,
  { width: number; height: number; health: number; speed: number; points: number }
> = {
  large: { width: 48, height: 48, health: 3, speed: 60, points: 50 },
  medium: { width: 32, height: 32, health: 2, speed: 80, points: 30 },
  small: { width: 20, height: 20, health: 1, speed: 100, points: 20 },
}

export const ASTEROID = {
  maxPerWave: {
    1: 0, // No asteroids wave 1
    2: 1,
    3: 1,
    4: 2,
    default: 2, // Cap at 2 for early waves as requested
  },
  spawnInterval: 10000, // ms
  spawnChance: 0.4,
} as const

// ========== PARTICLES ==========

export const PARTICLES = {
  explosionCount: 20,
  explosionSpeed: 200,
  explosionLifetime: 600,
  debrisCount: 8,
  debrisLifetime: 800,
} as const

// ========== SCREEN SHAKE ==========

export const SCREEN_SHAKE = {
  playerHit: { intensity: 8, duration: 200 },
  invaderKill: { intensity: 2, duration: 100 },
  bossHit: { intensity: 4, duration: 150 },
  bossDeath: { intensity: 20, duration: 500 },
} as const

// ========== WAVE TRANSITIONS ==========

export const TRANSITIONS = {
  waveIntroDuration: 1500, // ms
  bossIntroDuration: 2500, // ms
} as const

// ========== COLORS ==========

export const COLORS = {
  background: '#0a0a1a',

  // Player
  player: '#00FFD4',
  playerTrail: 'rgba(0, 255, 212, 0.5)',
  playerProjectile: '#00FFD4',

  // Invaders (classic color scheme)
  invaders: {
    squid: '#FF4444', // Red (top row - highest points)
    crab: '#44FF44', // Green (middle rows)
    octopus: '#4444FF', // Blue (bottom rows)
  } as Record<InvaderType, string>,

  // Enemy projectiles
  enemyProjectile: '#FFFF44',

  // Boss
  boss: '#FF00FF',
  bossProjectile: '#FF44FF',
  bossHealthBar: {
    background: '#333333',
    high: '#44FF44',
    medium: '#FFAA44',
    low: '#FF4444',
  },

  // Bunker
  bunker: '#00FF88',
  bunkerDamaged: ['#00FF88', '#00CC66', '#009944', '#006622'],

  // Special
  ufo: '#FF00FF',
  asteroid: '#8B7355',

  // Explosions
  explosion: ['#FF6B6B', '#FFB347', '#FFFFFF', '#FFD700'],

  // UI
  text: '#FFFFFF',
  textMuted: 'rgba(255, 255, 255, 0.6)',
  accent: '#00FFD4',
  warning: '#FF4444',
  gold: '#FFD700',
} as const

// ========== STARFIELD ==========

export const STARFIELD = {
  count: 80,
  minSpeed: 10,
  maxSpeed: 40,
  minSize: 1,
  maxSize: 2.5,
} as const

// ========== SCORING ==========

export const SCORING = {
  waveBonus: 500, // Per wave completed
  bossBonus: 2000, // Base bonus for defeating boss
  bonusMultiplierPerBoss: 0.5, // +50% per subsequent boss
} as const

// ========== LOCAL STORAGE KEYS ==========

export const STORAGE_KEYS = {
  highScore: 'stellar-invaders-highscore',
  settings: 'stellar-invaders-settings',
} as const

// ========== DEFAULT SETTINGS ==========

export const DEFAULT_SETTINGS = {
  soundEnabled: true,
  reducedMotion: false,
  autoFireMobile: false,
  controlScheme: 'drag' as const,
} as const
