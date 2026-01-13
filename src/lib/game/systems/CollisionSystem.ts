// Collision System
// Handles all collision detection between game entities

import type {
  GameState,
  Projectile,
  BunkerState,
  BunkerCell,
  Vector2D,
} from '../types'
import { FORMATION, PLAYER, BUNKER, CANVAS, COLORS } from '../config'
import type { FormationSystem } from './FormationSystem'
import type { PlayerSystem } from './PlayerSystem'
import type { ParticleSystem } from './ParticleSystem'
import type { PowerUpSystem } from './PowerUpSystem'
import type { AudioManager } from '../audio/AudioManager'

export class CollisionSystem {
  private powerUpSystem: PowerUpSystem | null = null

  constructor(
    private formationSystem: FormationSystem,
    private playerSystem: PlayerSystem,
    private particleSystem: ParticleSystem,
    private audioManager: AudioManager
  ) {}

  // Set power-up system reference
  setPowerUpSystem(powerUpSystem: PowerUpSystem): void {
    this.powerUpSystem = powerUpSystem
  }

  // Main collision update
  update(state: GameState): void {
    this.checkPlayerProjectileVsFormation(state)
    this.checkPlayerProjectileVsBunkers(state)
    this.checkPlayerProjectileVsBoss(state)
    this.checkPlayerProjectileVsAsteroids(state)
    this.checkPlayerProjectileVsUFO(state)

    this.checkEnemyProjectileVsPlayer(state)
    this.checkEnemyProjectileVsBunkers(state)

    this.checkFormationVsPlayer(state)
    this.checkFormationVsBunkers(state)
    this.checkAsteroidsVsPlayer(state)
    this.checkBossVsPlayer(state)
    this.checkPowerUpsVsPlayer(state)
  }

  // Player projectiles hitting invader formation
  private checkPlayerProjectileVsFormation(state: GameState): void {
    const formation = state.formation
    if (!formation) return

    for (const projectile of state.playerProjectiles) {
      if (!projectile.isActive) continue

      const hit = this.formationSystem.findInvaderAtWorldPosition(
        formation,
        projectile.position.x,
        projectile.position.y,
        projectile.width,
        projectile.height
      )

      if (hit) {
        projectile.isActive = false
        const points = this.formationSystem.destroyInvader(
          formation,
          hit.row,
          hit.col
        )

        if (points > 0) {
          state.score += points
          state.shotsHit++

          // Create explosion
          const invaderPos = this.formationSystem.getInvaderWorldPosition(
            formation,
            hit.row,
            hit.col
          )
          const invaderType = formation.grid[hit.row][hit.col]?.invader?.type ?? 'octopus'
          this.particleSystem.createInvaderDeath(
            state,
            invaderPos,
            COLORS.invaders[invaderType]
          )
          this.audioManager.playExplosion()

          // Try to spawn power-up (type-specific based on invader)
          this.powerUpSystem?.trySpawnPowerUp(state, invaderPos, invaderType)
        }

        // Only one hit per frame
        break
      }
    }
  }

  // Player projectiles hitting bunkers
  private checkPlayerProjectileVsBunkers(state: GameState): void {
    for (const projectile of state.playerProjectiles) {
      if (!projectile.isActive) continue

      for (const bunker of state.bunkers) {
        const hit = this.hitBunker(
          bunker,
          projectile.position,
          projectile.velocity.y < 0 // From below (player)
        )

        if (hit) {
          projectile.isActive = false
          this.particleSystem.createBunkerHit(state, projectile.position)
          break
        }
      }
    }
  }

  // Enemy projectiles hitting bunkers
  private checkEnemyProjectileVsBunkers(state: GameState): void {
    for (const projectile of state.enemyProjectiles) {
      if (!projectile.isActive) continue

      for (const bunker of state.bunkers) {
        const hit = this.hitBunker(
          bunker,
          projectile.position,
          projectile.velocity.y > 0 // From above (enemy)
        )

        if (hit) {
          projectile.isActive = false
          this.particleSystem.createBunkerHit(state, projectile.position)
          break
        }
      }
    }
  }

  // Hit bunker and damage cells
  private hitBunker(
    bunker: BunkerState,
    position: Vector2D,
    fromAbove: boolean
  ): boolean {
    const bunkerLeft = bunker.position.x - bunker.width / 2
    const bunkerTop = bunker.position.y - bunker.height / 2

    // Check if position is within bunker bounds
    if (
      position.x < bunkerLeft ||
      position.x > bunkerLeft + bunker.width ||
      position.y < bunkerTop ||
      position.y > bunkerTop + bunker.height
    ) {
      return false
    }

    // Find which cell was hit
    const localX = position.x - bunkerLeft
    const localY = position.y - bunkerTop
    const col = Math.floor(localX / bunker.cellSize)
    const row = Math.floor(localY / bunker.cellSize)

    if (
      row >= 0 &&
      row < bunker.cells.length &&
      col >= 0 &&
      col < bunker.cells[0].length
    ) {
      const cell = bunker.cells[row][col]
      if (!cell.isDestroyed) {
        cell.health--
        if (cell.health <= 0) {
          cell.isDestroyed = true
        }
        return true
      }
    }

    // If top cell is destroyed, check cells in direction of travel
    const startRow = fromAbove ? 0 : bunker.cells.length - 1
    const endRow = fromAbove ? bunker.cells.length : -1
    const step = fromAbove ? 1 : -1

    for (let r = startRow; r !== endRow; r += step) {
      if (col >= 0 && col < bunker.cells[0].length) {
        const cell = bunker.cells[r][col]
        if (!cell.isDestroyed) {
          cell.health--
          if (cell.health <= 0) {
            cell.isDestroyed = true
          }
          return true
        }
      }
    }

    return false
  }

  // Player projectiles hitting boss
  private checkPlayerProjectileVsBoss(state: GameState): void {
    const boss = state.boss
    if (!boss || !boss.isActive) return

    for (const projectile of state.playerProjectiles) {
      if (!projectile.isActive) continue

      if (this.checkAABB(projectile, boss)) {
        projectile.isActive = false
        boss.health -= projectile.damage
        state.shotsHit++

        this.particleSystem.createHitSpark(
          state,
          projectile.position,
          COLORS.boss
        )
        this.audioManager.playHit()

        // Boss death handled elsewhere
      }
    }
  }

  // Player projectiles hitting asteroids
  private checkPlayerProjectileVsAsteroids(state: GameState): void {
    for (const projectile of state.playerProjectiles) {
      if (!projectile.isActive) continue

      for (const asteroid of state.asteroids) {
        if (!asteroid.isActive) continue

        if (this.checkAABB(projectile, asteroid)) {
          projectile.isActive = false
          asteroid.health -= projectile.damage
          state.shotsHit++

          this.particleSystem.createHitSpark(
            state,
            projectile.position,
            COLORS.asteroid
          )

          // Asteroid destruction handled by AsteroidSystem
        }
      }
    }
  }

  // Player projectiles hitting UFO
  private checkPlayerProjectileVsUFO(state: GameState): void {
    const ufo = state.mysteryUFO
    if (!ufo || !ufo.isActive) return

    for (const projectile of state.playerProjectiles) {
      if (!projectile.isActive) continue

      if (this.checkAABB(projectile, ufo)) {
        projectile.isActive = false
        state.score += ufo.points
        state.shotsHit++
        ufo.isActive = false

        this.particleSystem.createExplosion(state, ufo.position, COLORS.ufo)
        this.audioManager.playUFOHit()
      }
    }
  }

  // Enemy projectiles hitting player
  private checkEnemyProjectileVsPlayer(state: GameState): void {
    const player = state.player
    if (!player.isActive || player.isInvincible || player.isRespawning) return

    for (const projectile of state.enemyProjectiles) {
      if (!projectile.isActive) continue

      if (this.checkAABB(projectile, player)) {
        projectile.isActive = false
        this.handlePlayerHit(state)
        break
      }
    }
  }

  // Formation reaching player or bunkers
  private checkFormationVsPlayer(state: GameState): void {
    const formation = state.formation
    const player = state.player
    if (!formation || !player.isActive) return

    const invaders = this.formationSystem.getActiveInvadersWithPositions(formation)

    for (const { worldPos } of invaders) {
      // Check if invader reached player Y level
      // worldPos.y is already the CENTER of the invader (includes FORMATION.invaderHeight / 2)
      // So we just need to check if the bottom of the invader reaches player area
      const invaderBottom = worldPos.y + FORMATION.invaderHeight / 2
      const playerTop = player.position.y - player.height / 2 - 20 // Give some margin above player

      if (invaderBottom >= playerTop) {
        // Instant game over when invaders reach bottom
        if (!player.isInvincible && !player.isRespawning) {
          this.handlePlayerHit(state)
          break
        }
      }
    }
  }

  // Formation destroying bunkers when passing through
  private checkFormationVsBunkers(state: GameState): void {
    const formation = state.formation
    if (!formation) return

    const invaders = this.formationSystem.getActiveInvadersWithPositions(formation)

    for (const bunker of state.bunkers) {
      for (const { worldPos } of invaders) {
        const invaderBottom = worldPos.y + FORMATION.invaderHeight / 2
        const invaderLeft = worldPos.x - FORMATION.invaderWidth / 2
        const invaderRight = worldPos.x + FORMATION.invaderWidth / 2

        const bunkerTop = bunker.position.y - bunker.height / 2
        const bunkerBottom = bunker.position.y + bunker.height / 2
        const bunkerLeft = bunker.position.x - bunker.width / 2
        const bunkerRight = bunker.position.x + bunker.width / 2

        // Check overlap
        if (
          invaderBottom >= bunkerTop &&
          worldPos.y - FORMATION.invaderHeight / 2 <= bunkerBottom &&
          invaderRight >= bunkerLeft &&
          invaderLeft <= bunkerRight
        ) {
          // Destroy overlapping bunker cells
          this.destroyBunkerArea(
            bunker,
            invaderLeft,
            invaderRight,
            bunkerTop,
            Math.max(worldPos.y - FORMATION.invaderHeight / 2, bunkerTop),
            Math.min(invaderBottom, bunkerBottom)
          )
        }
      }
    }
  }

  // Destroy bunker cells in an area
  private destroyBunkerArea(
    bunker: BunkerState,
    left: number,
    right: number,
    bunkerTop: number,
    top: number,
    bottom: number
  ): void {
    const bunkerLeft = bunker.position.x - bunker.width / 2

    const startCol = Math.max(
      0,
      Math.floor((left - bunkerLeft) / bunker.cellSize)
    )
    const endCol = Math.min(
      bunker.cells[0].length - 1,
      Math.ceil((right - bunkerLeft) / bunker.cellSize)
    )
    const startRow = Math.max(
      0,
      Math.floor((top - bunkerTop) / bunker.cellSize)
    )
    const endRow = Math.min(
      bunker.cells.length - 1,
      Math.ceil((bottom - bunkerTop) / bunker.cellSize)
    )

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        if (bunker.cells[row] && bunker.cells[row][col]) {
          bunker.cells[row][col].isDestroyed = true
        }
      }
    }
  }

  // Asteroids hitting player
  private checkAsteroidsVsPlayer(state: GameState): void {
    const player = state.player
    if (!player.isActive || player.isInvincible || player.isRespawning) return

    for (const asteroid of state.asteroids) {
      if (!asteroid.isActive) continue

      if (this.checkAABB(asteroid, player)) {
        asteroid.isActive = false
        this.handlePlayerHit(state)
        this.particleSystem.createExplosion(state, asteroid.position, COLORS.asteroid)
        break
      }
    }
  }

  // Boss colliding with player
  private checkBossVsPlayer(state: GameState): void {
    const boss = state.boss
    const player = state.player
    if (!boss || !boss.isActive || !player.isActive) return
    if (player.isInvincible || player.isRespawning) return

    if (this.checkAABB(boss, player)) {
      this.handlePlayerHit(state)
    }
  }

  // Handle player being hit
  private handlePlayerHit(state: GameState): void {
    const isGameOver = this.playerSystem.hit(state.player, state)

    this.particleSystem.createPlayerDeath(state, state.player.position)
    this.audioManager.playPlayerDeath()

    if (isGameOver) {
      // Game over handled by engine
    }
  }

  // Power-ups touching player
  private checkPowerUpsVsPlayer(state: GameState): void {
    const player = state.player
    if (!player.isActive) return

    for (const powerUp of state.powerUps) {
      if (!powerUp.isActive) continue

      if (this.checkAABB(powerUp, player)) {
        this.powerUpSystem?.collectPowerUp(powerUp, state)
      }
    }
  }

  // AABB collision check
  private checkAABB(
    a: { position: Vector2D; width: number; height: number },
    b: { position: Vector2D; width: number; height: number }
  ): boolean {
    return (
      Math.abs(a.position.x - b.position.x) < (a.width + b.width) / 2 &&
      Math.abs(a.position.y - b.position.y) < (a.height + b.height) / 2
    )
  }
}
