// Projectile System
// Handles updating and cleaning up projectiles

import type { Projectile, GameState } from '../types'
import { CANVAS } from '../config'

export class ProjectileSystem {
  // Update all projectiles
  update(dt: number, state: GameState): void {
    this.updateProjectiles(state.playerProjectiles, dt)
    this.updateProjectiles(state.enemyProjectiles, dt)

    // Clean up inactive projectiles
    state.playerProjectiles = state.playerProjectiles.filter((p) => p.isActive)
    state.enemyProjectiles = state.enemyProjectiles.filter((p) => p.isActive)
  }

  // Update a list of projectiles
  private updateProjectiles(projectiles: Projectile[], dt: number): void {
    const dtSeconds = dt / 1000

    for (const projectile of projectiles) {
      if (!projectile.isActive) continue

      // Update position
      projectile.position.x += projectile.velocity.x * dtSeconds
      projectile.position.y += projectile.velocity.y * dtSeconds

      // Deactivate if off screen
      if (this.isOffScreen(projectile)) {
        projectile.isActive = false
      }
    }
  }

  // Check if projectile is off screen
  private isOffScreen(projectile: Projectile): boolean {
    const margin = 20

    return (
      projectile.position.x < -margin ||
      projectile.position.x > CANVAS.width + margin ||
      projectile.position.y < -margin ||
      projectile.position.y > CANVAS.height + margin
    )
  }

  // Clear all projectiles
  clearAll(state: GameState): void {
    state.playerProjectiles = []
    state.enemyProjectiles = []
  }

  // Clear only enemy projectiles
  clearEnemyProjectiles(state: GameState): void {
    state.enemyProjectiles = []
  }

  // Get active projectile count
  getActiveCount(state: GameState): { player: number; enemy: number } {
    return {
      player: state.playerProjectiles.filter((p) => p.isActive).length,
      enemy: state.enemyProjectiles.filter((p) => p.isActive).length,
    }
  }
}
