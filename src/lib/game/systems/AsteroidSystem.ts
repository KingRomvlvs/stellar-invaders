// Asteroid System
// Handles asteroid spawning, movement, and destruction

import type { Asteroid, AsteroidSize, GameState } from '../types'
import { ASTEROID, ASTEROID_CONFIG, CANVAS } from '../config'
import type { ParticleSystem } from './ParticleSystem'
import type { AudioManager } from '../audio/AudioManager'

export class AsteroidSystem {
  private lastSpawnTime: number = 0

  constructor(
    private particleSystem: ParticleSystem,
    private audioManager: AudioManager
  ) {}

  // Get max asteroids for current wave
  private getMaxAsteroids(wave: number): number {
    if (wave === 1) return 0
    if (wave === 2) return 1
    if (wave === 3) return 1
    if (wave === 4) return 2
    return 2 // Cap at 2 for casual difficulty
  }

  // Try to spawn an asteroid
  trySpawn(state: GameState, currentTime: number): void {
    // Don't spawn during boss fights
    if (state.isBossWave && state.boss?.isActive) return

    // Check max asteroids
    const activeAsteroids = state.asteroids.filter((a) => a.isActive).length
    const maxAsteroids = this.getMaxAsteroids(state.wave)
    if (activeAsteroids >= maxAsteroids) return

    // Check spawn interval
    if (currentTime - this.lastSpawnTime < ASTEROID.spawnInterval) return

    // Random spawn chance
    if (Math.random() > ASTEROID.spawnChance) return

    this.lastSpawnTime = currentTime
    state.asteroids.push(this.createAsteroid())
  }

  // Create a new asteroid
  private createAsteroid(): Asteroid {
    // Mostly medium asteroids, some large, few small
    const sizeRoll = Math.random()
    let size: AsteroidSize
    if (sizeRoll < 0.3) {
      size = 'large'
    } else if (sizeRoll < 0.8) {
      size = 'medium'
    } else {
      size = 'small'
    }

    const config = ASTEROID_CONFIG[size]
    const fromLeft = Math.random() < 0.5
    const direction = fromLeft ? 1 : -1

    // Decide behavior: split or explode
    const behavior = Math.random() < 0.6 ? 'split' : 'explode'

    return {
      position: {
        x: fromLeft ? -config.width : CANVAS.width + config.width,
        y: 50 + Math.random() * 150,
      },
      velocity: {
        x: direction * config.speed * (0.8 + Math.random() * 0.4),
        y: config.speed * 0.3 + Math.random() * config.speed * 0.4,
      },
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 3,
      size,
      width: config.width,
      height: config.height,
      health: config.health,
      behavior,
      isActive: true,
    }
  }

  // Update all asteroids
  update(dt: number, state: GameState): void {
    const dtSeconds = dt / 1000

    for (const asteroid of state.asteroids) {
      if (!asteroid.isActive) continue

      // Update position
      asteroid.position.x += asteroid.velocity.x * dtSeconds
      asteroid.position.y += asteroid.velocity.y * dtSeconds

      // Update rotation
      asteroid.rotation += asteroid.rotationSpeed * dtSeconds

      // Remove if off screen (with margin)
      if (this.isOffScreen(asteroid)) {
        asteroid.isActive = false
        continue
      }

      // Check for destruction
      if (asteroid.health <= 0) {
        this.destroyAsteroid(asteroid, state)
      }
    }

    // Clean up inactive asteroids
    state.asteroids = state.asteroids.filter((a) => a.isActive)
  }

  // Check if asteroid is off screen
  private isOffScreen(asteroid: Asteroid): boolean {
    const margin = 100
    const config = ASTEROID_CONFIG[asteroid.size]

    return (
      asteroid.position.x < -margin - config.width ||
      asteroid.position.x > CANVAS.width + margin + config.width ||
      asteroid.position.y > CANVAS.height + margin + config.height
    )
  }

  // Destroy an asteroid
  private destroyAsteroid(asteroid: Asteroid, state: GameState): void {
    asteroid.isActive = false
    const config = ASTEROID_CONFIG[asteroid.size]

    // Add points
    state.score += config.points

    if (asteroid.behavior === 'split' && asteroid.size !== 'small') {
      // Split into smaller asteroids
      this.splitAsteroid(asteroid, state)
    } else {
      // Explode with debris
      this.explodeAsteroid(asteroid, state)
    }

    this.audioManager.playAsteroidDestroy()
  }

  // Split asteroid into smaller pieces
  private splitAsteroid(asteroid: Asteroid, state: GameState): void {
    const smallerSize: AsteroidSize = asteroid.size === 'large' ? 'medium' : 'small'
    const config = ASTEROID_CONFIG[smallerSize]

    // Create 2 smaller asteroids
    for (let i = 0; i < 2; i++) {
      const angle = (i === 0 ? -1 : 1) * (Math.PI / 4 + Math.random() * Math.PI / 4)

      const newAsteroid: Asteroid = {
        position: { ...asteroid.position },
        velocity: {
          x: Math.cos(angle) * config.speed,
          y: Math.sin(angle) * config.speed + config.speed * 0.3,
        },
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 4,
        size: smallerSize,
        width: config.width,
        height: config.height,
        health: config.health,
        behavior: Math.random() < 0.5 ? 'split' : 'explode',
        isActive: true,
      }

      state.asteroids.push(newAsteroid)
    }

    // Small explosion at split point
    this.particleSystem.createDebris(
      state,
      asteroid.position,
      '#8B7355'
    )
  }

  // Explode asteroid with debris spray
  private explodeAsteroid(asteroid: Asteroid, state: GameState): void {
    // Create debris particles
    this.particleSystem.createDebris(
      state,
      asteroid.position,
      '#8B7355'
    )

    // Create explosion particles
    this.particleSystem.createExplosion(
      state,
      asteroid.position,
      '#CD853F'
    )
  }

  // Clear all asteroids
  clear(state: GameState): void {
    state.asteroids = []
    this.lastSpawnTime = 0
  }

  // Reset spawn timer
  resetSpawnTimer(): void {
    this.lastSpawnTime = 0
  }
}
