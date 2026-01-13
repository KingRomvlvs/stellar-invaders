// Formation System - THE KEY DIFFERENTIATOR
// Authentic Space Invaders formation movement:
// All invaders move together as a grid, step by step

import type {
  FormationState,
  InvaderSlot,
  Invader,
  InvaderType,
  Vector2D,
  Bounds,
  GameState,
  Projectile,
} from '../types'
import {
  FORMATION,
  INVADER_CONFIG,
  INVADER_ROW_TYPES,
  CANVAS,
  PROJECTILE,
} from '../config'
import type { AudioManager } from '../audio/AudioManager'

export class FormationSystem {
  private audioManager: AudioManager | null = null

  // Set audio manager reference
  setAudioManager(audioManager: AudioManager): void {
    this.audioManager = audioManager
  }

  // Create a new formation for a wave
  createFormation(wave: number): FormationState {
    const grid: InvaderSlot[][] = []

    // Create the grid based on row types
    for (let row = 0; row < FORMATION.rows; row++) {
      grid[row] = []
      const invaderType = INVADER_ROW_TYPES[row] ?? 'octopus'

      for (let col = 0; col < FORMATION.cols; col++) {
        grid[row][col] = {
          row,
          col,
          invader: this.createInvader(invaderType),
        }
      }
    }

    const totalInvaders = FORMATION.rows * FORMATION.cols

    // Calculate base step interval (gets faster each wave)
    const baseStepInterval = Math.max(
      FORMATION.minStepInterval,
      FORMATION.maxStepInterval - (wave - 1) * FORMATION.stepIntervalReductionPerWave
    )

    return {
      grid,
      bounds: this.calculateBounds(grid),
      position: { x: FORMATION.startX, y: FORMATION.startY },
      direction: 1,
      pendingDrop: false,
      stepTimer: 0,
      baseStepInterval,
      currentStepInterval: baseStepInterval,
      totalInvaders,
      activeInvaders: totalInvaders,
      animationFrame: 0,
    }
  }

  // Create a single invader
  private createInvader(type: InvaderType): Invader {
    const config = INVADER_CONFIG[type]
    return {
      type,
      health: config.health,
      points: config.points,
      isActive: true,
    }
  }

  // Main update - step-based movement
  update(dt: number, state: GameState): void {
    const formation = state.formation
    if (!formation || formation.activeInvaders === 0) return

    formation.stepTimer += dt

    // Step-based movement (not continuous!)
    if (formation.stepTimer >= formation.currentStepInterval) {
      formation.stepTimer = 0
      this.step(formation, state)
    }
  }

  // Perform one step of formation movement
  private step(formation: FormationState, state: GameState): void {
    // Toggle animation frame for all invaders (classic wiggle effect)
    formation.animationFrame = formation.animationFrame === 0 ? 1 : 0

    // Play step sound (classic Space Invaders beep)
    this.audioManager?.playInvaderStep()

    if (formation.pendingDrop) {
      // Drop down
      formation.position.y += FORMATION.verticalDrop
      formation.pendingDrop = false
      formation.direction = (formation.direction * -1) as 1 | -1

      // Check if formation reached player area
      const bottomY =
        formation.position.y +
        formation.bounds.bottom +
        FORMATION.invaderHeight

      if (bottomY >= state.player.position.y - 20) {
        // Formation reached player level - this should trigger game over
        // (handled by collision system)
      }
    } else {
      // Move sideways
      formation.position.x += FORMATION.horizontalStep * formation.direction

      // Check if formation hits edge
      const formationLeft = formation.position.x + formation.bounds.left
      const formationRight =
        formation.position.x + formation.bounds.right + FORMATION.invaderWidth

      if (formationRight >= CANVAS.width - 20 || formationLeft <= 20) {
        formation.pendingDrop = true
      }
    }

    // Update speed based on remaining invaders
    this.updateSpeed(formation)

    // Bottom invaders try to shoot
    this.tryShoot(formation, state)
  }

  // Update formation speed based on how many invaders remain
  private updateSpeed(formation: FormationState): void {
    // Classic Space Invaders: speed increases as invaders are destroyed
    const killRatio = 1 - formation.activeInvaders / formation.totalInvaders
    const speedBoost =
      killRatio * (FORMATION.maxStepInterval - FORMATION.minStepInterval)

    formation.currentStepInterval = Math.max(
      FORMATION.minStepInterval,
      formation.baseStepInterval - speedBoost
    )
  }

  // Calculate the bounding box of active invaders
  calculateBounds(grid: InvaderSlot[][]): Bounds {
    let left = Infinity
    let right = -Infinity
    let top = Infinity
    let bottom = -Infinity

    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (grid[row][col].invader?.isActive) {
          const x = col * FORMATION.spacingX
          const y = row * FORMATION.spacingY
          left = Math.min(left, x)
          right = Math.max(right, x)
          top = Math.min(top, y)
          bottom = Math.max(bottom, y)
        }
      }
    }

    // Handle empty formation
    if (left === Infinity) {
      return { left: 0, right: 0, top: 0, bottom: 0 }
    }

    return { left, right, top, bottom }
  }

  // Get bottom-most invaders in each column (only they can shoot)
  private getBottomInvaders(formation: FormationState): InvaderSlot[] {
    const bottomInvaders: InvaderSlot[] = []

    for (let col = 0; col < FORMATION.cols; col++) {
      // Find the bottom-most active invader in this column
      for (let row = FORMATION.rows - 1; row >= 0; row--) {
        const slot = formation.grid[row][col]
        if (slot.invader?.isActive) {
          bottomInvaders.push(slot)
          break
        }
      }
    }

    return bottomInvaders
  }

  // Try to shoot from formation
  // Different invader types have different shooting patterns:
  // - Squid (red): Double shot (two projectiles in a row)
  // - Crab (green): Triple spread shot
  // - Octopus (blue): Normal single shot
  private tryShoot(formation: FormationState, state: GameState): void {
    const shooters = this.getBottomInvaders(formation)
    if (shooters.length === 0) return

    // Random chance to shoot each step
    if (Math.random() < FORMATION.shootChance) {
      // Pick a random bottom invader to shoot
      const shooter = shooters[Math.floor(Math.random() * shooters.length)]
      const invaderType = shooter.invader?.type ?? 'octopus'
      const worldPos = this.getInvaderWorldPosition(formation, shooter.row, shooter.col)

      // Create projectiles based on invader type (all same speed)
      switch (invaderType) {
        case 'squid':
          // Double shot (two projectiles stacked vertically)
          this.createProjectile(state, worldPos, 0, PROJECTILE.enemy.speed)
          this.createProjectile(
            state,
            { x: worldPos.x, y: worldPos.y + 12 },
            0,
            PROJECTILE.enemy.speed
          )
          break

        case 'crab':
          // Triple spread shot
          const spreadAngle = 20 * (Math.PI / 180) // 20 degrees
          this.createProjectile(state, worldPos, 0, PROJECTILE.enemy.speed) // Center
          this.createProjectile(
            state,
            { x: worldPos.x - 6, y: worldPos.y },
            -Math.sin(spreadAngle) * PROJECTILE.enemy.speed,
            Math.cos(spreadAngle) * PROJECTILE.enemy.speed
          ) // Left
          this.createProjectile(
            state,
            { x: worldPos.x + 6, y: worldPos.y },
            Math.sin(spreadAngle) * PROJECTILE.enemy.speed,
            Math.cos(spreadAngle) * PROJECTILE.enemy.speed
          ) // Right
          break

        case 'octopus':
        default:
          // Normal single shot
          this.createProjectile(state, worldPos, 0, PROJECTILE.enemy.speed)
          break
      }
    }
  }

  // Helper to create an enemy projectile
  private createProjectile(
    state: GameState,
    position: Vector2D,
    velocityX: number,
    velocityY: number
  ): void {
    const projectile: Projectile = {
      position: {
        x: position.x,
        y: position.y + FORMATION.invaderHeight / 2 + 5,
      },
      velocity: { x: velocityX, y: velocityY },
      width: PROJECTILE.enemy.width,
      height: PROJECTILE.enemy.height,
      isActive: true,
      isPlayerProjectile: false,
      damage: 1,
      type: 'normal',
    }

    state.enemyProjectiles.push(projectile)
  }

  // Get world position of an invader
  getInvaderWorldPosition(
    formation: FormationState,
    row: number,
    col: number
  ): Vector2D {
    return {
      x:
        formation.position.x +
        col * FORMATION.spacingX +
        FORMATION.invaderWidth / 2,
      y:
        formation.position.y +
        row * FORMATION.spacingY +
        FORMATION.invaderHeight / 2,
    }
  }

  // Get invader at grid position
  getInvaderAt(
    formation: FormationState,
    row: number,
    col: number
  ): Invader | null {
    if (
      row < 0 ||
      row >= FORMATION.rows ||
      col < 0 ||
      col >= FORMATION.cols
    ) {
      return null
    }
    return formation.grid[row][col].invader
  }

  // Destroy invader and return points
  destroyInvader(
    formation: FormationState,
    row: number,
    col: number
  ): number {
    const slot = formation.grid[row][col]
    if (!slot.invader?.isActive) return 0

    const points = slot.invader.points
    slot.invader.isActive = false
    slot.invader = null
    formation.activeInvaders--

    // Recalculate bounds when invader is destroyed
    formation.bounds = this.calculateBounds(formation.grid)

    return points
  }

  // Check if formation is empty
  isFormationEmpty(formation: FormationState): boolean {
    return formation.activeInvaders === 0
  }

  // Get all active invaders with their world positions
  getActiveInvadersWithPositions(
    formation: FormationState
  ): Array<{ slot: InvaderSlot; worldPos: Vector2D }> {
    const result: Array<{ slot: InvaderSlot; worldPos: Vector2D }> = []

    for (let row = 0; row < formation.grid.length; row++) {
      for (let col = 0; col < formation.grid[row].length; col++) {
        const slot = formation.grid[row][col]
        if (slot.invader?.isActive) {
          result.push({
            slot,
            worldPos: this.getInvaderWorldPosition(formation, row, col),
          })
        }
      }
    }

    return result
  }

  // Find invader at world position (for collision detection)
  findInvaderAtWorldPosition(
    formation: FormationState,
    worldX: number,
    worldY: number,
    hitboxWidth: number,
    hitboxHeight: number
  ): { row: number; col: number } | null {
    for (let row = 0; row < formation.grid.length; row++) {
      for (let col = 0; col < formation.grid[row].length; col++) {
        const slot = formation.grid[row][col]
        if (!slot.invader?.isActive) continue

        const invaderPos = this.getInvaderWorldPosition(formation, row, col)

        // AABB collision check
        const overlapX =
          Math.abs(worldX - invaderPos.x) <
          (hitboxWidth + FORMATION.invaderWidth) / 2
        const overlapY =
          Math.abs(worldY - invaderPos.y) <
          (hitboxHeight + FORMATION.invaderHeight) / 2

        if (overlapX && overlapY) {
          return { row, col }
        }
      }
    }

    return null
  }
}
