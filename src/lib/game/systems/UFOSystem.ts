// UFO System
// Handles the mystery UFO that crosses the top of the screen

import type { MysteryUFO, GameState } from '../types'
import { UFO, CANVAS } from '../config'
import type { AudioManager } from '../audio/AudioManager'

export class UFOSystem {
  private ufoSoundInterval: ReturnType<typeof setInterval> | null = null

  constructor(private audioManager: AudioManager) {}

  // Try to spawn a UFO
  trySpawn(state: GameState, currentTime: number): void {
    // Don't spawn if one already exists
    if (state.mysteryUFO) return

    // Don't spawn during boss fights
    if (state.isBossWave && state.boss?.isActive) return

    // Don't spawn on wave 1
    if (state.wave < 2) return

    // Check spawn interval
    const timeSinceLastSpawn = currentTime - state.lastUFOSpawn
    if (timeSinceLastSpawn < UFO.spawnInterval) return

    // Random spawn chance
    if (Math.random() > UFO.spawnChance) {
      state.lastUFOSpawn = currentTime
      return
    }

    // Spawn UFO
    state.mysteryUFO = this.createUFO()
    state.lastUFOSpawn = currentTime

    // Start UFO sound
    this.startSound()
  }

  // Create a new UFO
  private createUFO(): MysteryUFO {
    const fromLeft = Math.random() < 0.5
    const direction = fromLeft ? 1 : -1

    return {
      position: {
        x: fromLeft ? -UFO.width : CANVAS.width + UFO.width,
        y: 30 + Math.random() * 20,
      },
      velocity: {
        x: direction * UFO.speed,
        y: 0,
      },
      direction,
      width: UFO.width,
      height: UFO.height,
      points:
        UFO.minPoints +
        Math.floor(Math.random() * (UFO.maxPoints - UFO.minPoints)),
      isActive: true,
    }
  }

  // Update UFO position
  update(dt: number, state: GameState): void {
    const ufo = state.mysteryUFO
    if (!ufo || !ufo.isActive) {
      this.stopSound()
      return
    }

    const dtSeconds = dt / 1000
    ufo.position.x += ufo.velocity.x * dtSeconds

    // Check if UFO has left the screen
    if (
      (ufo.direction > 0 && ufo.position.x > CANVAS.width + UFO.width) ||
      (ufo.direction < 0 && ufo.position.x < -UFO.width)
    ) {
      state.mysteryUFO = null
      this.stopSound()
    }
  }

  // Start UFO sound
  private startSound(): void {
    this.stopSound()
    this.audioManager.playUFO()

    // Loop the sound
    this.ufoSoundInterval = setInterval(() => {
      this.audioManager.playUFO()
    }, 300)
  }

  // Stop UFO sound
  private stopSound(): void {
    if (this.ufoSoundInterval) {
      clearInterval(this.ufoSoundInterval)
      this.ufoSoundInterval = null
    }
  }

  // Clear UFO
  clear(state: GameState): void {
    state.mysteryUFO = null
    this.stopSound()
  }

  // Cleanup
  destroy(): void {
    this.stopSound()
  }
}
