// Renderer
// Handles all canvas rendering with pixel art sprites

import type {
  GameState,
  FormationState,
  Particle,
  Star,
  InvaderType,
} from '../types'
import {
  CANVAS,
  COLORS,
  FORMATION,
  PLAYER,
  UFO,
  BOSS,
  BUNKER,
} from '../config'
import {
  INVADER_SPRITES,
  PLAYER_SPRITE,
  UFO_SPRITE,
  BOSS_SPRITE,
} from './Sprites'

export class Renderer {
  private ctx: CanvasRenderingContext2D
  private reducedMotion: boolean = false
  private pixelScale: number = 2 // Scale factor for pixel art

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
    this.ctx.imageSmoothingEnabled = false
  }

  // Set reduced motion preference
  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced
  }

  // Main render function
  render(state: GameState, alpha: number): void {
    this.clear()

    // Apply screen shake if active
    this.applyScreenShake(state)

    // Render layers in order
    this.renderStars(state.stars)
    this.renderBunkers(state)
    this.renderFormation(state)
    this.renderPlayer(state, alpha)
    this.renderProjectiles(state)
    this.renderAsteroids(state)
    this.renderUFO(state)
    this.renderBoss(state)
    this.renderParticles(state)

    // Reset transform after shake
    this.ctx.setTransform(1, 0, 0, 1, 0, 0)
  }

  // Clear canvas
  private clear(): void {
    this.ctx.fillStyle = COLORS.background
    this.ctx.fillRect(0, 0, CANVAS.width, CANVAS.height)
  }

  // Apply screen shake transform
  private applyScreenShake(state: GameState): void {
    if (state.screenShake && !this.reducedMotion) {
      const progress = state.screenShake.elapsed / state.screenShake.duration
      const intensity = state.screenShake.intensity * (1 - progress)
      const offsetX = (Math.random() - 0.5) * intensity * 2
      const offsetY = (Math.random() - 0.5) * intensity * 2
      this.ctx.translate(offsetX, offsetY)
    }
  }

  // Render starfield background
  private renderStars(stars: Star[]): void {
    for (const star of stars) {
      this.ctx.globalAlpha = star.brightness
      this.ctx.fillStyle = '#FFFFFF'
      this.ctx.beginPath()
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
      this.ctx.fill()
    }
    this.ctx.globalAlpha = 1
  }

  // Render bunkers
  private renderBunkers(state: GameState): void {
    for (const bunker of state.bunkers) {
      const bunkerLeft = bunker.position.x - bunker.width / 2
      const bunkerTop = bunker.position.y - bunker.height / 2

      for (let row = 0; row < bunker.cells.length; row++) {
        for (let col = 0; col < bunker.cells[row].length; col++) {
          const cell = bunker.cells[row][col]
          if (cell.isDestroyed) continue

          // Color based on damage
          const healthRatio = cell.health / BUNKER.cellHealth
          const colorIndex = Math.min(
            3,
            Math.floor((1 - healthRatio) * 4)
          )
          this.ctx.fillStyle = COLORS.bunkerDamaged[colorIndex]

          const x = bunkerLeft + col * bunker.cellSize
          const y = bunkerTop + row * bunker.cellSize
          this.ctx.fillRect(x, y, bunker.cellSize, bunker.cellSize)
        }
      }
    }
  }

  // Render invader formation
  private renderFormation(state: GameState): void {
    const formation = state.formation
    if (!formation) return

    for (let row = 0; row < formation.grid.length; row++) {
      for (let col = 0; col < formation.grid[row].length; col++) {
        const slot = formation.grid[row][col]
        if (!slot.invader?.isActive) continue

        const worldX =
          formation.position.x +
          col * FORMATION.spacingX +
          FORMATION.invaderWidth / 2
        const worldY =
          formation.position.y +
          row * FORMATION.spacingY +
          FORMATION.invaderHeight / 2

        this.renderInvader(
          slot.invader.type,
          formation.animationFrame,
          worldX,
          worldY
        )
      }
    }
  }

  // Render a single invader
  private renderInvader(
    type: InvaderType,
    frame: 0 | 1,
    centerX: number,
    centerY: number
  ): void {
    const sprites = INVADER_SPRITES[type]
    const sprite = sprites[frame]
    const color = COLORS.invaders[type]

    const spriteWidth = sprite[0].length
    const spriteHeight = sprite.length
    const scale = this.pixelScale

    const startX = centerX - (spriteWidth * scale) / 2
    const startY = centerY - (spriteHeight * scale) / 2

    this.ctx.fillStyle = color

    // Add glow effect
    this.ctx.shadowColor = color
    this.ctx.shadowBlur = 8

    for (let row = 0; row < sprite.length; row++) {
      for (let col = 0; col < sprite[row].length; col++) {
        if (sprite[row][col]) {
          this.ctx.fillRect(
            startX + col * scale,
            startY + row * scale,
            scale,
            scale
          )
        }
      }
    }

    this.ctx.shadowBlur = 0
  }

  // Render player
  private renderPlayer(state: GameState, alpha: number): void {
    const player = state.player
    if (!player.isActive && !player.isRespawning) return

    // Flicker during invincibility
    if (player.isInvincible && Math.floor(performance.now() / 100) % 2 === 0) {
      this.ctx.globalAlpha = 0.4
    }

    // Flicker during respawn
    if (player.isRespawning) {
      this.ctx.globalAlpha = 0.3 + Math.sin(performance.now() / 100) * 0.2
    }

    const sprite = PLAYER_SPRITE
    const spriteWidth = sprite[0].length
    const spriteHeight = sprite.length
    const scale = 3 // Slightly larger for player

    const startX = player.position.x - (spriteWidth * scale) / 2
    const startY = player.position.y - (spriteHeight * scale) / 2

    this.ctx.fillStyle = COLORS.player
    this.ctx.shadowColor = COLORS.player
    this.ctx.shadowBlur = 15

    for (let row = 0; row < sprite.length; row++) {
      for (let col = 0; col < sprite[row].length; col++) {
        if (sprite[row][col]) {
          this.ctx.fillRect(
            startX + col * scale,
            startY + row * scale,
            scale,
            scale
          )
        }
      }
    }

    this.ctx.shadowBlur = 0
    this.ctx.globalAlpha = 1

    // Render engine trail
    if (player.isActive && !this.reducedMotion) {
      this.renderPlayerTrail(player.position.x, player.position.y + 20)
    }
  }

  // Render player engine trail
  private renderPlayerTrail(x: number, y: number): void {
    this.ctx.fillStyle = COLORS.playerTrail
    const flicker = 5 + Math.random() * 10

    this.ctx.beginPath()
    this.ctx.moveTo(x - 8, y)
    this.ctx.lineTo(x, y + flicker)
    this.ctx.lineTo(x + 8, y)
    this.ctx.closePath()
    this.ctx.fill()
  }

  // Render projectiles
  private renderProjectiles(state: GameState): void {
    // Player projectiles
    for (const proj of state.playerProjectiles) {
      if (!proj.isActive) continue

      this.ctx.fillStyle = COLORS.playerProjectile
      this.ctx.shadowColor = COLORS.playerProjectile
      this.ctx.shadowBlur = 10

      this.ctx.fillRect(
        proj.position.x - proj.width / 2,
        proj.position.y - proj.height / 2,
        proj.width,
        proj.height
      )
    }

    // Enemy projectiles
    for (const proj of state.enemyProjectiles) {
      if (!proj.isActive) continue

      const color =
        proj.type === 'powered' ? COLORS.bossProjectile : COLORS.enemyProjectile

      this.ctx.fillStyle = color
      this.ctx.shadowColor = color
      this.ctx.shadowBlur = 8

      this.ctx.fillRect(
        proj.position.x - proj.width / 2,
        proj.position.y - proj.height / 2,
        proj.width,
        proj.height
      )
    }

    this.ctx.shadowBlur = 0
  }

  // Render asteroids
  private renderAsteroids(state: GameState): void {
    for (const asteroid of state.asteroids) {
      if (!asteroid.isActive) continue

      this.ctx.save()
      this.ctx.translate(asteroid.position.x, asteroid.position.y)
      this.ctx.rotate(asteroid.rotation)

      this.ctx.fillStyle = COLORS.asteroid
      this.ctx.strokeStyle = '#5a4a3a'
      this.ctx.lineWidth = 2

      // Draw irregular polygon
      this.ctx.beginPath()
      const radius = asteroid.width / 2
      const points = 8

      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2
        const r = radius * (0.7 + Math.sin(i * 1.5) * 0.3)
        const x = Math.cos(angle) * r
        const y = Math.sin(angle) * r

        if (i === 0) {
          this.ctx.moveTo(x, y)
        } else {
          this.ctx.lineTo(x, y)
        }
      }

      this.ctx.closePath()
      this.ctx.fill()
      this.ctx.stroke()

      this.ctx.restore()
    }
  }

  // Render UFO
  private renderUFO(state: GameState): void {
    const ufo = state.mysteryUFO
    if (!ufo || !ufo.isActive) return

    const sprite = UFO_SPRITE
    const spriteWidth = sprite[0].length
    const spriteHeight = sprite.length
    const scale = 2

    const startX = ufo.position.x - (spriteWidth * scale) / 2
    const startY = ufo.position.y - (spriteHeight * scale) / 2

    // Pulsing glow effect
    const pulse = 0.8 + Math.sin(performance.now() / 100) * 0.2

    this.ctx.fillStyle = COLORS.ufo
    this.ctx.shadowColor = COLORS.ufo
    this.ctx.shadowBlur = 20 * pulse

    for (let row = 0; row < sprite.length; row++) {
      for (let col = 0; col < sprite[row].length; col++) {
        if (sprite[row][col]) {
          this.ctx.fillRect(
            startX + col * scale,
            startY + row * scale,
            scale,
            scale
          )
        }
      }
    }

    this.ctx.shadowBlur = 0

    // Mystery points indicator
    this.ctx.fillStyle = COLORS.ufo
    this.ctx.font = 'bold 12px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('?', ufo.position.x, ufo.position.y - 15)
  }

  // Render boss
  private renderBoss(state: GameState): void {
    const boss = state.boss
    if (!boss || !boss.isActive) return

    // Pulsing effect based on phase
    const pulseSpeed = 300 / boss.phase
    const pulse = 1 + Math.sin(performance.now() / pulseSpeed) * 0.1

    this.ctx.save()
    this.ctx.translate(boss.position.x, boss.position.y)
    this.ctx.scale(pulse, pulse)

    const sprite = BOSS_SPRITE
    const spriteWidth = sprite[0].length
    const spriteHeight = sprite.length
    const scale = 4

    const startX = -(spriteWidth * scale) / 2
    const startY = -(spriteHeight * scale) / 2

    this.ctx.fillStyle = COLORS.boss
    this.ctx.shadowColor = COLORS.boss
    this.ctx.shadowBlur = 25

    for (let row = 0; row < sprite.length; row++) {
      for (let col = 0; col < sprite[row].length; col++) {
        if (sprite[row][col]) {
          this.ctx.fillRect(
            startX + col * scale,
            startY + row * scale,
            scale,
            scale
          )
        }
      }
    }

    this.ctx.shadowBlur = 0
    this.ctx.restore()

    // Telegraph indicator
    if (boss.isTelegraphing) {
      this.renderBossTelegraph(boss)
    }

    // Health bar
    this.renderBossHealthBar(boss)
  }

  // Render boss telegraph indicator
  private renderBossTelegraph(
    boss: { position: { x: number; y: number }; nextAttack: string; telegraphTimer: number }
  ): void {
    const progress = boss.telegraphTimer / 1000
    const alpha = 0.5 + Math.sin(performance.now() / 50) * 0.3

    this.ctx.globalAlpha = alpha
    this.ctx.strokeStyle = '#FF0000'
    this.ctx.lineWidth = 3

    // Draw warning circle
    this.ctx.beginPath()
    this.ctx.arc(
      boss.position.x,
      boss.position.y,
      60 + progress * 20,
      0,
      Math.PI * 2 * progress
    )
    this.ctx.stroke()

    this.ctx.globalAlpha = 1
  }

  // Render boss health bar
  private renderBossHealthBar(
    boss: { health: number; maxHealth: number; phase: number }
  ): void {
    const barWidth = 200
    const barHeight = 12
    const barX = CANVAS.width / 2 - barWidth / 2
    const barY = 15

    // Background
    this.ctx.fillStyle = COLORS.bossHealthBar.background
    this.ctx.fillRect(barX, barY, barWidth, barHeight)

    // Health
    const healthPercent = boss.health / boss.maxHealth
    let healthColor: string = COLORS.bossHealthBar.high
    if (healthPercent < 0.3) healthColor = COLORS.bossHealthBar.low
    else if (healthPercent < 0.6) healthColor = COLORS.bossHealthBar.medium

    this.ctx.fillStyle = healthColor
    this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight)

    // Border
    this.ctx.strokeStyle = '#FFFFFF'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(barX, barY, barWidth, barHeight)

    // Label
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = 'bold 10px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(`BOSS - PHASE ${boss.phase}`, CANVAS.width / 2, barY + 10)
  }

  // Render particles
  private renderParticles(state: GameState): void {
    if (this.reducedMotion) return

    for (const particle of state.particles) {
      const alpha = Math.max(0, particle.lifetime / particle.maxLifetime)
      this.ctx.globalAlpha = alpha
      this.ctx.fillStyle = particle.color

      if (particle.rotation !== undefined) {
        // Debris particle (rotating)
        this.ctx.save()
        this.ctx.translate(particle.position.x, particle.position.y)
        this.ctx.rotate(particle.rotation)
        this.ctx.fillRect(
          -particle.size / 2,
          -particle.size / 2,
          particle.size,
          particle.size
        )
        this.ctx.restore()
      } else {
        // Regular particle (circle)
        this.ctx.beginPath()
        this.ctx.arc(
          particle.position.x,
          particle.position.y,
          particle.size,
          0,
          Math.PI * 2
        )
        this.ctx.fill()
      }
    }

    this.ctx.globalAlpha = 1
  }

  // Render text (utility)
  renderText(
    text: string,
    x: number,
    y: number,
    options: {
      color?: string
      fontSize?: number
      align?: CanvasTextAlign
      glow?: boolean
    } = {}
  ): void {
    const {
      color = '#FFFFFF',
      fontSize = 16,
      align = 'center',
      glow = false,
    } = options

    this.ctx.fillStyle = color
    this.ctx.font = `bold ${fontSize}px monospace`
    this.ctx.textAlign = align

    if (glow) {
      this.ctx.shadowColor = color
      this.ctx.shadowBlur = 15
    }

    this.ctx.fillText(text, x, y)
    this.ctx.shadowBlur = 0
  }
}
