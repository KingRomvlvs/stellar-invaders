// Game Engine
// Core orchestrator with fixed timestep game loop
// Coordinates all systems for authentic Space Invaders gameplay

import type {
  GameState,
  GameSettings,
  GameScreen,
  BunkerState,
  BunkerCell,
  Star,
  GameStateCallback,
  ScreenChangeCallback,
} from './types'
import {
  CANVAS,
  TIMING,
  BUNKER,
  STARFIELD,
  TRANSITIONS,
  BOSS,
  SCORING,
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  SCREEN_SHAKE,
} from './config'
import { GameStateMachine } from './StateMachine'
import { FormationSystem } from './systems/FormationSystem'
import { PlayerSystem } from './systems/PlayerSystem'
import { ProjectileSystem } from './systems/ProjectileSystem'
import { CollisionSystem } from './systems/CollisionSystem'
import { ParticleSystem } from './systems/ParticleSystem'
import { BossSystem } from './systems/BossSystem'
import { UFOSystem } from './systems/UFOSystem'
import { AsteroidSystem } from './systems/AsteroidSystem'
import { PowerUpSystem } from './systems/PowerUpSystem'
import { InputManager } from './input/InputManager'
import { AudioManager } from './audio/AudioManager'
import { Renderer } from './rendering/Renderer'
import { renderMenuScreen } from '../../components/game/screens/MenuScreen'
import { renderHowToScreen } from '../../components/game/screens/HowToScreen'
import { renderSettingsScreen, getSettingOptions } from '../../components/game/screens/SettingsScreen'
import { renderWaveIntroScreen } from '../../components/game/screens/WaveIntroScreen'
import { renderBossIntroScreen } from '../../components/game/screens/BossIntroScreen'
import { renderGameOverScreen, createGameStats } from '../../components/game/screens/GameOverScreen'

export class GameEngine {
  // Canvas & Context
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  // State
  private gameState: GameState
  private settings: GameSettings
  private stateMachine: GameStateMachine

  // Systems
  private formationSystem: FormationSystem
  private playerSystem: PlayerSystem
  private projectileSystem: ProjectileSystem
  private collisionSystem: CollisionSystem
  private particleSystem: ParticleSystem
  private bossSystem: BossSystem
  private ufoSystem: UFOSystem
  private asteroidSystem: AsteroidSystem
  private powerUpSystem: PowerUpSystem
  private inputManager: InputManager
  private audioManager: AudioManager
  private renderer: Renderer

  // Game Loop
  private animationId: number | null = null
  private lastTime: number = 0
  private accumulator: number = 0

  // UI State
  private settingsSelectedIndex: number = 0
  private isMobile: boolean = false
  private gameOverElapsedTime: number = 0
  private invadersDestroyed: number = 0

  // Callbacks
  private stateCallbacks: GameStateCallback[] = []
  private screenCallbacks: ScreenChangeCallback[] = []
  private lastStateNotify: number = 0
  private stateNotifyInterval: number = 100 // Throttle state updates to 100ms

  constructor(canvas: HTMLCanvasElement, initialSettings?: GameSettings) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.ctx.imageSmoothingEnabled = false

    // Load settings (use provided or load from storage)
    this.settings = initialSettings || this.loadSettings()

    // Initialize systems
    this.audioManager = new AudioManager()
    this.audioManager.setEnabled(this.settings.soundEnabled)
    this.audioManager.setReducedMotion(this.settings.reducedMotion)

    this.inputManager = new InputManager(canvas, this.settings)
    this.renderer = new Renderer(this.ctx)
    this.renderer.setReducedMotion(this.settings.reducedMotion)

    this.formationSystem = new FormationSystem()
    this.formationSystem.setAudioManager(this.audioManager)
    this.playerSystem = new PlayerSystem()
    this.playerSystem.setAudioManager(this.audioManager)
    this.projectileSystem = new ProjectileSystem()
    this.particleSystem = new ParticleSystem()
    this.bossSystem = new BossSystem(this.particleSystem, this.audioManager)
    this.ufoSystem = new UFOSystem(this.audioManager)
    this.asteroidSystem = new AsteroidSystem(this.particleSystem, this.audioManager)
    this.powerUpSystem = new PowerUpSystem()
    this.powerUpSystem.setAudioManager(this.audioManager)

    // CollisionSystem needs references to other systems
    this.collisionSystem = new CollisionSystem(
      this.formationSystem,
      this.playerSystem,
      this.particleSystem,
      this.audioManager
    )
    this.collisionSystem.setPowerUpSystem(this.powerUpSystem)

    // Initialize state machine
    this.stateMachine = new GameStateMachine('menu')
    this.stateMachine.onScreenChange((screen) => {
      this.gameState.screen = screen
      this.screenCallbacks.forEach((cb) => cb(screen))
    })

    // Initialize game state
    this.gameState = this.createInitialState()

    // Detect mobile
    if (typeof window !== 'undefined') {
      this.isMobile =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth < 768
    }
  }

  // Create initial game state
  private createInitialState(): GameState {
    return {
      screen: 'menu',
      player: this.playerSystem.createPlayer(),
      formation: null,
      playerProjectiles: [],
      enemyProjectiles: [],
      bunkers: [],
      boss: null,
      mysteryUFO: null,
      asteroids: [],
      powerUps: [],
      activePowerUps: this.powerUpSystem.createInitialActivePowerUps(),
      particles: [],
      screenShake: null,
      stars: this.createStarfield(),
      score: 0,
      highScore: this.loadHighScore(),
      wave: 0,
      isBossWave: false,
      waveTransitionTimer: 0,
      gameTime: 0,
      lastUFOSpawn: 0,
      gameStartTime: 0,
      timeSurvived: 0,
      shotsHit: 0,
      shotsFired: 0,
      isPaused: false,
      powerUpNotification: null,
    }
  }

  // Create starfield background
  private createStarfield(): Star[] {
    const stars: Star[] = []
    for (let i = 0; i < STARFIELD.count; i++) {
      stars.push({
        x: Math.random() * CANVAS.width,
        y: Math.random() * CANVAS.height,
        size: STARFIELD.minSize + Math.random() * (STARFIELD.maxSize - STARFIELD.minSize),
        brightness: 0.3 + Math.random() * 0.7,
        speed: STARFIELD.minSpeed + Math.random() * (STARFIELD.maxSpeed - STARFIELD.minSpeed),
      })
    }
    return stars
  }

  // Create bunkers
  private createBunkers(): BunkerState[] {
    const bunkers: BunkerState[] = []
    const spacing = CANVAS.width / (BUNKER.count + 1)

    for (let i = 0; i < BUNKER.count; i++) {
      const cols = Math.floor(BUNKER.width / BUNKER.cellSize)
      const rows = Math.floor(BUNKER.height / BUNKER.cellSize)
      const cells: BunkerCell[][] = []

      for (let row = 0; row < rows; row++) {
        cells[row] = []
        for (let col = 0; col < cols; col++) {
          // Create arch shape (cut out bottom middle)
          const isBottomMiddle =
            row >= rows - 3 &&
            col >= Math.floor(cols / 3) &&
            col < Math.floor((cols * 2) / 3)

          cells[row][col] = {
            health: isBottomMiddle ? 0 : BUNKER.cellHealth,
            isDestroyed: isBottomMiddle,
          }
        }
      }

      bunkers.push({
        position: { x: spacing * (i + 1), y: BUNKER.yPosition },
        cells,
        width: BUNKER.width,
        height: BUNKER.height,
        cellSize: BUNKER.cellSize,
      })
    }

    return bunkers
  }

  // Load settings from localStorage
  private loadSettings(): GameSettings {
    if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.settings)
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
      }
    } catch (e) {
      console.warn('Failed to load settings:', e)
    }
    return { ...DEFAULT_SETTINGS }
  }

  // Save settings to localStorage
  private saveSettings(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(this.settings))
    } catch (e) {
      console.warn('Failed to save settings:', e)
    }
  }

  // Load high score
  private loadHighScore(): number {
    if (typeof window === 'undefined') return 0

    try {
      return parseInt(localStorage.getItem(STORAGE_KEYS.highScore) || '0', 10)
    } catch {
      return 0
    }
  }

  // Save high score
  private saveHighScore(score: number): void {
    if (typeof window === 'undefined') return
    if (score <= this.gameState.highScore) return

    this.gameState.highScore = score
    try {
      localStorage.setItem(STORAGE_KEYS.highScore, score.toString())
    } catch (e) {
      console.warn('Failed to save high score:', e)
    }
  }

  // Start the game loop
  start(): void {
    this.lastTime = performance.now()
    this.loop(this.lastTime)
  }

  // Main game loop with fixed timestep
  private loop = (currentTime: number): void => {
    const frameTime = Math.min(currentTime - this.lastTime, TIMING.maxFrameTime)
    this.lastTime = currentTime
    this.accumulator += frameTime

    // Fixed timestep updates
    while (this.accumulator >= TIMING.fixedTimestep) {
      this.fixedUpdate(TIMING.fixedTimestep)
      this.accumulator -= TIMING.fixedTimestep
    }

    // Interpolation factor for smooth rendering
    const alpha = this.accumulator / TIMING.fixedTimestep
    this.render(alpha, currentTime)

    // Notify state listeners (throttled for performance, but immediate for power-ups)
    const hasFreshPowerUp =
      this.gameState.powerUpNotification &&
      this.gameState.powerUpNotification.timer > 1900 // Just collected (2000ms - 100ms buffer)

    if (
      hasFreshPowerUp ||
      currentTime - this.lastStateNotify >= this.stateNotifyInterval
    ) {
      this.lastStateNotify = currentTime
      this.stateCallbacks.forEach((cb) => cb(this.gameState))
    }

    this.animationId = requestAnimationFrame(this.loop)
  }

  // Fixed timestep update
  private fixedUpdate(dt: number): void {
    const screen = this.gameState.screen
    const currentTime = performance.now()

    // Update starfield (always)
    this.updateStars(dt)

    // Update screen shake (always)
    this.updateScreenShake(dt)

    // Screen-specific updates
    switch (screen) {
      case 'menu':
      case 'howTo':
      case 'settings':
        this.handleMenuInput()
        break

      case 'playing':
        this.gameState.gameTime += dt
        this.gameState.timeSurvived = currentTime - this.gameState.gameStartTime
        this.updatePlaying(dt, currentTime)
        break

      case 'waveIntro':
        this.updateWaveIntro(dt)
        break

      case 'bossIntro':
        this.updateBossIntro(dt)
        break

      case 'bossFight':
        this.gameState.gameTime += dt
        this.gameState.timeSurvived = currentTime - this.gameState.gameStartTime
        this.updateBossFight(dt, currentTime)
        break

      case 'gameOver':
        this.handleGameOverInput()
        break
    }
  }

  // Update starfield
  private updateStars(dt: number): void {
    const dtSeconds = dt / 1000
    for (const star of this.gameState.stars) {
      star.y += star.speed * dtSeconds
      if (star.y > CANVAS.height) {
        star.y = 0
        star.x = Math.random() * CANVAS.width
      }
    }
  }

  // Update screen shake
  private updateScreenShake(dt: number): void {
    if (this.gameState.screenShake) {
      this.gameState.screenShake.elapsed += dt
      if (this.gameState.screenShake.elapsed >= this.gameState.screenShake.duration) {
        this.gameState.screenShake = null
      }
    }
  }

  // Update during main playing phase
  private updatePlaying(dt: number, currentTime: number): void {
    const input = this.inputManager.getState()

    // Check for pause
    if (this.inputManager.consumePause()) {
      this.togglePause()
      return
    }

    // Don't update if paused
    if (this.gameState.isPaused) return

    // Update systems
    this.playerSystem.update(dt, this.gameState, input)
    this.formationSystem.update(dt, this.gameState)
    this.projectileSystem.update(dt, this.gameState)
    this.powerUpSystem.update(dt, this.gameState)
    this.collisionSystem.update(this.gameState)
    this.particleSystem.update(dt, this.gameState)
    this.ufoSystem.update(dt, this.gameState)
    this.asteroidSystem.update(dt, this.gameState)

    // Try to spawn UFO and asteroids
    this.ufoSystem.trySpawn(this.gameState, currentTime)
    this.asteroidSystem.trySpawn(this.gameState, currentTime)

    // Check for wave completion
    this.checkWaveCompletion()

    // Check for game over
    this.checkGameOver()

    // Reset transient input
    this.inputManager.resetActionInput()
  }

  // Update during boss fight
  private updateBossFight(dt: number, currentTime: number): void {
    const input = this.inputManager.getState()

    // Check for pause
    if (this.inputManager.consumePause()) {
      this.togglePause()
      return
    }

    // Don't update if paused
    if (this.gameState.isPaused) return

    this.playerSystem.update(dt, this.gameState, input)
    this.bossSystem.update(dt, this.gameState)
    this.projectileSystem.update(dt, this.gameState)
    this.powerUpSystem.update(dt, this.gameState)
    this.collisionSystem.update(this.gameState)
    this.particleSystem.update(dt, this.gameState)

    // Check boss death
    if (this.gameState.boss && !this.gameState.boss.isActive) {
      this.onBossDefeated()
    }

    // Check game over
    this.checkGameOver()

    this.inputManager.resetActionInput()
  }

  // Update wave intro screen
  private updateWaveIntro(dt: number): void {
    this.gameState.waveTransitionTimer += dt
    if (this.gameState.waveTransitionTimer >= TRANSITIONS.waveIntroDuration) {
      this.gameState.waveTransitionTimer = 0
      this.stateMachine.resumePlaying()
    }
  }

  // Update boss intro screen
  private updateBossIntro(dt: number): void {
    this.gameState.waveTransitionTimer += dt
    if (this.gameState.waveTransitionTimer >= TRANSITIONS.bossIntroDuration) {
      this.gameState.waveTransitionTimer = 0
      this.gameState.boss = this.bossSystem.createBoss(this.gameState.wave)
      this.stateMachine.startBossFight()
    }
  }

  // Check for wave completion
  private checkWaveCompletion(): void {
    const formation = this.gameState.formation
    if (!formation) return

    if (this.formationSystem.isFormationEmpty(formation)) {
      this.onWaveComplete()
    }
  }

  // Handle wave completion
  private onWaveComplete(): void {
    // Wave bonus
    this.gameState.score += SCORING.waveBonus * this.gameState.wave

    this.audioManager.playWaveComplete()

    // Prepare next wave
    const nextWave = this.gameState.wave + 1
    this.prepareWave(nextWave)
  }

  // Handle boss defeated
  private onBossDefeated(): void {
    // Clear boss projectiles
    this.gameState.enemyProjectiles = []

    // Wave bonus
    this.gameState.score += SCORING.waveBonus * this.gameState.wave

    // Prepare next wave
    const nextWave = this.gameState.wave + 1
    this.prepareWave(nextWave)
  }

  // Prepare a new wave
  private prepareWave(waveNumber: number): void {
    this.gameState.wave = waveNumber
    this.gameState.waveTransitionTimer = 0
    this.gameState.isBossWave = this.bossSystem.isBossWave(waveNumber)

    // Clear projectiles
    this.projectileSystem.clearAll(this.gameState)
    this.ufoSystem.clear(this.gameState)

    if (this.gameState.isBossWave) {
      // Boss wave
      this.gameState.formation = null
      this.asteroidSystem.clear(this.gameState)
      this.stateMachine.startBossIntro(waveNumber)
    } else {
      // Normal wave
      this.gameState.formation = this.formationSystem.createFormation(waveNumber)
      this.gameState.boss = null
      this.stateMachine.startWaveIntro(waveNumber)
    }
  }

  // Check for game over
  private checkGameOver(): void {
    if (this.gameState.player.lives <= 0 && !this.gameState.player.isRespawning) {
      this.triggerGameOver()
    }
  }

  // Trigger game over
  private triggerGameOver(): void {
    this.saveHighScore(this.gameState.score)
    this.audioManager.stopMusic()
    this.audioManager.playGameOver()
    this.stateMachine.gameOver(
      this.gameState.score,
      this.gameState.wave,
      this.gameState.timeSurvived
    )
  }

  // Handle menu input
  private handleMenuInput(): void {
    const input = this.inputManager.getState()
    const screen = this.gameState.screen

    // Check for action (space, click, or touch)
    if (input.shoot || input.touchShoot) {
      input.shoot = false
      input.touchShoot = false

      if (screen === 'menu') {
        this.startGame()
        this.audioManager.playMenuSelect()
      } else if (screen === 'howTo' || screen === 'settings') {
        this.navigateTo('menu')
      }
      return
    }

    // Check for escape/back
    if (this.inputManager.consumePause()) {
      if (screen === 'howTo' || screen === 'settings') {
        this.navigateTo('menu')
      }
      return
    }

    // Settings-specific navigation
    if (screen === 'settings') {
      const options = getSettingOptions()

      // Up/down navigation
      if (input.moveLeft) {
        input.moveLeft = false
        this.settingsSelectedIndex = Math.max(0, this.settingsSelectedIndex - 1)
        this.audioManager.playMenuSelect()
      }
      if (input.moveRight) {
        input.moveRight = false
        this.settingsSelectedIndex = Math.min(options.length - 1, this.settingsSelectedIndex + 1)
        this.audioManager.playMenuSelect()
      }

      // TODO: Handle left/right to change setting values
    }
  }

  // Handle game over input
  private handleGameOverInput(): void {
    const input = this.inputManager.getState()

    // Check for action to replay
    if (input.shoot || input.touchShoot) {
      input.shoot = false
      input.touchShoot = false
      this.gameOverElapsedTime = 0
      this.invadersDestroyed = 0
      this.startGame()
      this.audioManager.playMenuSelect()
      return
    }

    // Check for escape to go to menu
    if (this.inputManager.consumePause()) {
      this.gameOverElapsedTime = 0
      this.invadersDestroyed = 0
      this.stateMachine.backToMenu()
      this.audioManager.playMenuSelect()
    }
  }

  // Render
  private render(alpha: number, currentTime: number): void {
    const screen = this.gameState.screen

    // Render based on current screen
    switch (screen) {
      case 'menu':
        renderMenuScreen({
          ctx: this.ctx,
          highScore: this.gameState.highScore,
          onStart: () => this.startGame(),
          onHowTo: () => this.navigateTo('howTo'),
          onSettings: () => this.navigateTo('settings'),
        })
        break

      case 'howTo':
        renderHowToScreen({
          ctx: this.ctx,
          isMobile: this.isMobile,
        })
        break

      case 'settings':
        renderSettingsScreen({
          ctx: this.ctx,
          settings: this.settings,
          selectedIndex: this.settingsSelectedIndex,
        })
        break

      case 'waveIntro':
        // Render game in background
        this.renderer.render(this.gameState, alpha)
        // Render wave intro overlay
        const waveProgress = this.gameState.waveTransitionTimer / TRANSITIONS.waveIntroDuration
        renderWaveIntroScreen({
          ctx: this.ctx,
          wave: this.gameState.wave,
          progress: Math.min(waveProgress, 1),
        })
        break

      case 'bossIntro':
        // Render game in background
        this.renderer.render(this.gameState, alpha)
        // Render boss intro overlay
        const bossProgress = this.gameState.waveTransitionTimer / TRANSITIONS.bossIntroDuration
        renderBossIntroScreen({
          ctx: this.ctx,
          wave: this.gameState.wave,
          progress: Math.min(bossProgress, 1),
        })
        break

      case 'playing':
      case 'bossFight':
        this.renderer.render(this.gameState, alpha)
        break

      case 'gameOver':
        // Render game in background (frozen state)
        this.renderer.render(this.gameState, alpha)
        // Render game over overlay
        this.gameOverElapsedTime += TIMING.fixedTimestep
        const stats = createGameStats(
          this.gameState.score,
          this.gameState.highScore,
          this.gameState.wave,
          this.invadersDestroyed,
          this.gameState.shotsFired,
          this.gameState.shotsHit
        )
        renderGameOverScreen({
          ctx: this.ctx,
          stats,
          elapsedTime: this.gameOverElapsedTime,
        })
        break
    }
  }

  // ========== PUBLIC API ==========

  // Start a new game
  startGame(): void {
    const now = performance.now()

    // Reset state
    this.gameState = {
      ...this.createInitialState(),
      highScore: this.gameState.highScore,
      gameStartTime: now,
      lastUFOSpawn: now,
    }

    this.gameState.player = this.playerSystem.createPlayer()
    this.gameState.bunkers = this.createBunkers()

    // Start wave 1
    this.prepareWave(1)

    // Start background music
    this.audioManager.startMusic()

    this.stateMachine.forceTransition('waveIntro')
  }

  // Navigate to screen
  navigateTo(screen: GameScreen): void {
    switch (screen) {
      case 'howTo':
        this.stateMachine.showHowTo()
        break
      case 'settings':
        this.stateMachine.showSettings()
        break
      case 'menu':
        this.stateMachine.backToMenu()
        break
      case 'playing':
        this.startGame()
        break
    }
    this.audioManager.playMenuSelect()
  }

  // Update settings (full object)
  updateSettings(newSettings: GameSettings): void {
    const oldSettings = this.settings
    this.settings = { ...newSettings }
    this.saveSettings()

    // Apply changed settings
    if (oldSettings.soundEnabled !== newSettings.soundEnabled) {
      this.audioManager.setEnabled(newSettings.soundEnabled)
    }
    if (oldSettings.reducedMotion !== newSettings.reducedMotion) {
      this.audioManager.setReducedMotion(newSettings.reducedMotion)
      this.renderer.setReducedMotion(newSettings.reducedMotion)
    }
    if (
      oldSettings.controlScheme !== newSettings.controlScheme ||
      oldSettings.autoFireMobile !== newSettings.autoFireMobile
    ) {
      this.inputManager.updateSettings(this.settings)
    }
  }

  // Update single setting
  updateSetting<K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K]
  ): void {
    this.settings[key] = value
    this.saveSettings()

    // Apply settings
    if (key === 'soundEnabled') {
      this.audioManager.setEnabled(value as boolean)
    }
    if (key === 'reducedMotion') {
      this.audioManager.setReducedMotion(value as boolean)
      this.renderer.setReducedMotion(value as boolean)
    }
    if (key === 'controlScheme' || key === 'autoFireMobile') {
      this.inputManager.updateSettings(this.settings)
    }
  }

  // Set joystick delta from external control
  setJoystickDelta(delta: { x: number; y: number } | null): void {
    const input = this.inputManager.getState()
    input.joystickDelta = delta
  }

  // Trigger shoot from external control
  triggerShoot(): void {
    const input = this.inputManager.getState()
    input.shoot = true
  }

  // Set shoot state from external control (for hold-to-shoot)
  setShoot(active: boolean): void {
    const input = this.inputManager.getState()
    input.touchShoot = active
  }

  // Set move left from external control
  setMoveLeft(active: boolean): void {
    const input = this.inputManager.getState()
    input.moveLeft = active
  }

  // Set move right from external control
  setMoveRight(active: boolean): void {
    const input = this.inputManager.getState()
    input.moveRight = active
  }

  // Toggle pause state
  togglePause(): void {
    const screen = this.gameState.screen
    // Only allow pause during gameplay
    if (screen === 'playing' || screen === 'bossFight') {
      this.gameState.isPaused = !this.gameState.isPaused
      if (this.gameState.isPaused) {
        this.audioManager.pauseMusic()
      } else {
        this.audioManager.resumeMusic()
      }
    }
  }

  // Check if game is paused
  isPaused(): boolean {
    return this.gameState.isPaused
  }

  // Get current settings
  getSettings(): GameSettings {
    return { ...this.settings }
  }

  // Get current game state
  getState(): GameState {
    return this.gameState
  }

  // Get current screen
  getScreen(): GameScreen {
    return this.stateMachine.getScreen()
  }

  // Subscribe to state changes
  onStateChange(callback: GameStateCallback): () => void {
    this.stateCallbacks.push(callback)
    return () => {
      this.stateCallbacks = this.stateCallbacks.filter((cb) => cb !== callback)
    }
  }

  // Subscribe to screen changes
  onScreenChange(callback: ScreenChangeCallback): () => void {
    this.screenCallbacks.push(callback)
    return () => {
      this.screenCallbacks = this.screenCallbacks.filter((cb) => cb !== callback)
    }
  }

  // Trigger screen shake
  triggerScreenShake(
    type: 'playerHit' | 'invaderKill' | 'bossHit' | 'bossDeath'
  ): void {
    const config = SCREEN_SHAKE[type]
    this.gameState.screenShake = {
      intensity: config.intensity,
      duration: config.duration,
      elapsed: 0,
    }
  }

  // Cleanup
  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }

    this.inputManager.destroy()
    this.audioManager.destroy()
    this.ufoSystem.destroy()
  }
}
