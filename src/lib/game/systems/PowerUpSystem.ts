// Power-Up System
// Handles power-up spawning, collection, and effects

import type { PowerUp, PowerUpType, GameState, Vector2D, ActivePowerUps, InvaderType } from '../types'
import { POWERUP, CANVAS } from '../config'
import type { AudioManager } from '../audio/AudioManager'

// Invader types drop matching power-ups (90% their type, 10% extra life)
const INVADER_POWER_UP_MAP: Record<InvaderType, PowerUpType> = {
  squid: 'rapidFire', // Red invaders shoot rapidly → drop rapid fire
  crab: 'multiShot', // Green invaders shoot triple → drop multi-shot
  octopus: 'shield', // Blue invaders are tanky → drop shield
}

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
  // Each invader type drops its matching power-up (90%) or heart (10%)
  trySpawnPowerUp(state: GameState, position: Vector2D, invaderType?: InvaderType): void {
    // Random chance to drop (30%)
    if (Math.random() > POWERUP.dropChance) return

    let selectedType: PowerUpType

    if (invaderType) {
      // 90% chance for type-specific power-up, 10% chance for heart
      if (Math.random() < 0.9) {
        selectedType = INVADER_POWER_UP_MAP[invaderType]
      } else {
        selectedType = 'extraLife'
      }
    } else {
      // No invader type specified - random power-up
      const types: PowerUpType[] = ['rapidFire', 'shield', 'multiShot', 'extraLife']
      selectedType = types[Math.floor(Math.random() * types.length)]
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

    // Update notification timer
    if (state.powerUpNotification) {
      state.powerUpNotification.timer -= dt
      if (state.powerUpNotification.timer <= 0) {
        state.powerUpNotification = null
      }
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

    // Show notification
    state.powerUpNotification = {
      type: powerUp.type,
      timer: 2000, // Show for 2 seconds
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
