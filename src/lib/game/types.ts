// Space Invaders Game Types and Interfaces
// Authentic Space Invaders mechanics with formation-based movement

// ========== CORE TYPES ==========

export interface Vector2D {
  x: number
  y: number
}

export interface Bounds {
  left: number
  right: number
  top: number
  bottom: number
}

// ========== GAME STATE MACHINE ==========

export type GameScreen =
  | 'menu'
  | 'howTo'
  | 'settings'
  | 'playing'
  | 'waveIntro'
  | 'bossIntro'
  | 'bossFight'
  | 'gameOver'

// ========== INVADER FORMATION (KEY DIFFERENTIATOR) ==========

// Classic Space Invaders 3 types
export type InvaderType = 'squid' | 'crab' | 'octopus'

export interface Invader {
  type: InvaderType
  health: number
  points: number
  isActive: boolean
}

export interface InvaderSlot {
  row: number
  col: number
  invader: Invader | null // null = destroyed
}

export interface FormationState {
  grid: InvaderSlot[][] // 2D grid of invader slots
  bounds: Bounds // Current bounding box of active invaders
  position: Vector2D // Formation anchor position (top-left)
  direction: 1 | -1 // 1 = right, -1 = left
  pendingDrop: boolean // Should drop on next step?
  stepTimer: number // Accumulator for step timing
  baseStepInterval: number // Base time between steps (ms)
  currentStepInterval: number // Current interval (speeds up as invaders die)
  totalInvaders: number // Starting count for speed calculation
  activeInvaders: number // Current living count
  animationFrame: 0 | 1 // For sprite animation toggle
}

// ========== PLAYER ==========

export interface PlayerState {
  position: Vector2D
  width: number
  height: number
  isActive: boolean
  lives: number

  // Shooting - classic style: one active projectile at a time
  canShoot: boolean
  shootCooldownRemaining: number

  // Respawn
  isRespawning: boolean
  respawnTimer: number
  isInvincible: boolean
  invincibilityTimer: number
}

// ========== PROJECTILES ==========

export interface Projectile {
  position: Vector2D
  velocity: Vector2D
  width: number
  height: number
  isActive: boolean
  isPlayerProjectile: boolean
  damage: number
  type: 'normal' | 'powered' // Powered from boss
}

// ========== BUNKERS/SHIELDS ==========

export interface BunkerCell {
  health: number // 0-4: progressively damaged
  isDestroyed: boolean
}

export interface BunkerState {
  position: Vector2D
  cells: BunkerCell[][]
  width: number
  height: number
  cellSize: number
}

// ========== BOSS ==========

export type BossPattern = 'sweep' | 'spiral' | 'spread'
export type BossPhase = 1 | 2 | 3

export interface BossState {
  position: Vector2D
  velocity: Vector2D
  width: number
  height: number
  isActive: boolean

  health: number
  maxHealth: number
  phase: BossPhase

  // Attack patterns
  currentPattern: BossPattern
  patternTimer: number
  attackCooldown: number

  // Telegraphing
  isTelegraphing: boolean
  telegraphTimer: number
  nextAttack: BossPattern

  // Limited adds
  addsCooldown: number
  addsRemaining: number
}

// ========== ASTEROIDS ==========

export type AsteroidSize = 'small' | 'medium' | 'large'
export type AsteroidBehavior = 'split' | 'explode'

export interface Asteroid {
  position: Vector2D
  velocity: Vector2D
  rotation: number
  rotationSpeed: number
  size: AsteroidSize
  width: number
  height: number
  health: number
  behavior: AsteroidBehavior
  isActive: boolean
}

// ========== MYSTERY UFO ==========

export interface MysteryUFO {
  position: Vector2D
  velocity: Vector2D
  direction: 1 | -1
  width: number
  height: number
  points: number
  isActive: boolean
}

// ========== POWER-UPS ==========

export type PowerUpType = 'extraLife' | 'rapidFire' | 'shield' | 'multiShot'

export interface PowerUp {
  position: Vector2D
  velocity: Vector2D
  type: PowerUpType
  width: number
  height: number
  isActive: boolean
  lifetime: number // How long before it disappears
}

// Power-up effect tracking on player
export interface ActivePowerUps {
  rapidFire: number // Time remaining (ms), 0 = not active
  shield: number // Time remaining (ms), 0 = not active
  multiShot: number // Time remaining (ms), 0 = not active
}

// ========== PARTICLES & EFFECTS ==========

export interface Particle {
  position: Vector2D
  velocity: Vector2D
  color: string
  size: number
  lifetime: number
  maxLifetime: number
  rotation?: number
  rotationSpeed?: number
}

export interface ScreenShake {
  intensity: number
  duration: number
  elapsed: number
}

// ========== STARFIELD ==========

export interface Star {
  x: number
  y: number
  size: number
  brightness: number
  speed: number
}

// ========== GAME STATE ==========

export interface GameState {
  screen: GameScreen

  // Core gameplay
  player: PlayerState
  formation: FormationState | null
  playerProjectiles: Projectile[]
  enemyProjectiles: Projectile[]
  bunkers: BunkerState[]

  // Special entities
  boss: BossState | null
  mysteryUFO: MysteryUFO | null
  asteroids: Asteroid[]
  powerUps: PowerUp[]
  activePowerUps: ActivePowerUps

  // Visual effects
  particles: Particle[]
  screenShake: ScreenShake | null
  stars: Star[]

  // Scoring & Progress
  score: number
  highScore: number
  wave: number

  // Wave tracking
  isBossWave: boolean
  waveTransitionTimer: number

  // Timing
  gameTime: number
  lastUFOSpawn: number
  gameStartTime: number
  timeSurvived: number

  // Stats
  shotsHit: number
  shotsFired: number

  // UI State
  isPaused: boolean
}

// ========== SETTINGS ==========

export interface GameSettings {
  soundEnabled: boolean
  reducedMotion: boolean
  autoFireMobile: boolean
  controlScheme: 'drag' | 'joystick'
}

// ========== INPUT ==========

export interface InputState {
  // Desktop
  moveLeft: boolean
  moveRight: boolean
  shoot: boolean
  pause: boolean

  // Mouse
  mouseX: number | null
  mouseActive: boolean

  // Touch
  touchMoveX: number | null
  touchShoot: boolean
  joystickDelta: Vector2D | null
}

// ========== CALLBACKS ==========

export type GameStateCallback = (state: GameState) => void
export type ScreenChangeCallback = (screen: GameScreen) => void
