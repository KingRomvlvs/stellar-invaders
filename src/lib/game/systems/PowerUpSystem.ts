// Power-Up System
// Handles power-up spawning, collection, and effects

import type { PowerUp, PowerUpType, GameState, Vector2D, ActivePowerUps } from '../types'
import { POWERUP, CANVAS } from '../config'
import type { AudioManager } from '../audio/AudioManager'

export class PowerUpSystem {
  private audioManager: AudioManager | null = null

  setAudioManager(audioManager: AudioManager): void {
    this.audioManager = audioManager
  }

  // Create initial active power-ups state
  createInitialActivePowerUps(): ActivePowerUps {
    return {
      rapidFire: 0,
      shield: 0,
      multiShot: 0,
    }
  }

  // Try to spawn a power-up at the given position (called when enemy dies)
  trySpawnPowerUp(state: GameState, position: Vector2D): void {
    // Random chance to drop
    if (Math.random() > POWERUP.dropChance) return

    // Pick random power-up type
    const types: PowerUpType[] = ['extraLife', 'rapidFire', 'shield', 'multiShot']
    // Extra life is rarer
    const weights = [0.1, 0.3, 0.3, 0.3]
    const rand = Math.random()
    let cumulative = 0
    let selectedType: PowerUpType = 'rapidFire'

    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i]
      if (rand < cumulative) {
        selectedType = types[i]
        break
      }
    }

    const powerUp: PowerUp = {
      position: { x: position.x, y: position.y },
      velocity: { x: 0, y: POWERUP.fallSpeed },
      type: selectedType,
      width: POWERUP.width,
      height: POWERUP.height,
      isActive: true,
      lifetime: POWERUP.lifetime,
    }

    state.powerUps.push(powerUp)
  }

  // Update all power-ups
  update(dt: number, state: GameState): void {
    const dtSeconds = dt / 1000

    // Update falling power-ups
    for (const powerUp of state.powerUps) {
      if (!powerUp.isActive) continue

      // Move down
      powerUp.position.y += powerUp.velocity.y * dtSeconds

      // Decrease lifetime
      powerUp.lifetime -= dt

      // Remove if off screen or expired
      if (powerUp.position.y > CANVAS.height + 50 || powerUp.lifetime <= 0) {
        powerUp.isActive = false
      }
    }

    // Update active power-up timers
    if (state.activePowerUps.rapidFire > 0) {
      state.activePowerUps.rapidFire = Math.max(0, state.activePowerUps.rapidFire - dt)
    }
    if (state.activePowerUps.shield > 0) {
      state.activePowerUps.shield = Math.max(0, state.activePowerUps.shield - dt)
    }
    if (state.activePowerUps.multiShot > 0) {
      state.activePowerUps.multiShot = Math.max(0, state.activePowerUps.multiShot - dt)
    }

    // Clean up inactive power-ups
    state.powerUps = state.powerUps.filter((p) => p.isActive)
  }

  // Collect a power-up (called by collision system)
  collectPowerUp(powerUp: PowerUp, state: GameState): void {
    powerUp.isActive = false

    // Apply power-up effect
    switch (powerUp.type) {
      case 'extraLife':
        state.player.lives++
        break
      case 'rapidFire':
        state.activePowerUps.rapidFire = POWERUP.effectDuration.rapidFire
        break
      case 'shield':
        state.activePowerUps.shield = POWERUP.effectDuration.shield
        // Also grant temporary invincibility
        state.player.isInvincible = true
        state.player.invincibilityTimer = POWERUP.effectDuration.shield
        break
      case 'multiShot':
        state.activePowerUps.multiShot = POWERUP.effectDuration.multiShot
        break
    }

    // Play collection sound
    this.audioManager?.playPowerUp()
  }

  // Check if rapid fire is active
  isRapidFireActive(state: GameState): boolean {
    return state.activePowerUps.rapidFire > 0
  }

  // Check if multi-shot is active
  isMultiShotActive(state: GameState): boolean {
    return state.activePowerUps.multiShot > 0
  }

  // Check if shield is active
  isShieldActive(state: GameState): boolean {
    return state.activePowerUps.shield > 0
  }

  // Clear all power-ups
  clear(state: GameState): void {
    state.powerUps = []
  }
}
