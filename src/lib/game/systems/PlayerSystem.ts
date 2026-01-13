// Player System
// Handles player movement, shooting, and state management

import type { PlayerState, GameState, InputState, Projectile } from '../types'
import { PLAYER, CANVAS, PROJECTILE, POWERUP } from '../config'
import type { AudioManager } from '../audio/AudioManager'

export class PlayerSystem {
  private audioManager: AudioManager | null = null

  // Set audio manager reference (called after construction)
  setAudioManager(audioManager: AudioManager): void {
    this.audioManager = audioManager
  }

  // Create initial player state
  createPlayer(): PlayerState {
    return {
      position: { x: CANVAS.width / 2, y: PLAYER.startY },
      width: PLAYER.width,
      height: PLAYER.height,
      isActive: true,
      lives: PLAYER.startLives,
      canShoot: true,
      shootCooldownRemaining: 0,
      isRespawning: false,
      respawnTimer: 0,
      isInvincible: false,
      invincibilityTimer: 0,
    }
  }

  // Main update
  update(dt: number, state: GameState, input: InputState): void {
    const player = state.player

    // Handle respawning FIRST (even when player is inactive)
    if (player.isRespawning) {
      player.respawnTimer -= dt
      if (player.respawnTimer <= 0) {
        player.isRespawning = false
        player.isActive = true
        player.isInvincible = true
        player.invincibilityTimer = PLAYER.invincibilityTime
        player.position.x = CANVAS.width / 2
      }
      return // Don't process other updates while respawning
    }

    // Skip updates if player is not active (and not respawning)
    if (!player.isActive) return

    // Handle invincibility
    if (player.isInvincible) {
      player.invincibilityTimer -= dt
      if (player.invincibilityTimer <= 0) {
        player.isInvincible = false
      }
    }

    // Handle movement
    this.handleMovement(player, input, dt)

    // Handle shooting cooldown
    if (!player.canShoot) {
      player.shootCooldownRemaining -= dt
      if (player.shootCooldownRemaining <= 0) {
        player.canShoot = true
        player.shootCooldownRemaining = 0
      }
    }

    // Handle shooting
    this.handleShooting(player, input, state)
  }

  // Handle player movement from input
  private handleMovement(
    player: PlayerState,
    input: InputState,
    dt: number
  ): void {
    let moveDirection = 0

    // Touch input takes priority
    if (input.touchMoveX !== null) {
      // Relative touch movement
      player.position.x += input.touchMoveX * 0.5
    } else if (input.joystickDelta !== null) {
      // Joystick input
      const deadzone = 10
      if (Math.abs(input.joystickDelta.x) > deadzone) {
        moveDirection = Math.sign(input.joystickDelta.x)
      }
    } else if (input.mouseActive && input.mouseX !== null) {
      // Mouse follow
      const diff = input.mouseX - player.position.x
      if (Math.abs(diff) > 5) {
        moveDirection = Math.sign(diff)
      }
    } else {
      // Keyboard input
      if (input.moveLeft) moveDirection = -1
      if (input.moveRight) moveDirection = 1
    }

    // Apply movement
    if (moveDirection !== 0) {
      player.position.x += moveDirection * PLAYER.speed * (dt / 1000)
    }

    // Clamp to screen bounds
    const halfWidth = player.width / 2
    player.position.x = Math.max(
      halfWidth,
      Math.min(CANVAS.width - halfWidth, player.position.x)
    )
  }

  // Handle shooting
  private handleShooting(
    player: PlayerState,
    input: InputState,
    state: GameState
  ): void {
    const wantsToShoot = input.shoot || input.touchShoot

    if (wantsToShoot && player.canShoot) {
      // Check if player already has an active projectile (classic style)
      // Multi-shot bypasses this restriction
      const isMultiShotActive = state.activePowerUps.multiShot > 0
      const hasActiveProjectile = state.playerProjectiles.some(
        (p) => p.isActive && p.isPlayerProjectile
      )

      if (!hasActiveProjectile || isMultiShotActive) {
        this.shoot(player, state)
      }
    }
  }

  // Fire a projectile
  private shoot(player: PlayerState, state: GameState): void {
    const isMultiShotActive = state.activePowerUps.multiShot > 0
    const isRapidFireActive = state.activePowerUps.rapidFire > 0

    // Rapid fire increases projectile speed by 50%
    const projectileSpeed = isRapidFireActive
      ? PROJECTILE.player.speed * 1.5
      : PROJECTILE.player.speed

    // Create main projectile
    const mainProjectile: Projectile = {
      position: {
        x: player.position.x,
        y: player.position.y - player.height / 2 - 5,
      },
      velocity: { x: 0, y: -projectileSpeed },
      width: PROJECTILE.player.width,
      height: PROJECTILE.player.height,
      isActive: true,
      isPlayerProjectile: true,
      damage: 1,
      type: 'normal',
    }

    state.playerProjectiles.push(mainProjectile)
    state.shotsFired++

    // Multi-shot: Add angled projectiles
    if (isMultiShotActive) {
      const spreadAngle = 15 * (Math.PI / 180) // 15 degrees
      const speed = projectileSpeed // Use the same speed (affected by rapid fire)

      // Left projectile
      const leftProjectile: Projectile = {
        position: {
          x: player.position.x - 8,
          y: player.position.y - player.height / 2 - 5,
        },
        velocity: {
          x: -Math.sin(spreadAngle) * speed,
          y: -Math.cos(spreadAngle) * speed,
        },
        width: PROJECTILE.player.width,
        height: PROJECTILE.player.height,
        isActive: true,
        isPlayerProjectile: true,
        damage: 1,
        type: 'normal',
      }

      // Right projectile
      const rightProjectile: Projectile = {
        position: {
          x: player.position.x + 8,
          y: player.position.y - player.height / 2 - 5,
        },
        velocity: {
          x: Math.sin(spreadAngle) * speed,
          y: -Math.cos(spreadAngle) * speed,
        },
        width: PROJECTILE.player.width,
        height: PROJECTILE.player.height,
        isActive: true,
        isPlayerProjectile: true,
        damage: 1,
        type: 'normal',
      }

      state.playerProjectiles.push(leftProjectile, rightProjectile)
      state.shotsFired += 2
    }

    // Play shooting sound
    this.audioManager?.playShoot()

    // Apply cooldown (reduced if rapid fire is active)
    player.canShoot = false
    player.shootCooldownRemaining = isRapidFireActive
      ? POWERUP.rapidFireCooldown
      : PLAYER.shootCooldown
  }

  // Handle player being hit
  hit(player: PlayerState, state: GameState): boolean {
    if (player.isInvincible || player.isRespawning) {
      return false
    }

    player.lives--
    state.player.isActive = false

    if (player.lives > 0) {
      // Start respawn
      player.isRespawning = true
      player.respawnTimer = PLAYER.respawnTime
      return false // Not game over
    }

    return true // Game over
  }

  // Reset player for new game
  reset(player: PlayerState): void {
    player.position = { x: CANVAS.width / 2, y: PLAYER.startY }
    player.lives = PLAYER.startLives
    player.isActive = true
    player.canShoot = true
    player.shootCooldownRemaining = 0
    player.isRespawning = false
    player.respawnTimer = 0
    player.isInvincible = false
    player.invincibilityTimer = 0
  }

  // Add extra life
  addLife(player: PlayerState, maxLives: number = 5): void {
    player.lives = Math.min(player.lives + 1, maxLives)
  }
}
