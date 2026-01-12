// Game State Machine
// Manages screen transitions with validation

import type { GameScreen, ScreenChangeCallback } from './types'

// Valid transitions map - defines which screens can transition to which
const VALID_TRANSITIONS: Record<GameScreen, GameScreen[]> = {
  menu: ['playing', 'howTo', 'settings'],
  howTo: ['menu'],
  settings: ['menu'],
  playing: ['waveIntro', 'bossIntro', 'gameOver', 'menu'],
  waveIntro: ['playing'],
  bossIntro: ['bossFight'],
  bossFight: ['waveIntro', 'gameOver'],
  gameOver: ['menu', 'playing'],
}

export class GameStateMachine {
  private currentScreen: GameScreen = 'menu'
  private listeners: ScreenChangeCallback[] = []
  private transitionData: Record<string, unknown> = {}

  constructor(initialScreen: GameScreen = 'menu') {
    this.currentScreen = initialScreen
  }

  // Get current screen
  getScreen(): GameScreen {
    return this.currentScreen
  }

  // Check if transition is valid
  canTransition(to: GameScreen): boolean {
    return VALID_TRANSITIONS[this.currentScreen]?.includes(to) ?? false
  }

  // Transition to new screen
  transition(to: GameScreen, data?: Record<string, unknown>): boolean {
    if (!this.canTransition(to)) {
      console.warn(
        `Invalid transition: ${this.currentScreen} -> ${to}. ` +
          `Valid targets: ${VALID_TRANSITIONS[this.currentScreen]?.join(', ')}`
      )
      return false
    }

    const from = this.currentScreen
    this.currentScreen = to
    this.transitionData = data ?? {}

    // Notify listeners
    this.listeners.forEach((callback) => callback(to))

    console.log(`Screen transition: ${from} -> ${to}`)
    return true
  }

  // Force transition (bypass validation for special cases like restart)
  forceTransition(to: GameScreen, data?: Record<string, unknown>): void {
    const from = this.currentScreen
    this.currentScreen = to
    this.transitionData = data ?? {}

    this.listeners.forEach((callback) => callback(to))
    console.log(`Screen force transition: ${from} -> ${to}`)
  }

  // Get transition data
  getTransitionData<T = Record<string, unknown>>(): T {
    return this.transitionData as T
  }

  // Subscribe to screen changes
  onScreenChange(callback: ScreenChangeCallback): () => void {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback)
    }
  }

  // Helper methods for common transitions
  startGame(): boolean {
    return this.transition('playing')
  }

  showHowTo(): boolean {
    return this.transition('howTo')
  }

  showSettings(): boolean {
    return this.transition('settings')
  }

  backToMenu(): boolean {
    return this.transition('menu')
  }

  startWaveIntro(wave: number): boolean {
    return this.transition('waveIntro', { wave })
  }

  startBossIntro(wave: number): boolean {
    return this.transition('bossIntro', { wave })
  }

  startBossFight(): boolean {
    return this.transition('bossFight')
  }

  resumePlaying(): boolean {
    return this.transition('playing')
  }

  gameOver(finalScore: number, wave: number, timeSurvived: number): boolean {
    return this.transition('gameOver', {
      finalScore,
      wave,
      timeSurvived,
    })
  }

  // Check if currently in a gameplay screen
  isPlaying(): boolean {
    return (
      this.currentScreen === 'playing' ||
      this.currentScreen === 'bossFight' ||
      this.currentScreen === 'waveIntro' ||
      this.currentScreen === 'bossIntro'
    )
  }

  // Check if in a menu screen
  isInMenu(): boolean {
    return (
      this.currentScreen === 'menu' ||
      this.currentScreen === 'howTo' ||
      this.currentScreen === 'settings'
    )
  }

  // Reset to initial state
  reset(): void {
    this.forceTransition('menu')
    this.transitionData = {}
  }
}
