// Particle System
// Handles visual effects like explosions and debris

import type { Particle, GameState, Vector2D } from '../types'
import { PARTICLES, COLORS, CANVAS } from '../config'

export class ParticleSystem {
  // Update all particles
  update(dt: number, state: GameState): void {
    const dtSeconds = dt / 1000

    for (const particle of state.particles) {
      // Update position
      particle.position.x += particle.velocity.x * dtSeconds
      particle.position.y += particle.velocity.y * dtSeconds

      // Apply gravity to some particles
      particle.velocity.y += 100 * dtSeconds

      // Update rotation if applicable
      if (particle.rotation !== undefined && particle.rotationSpeed !== undefined) {
        particle.rotation += particle.rotationSpeed * dtSeconds
      }

      // Update lifetime
      particle.lifetime -= dt
    }

    // Remove dead particles
    state.particles = state.particles.filter((p) => p.lifetime > 0)
  }

  // Create an explosion at position
  createExplosion(state: GameState, position: Vector2D, color?: string): void {
    const colors = color ? [color] : COLORS.explosion

    for (let i = 0; i < PARTICLES.explosionCount; i++) {
      const angle = (Math.PI * 2 * i) / PARTICLES.explosionCount + Math.random() * 0.3
      const speed = PARTICLES.explosionSpeed * (0.5 + Math.random() * 0.5)

      const particle: Particle = {
        position: { x: position.x, y: position.y },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 4,
        lifetime: PARTICLES.explosionLifetime * (0.6 + Math.random() * 0.4),
        maxLifetime: PARTICLES.explosionLifetime,
      }

      state.particles.push(particle)
    }
  }

  // Create debris particles (for asteroids)
  createDebris(state: GameState, position: Vector2D, color: string): void {
    for (let i = 0; i < PARTICLES.debrisCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 50 + Math.random() * 150

      const particle: Particle = {
        position: { x: position.x, y: position.y },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        color,
        size: 3 + Math.random() * 5,
        lifetime: PARTICLES.debrisLifetime * (0.6 + Math.random() * 0.4),
        maxLifetime: PARTICLES.debrisLifetime,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 10,
      }

      state.particles.push(particle)
    }
  }

  // Create small hit spark
  createHitSpark(state: GameState, position: Vector2D, color: string): void {
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 30 + Math.random() * 70

      const particle: Particle = {
        position: { x: position.x, y: position.y },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        color,
        size: 1 + Math.random() * 2,
        lifetime: 200 + Math.random() * 200,
        maxLifetime: 400,
      }

      state.particles.push(particle)
    }
  }

  // Create invader death effect
  createInvaderDeath(state: GameState, position: Vector2D, invaderColor: string): void {
    // Main explosion
    this.createExplosion(state, position, invaderColor)

    // Additional sparks
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 80 + Math.random() * 120

      const particle: Particle = {
        position: { x: position.x, y: position.y },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed - 50, // Upward bias
        },
        color: invaderColor,
        size: 2 + Math.random() * 3,
        lifetime: 400 + Math.random() * 300,
        maxLifetime: 700,
      }

      state.particles.push(particle)
    }
  }

  // Create player death effect
  createPlayerDeath(state: GameState, position: Vector2D): void {
    // Big explosion
    for (let i = 0; i < 40; i++) {
      const angle = (Math.PI * 2 * i) / 40 + Math.random() * 0.2
      const speed = 150 + Math.random() * 200

      const particle: Particle = {
        position: { x: position.x, y: position.y },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        color: i % 2 === 0 ? COLORS.player : '#FFFFFF',
        size: 3 + Math.random() * 5,
        lifetime: 800 + Math.random() * 400,
        maxLifetime: 1200,
      }

      state.particles.push(particle)
    }
  }

  // Create bunker hit effect
  createBunkerHit(state: GameState, position: Vector2D): void {
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 20 + Math.random() * 40

      const particle: Particle = {
        position: { x: position.x, y: position.y },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        color: COLORS.bunker,
        size: 2 + Math.random() * 2,
        lifetime: 300 + Math.random() * 200,
        maxLifetime: 500,
      }

      state.particles.push(particle)
    }
  }

  // Clear all particles
  clear(state: GameState): void {
    state.particles = []
  }

  // Get particle alpha based on lifetime
  getParticleAlpha(particle: Particle): number {
    return Math.max(0, particle.lifetime / particle.maxLifetime)
  }
}
