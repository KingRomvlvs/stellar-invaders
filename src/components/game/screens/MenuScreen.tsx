'use client'

// Menu Screen - Enhanced with animated background
// Stars, floating aliens, comets, and particle effects

import { CANVAS, COLORS } from '@/lib/game/config'

// ========== ANIMATION STATE ==========

interface Star {
  x: number
  y: number
  size: number
  brightness: number
  twinkleSpeed: number
  twinklePhase: number
  layer: number // 0 = far, 1 = mid, 2 = near
}

interface FloatingAlien {
  x: number
  y: number
  type: 'squid' | 'crab' | 'octopus'
  scale: number
  speed: number
  direction: number // 1 or -1
  wobblePhase: number
  wobbleSpeed: number
  opacity: number
  frame: number
  frameTimer: number
}

interface Comet {
  x: number
  y: number
  speed: number
  angle: number
  length: number
  brightness: number
  lifetime: number
  maxLifetime: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  lifetime: number
  maxLifetime: number
}

// Animation state singleton
class MenuAnimationState {
  stars: Star[] = []
  aliens: FloatingAlien[] = []
  comets: Comet[] = []
  particles: Particle[] = []
  initialized = false
  lastTime = 0
  titlePulse = 0
  titleGlowIntensity = 30

  init() {
    if (this.initialized) return
    this.initialized = true
    this.lastTime = performance.now()

    // Create starfield with 3 parallax layers
    this.stars = []
    for (let i = 0; i < 120; i++) {
      const layer = i < 40 ? 0 : i < 80 ? 1 : 2
      this.stars.push({
        x: Math.random() * CANVAS.width,
        y: Math.random() * CANVAS.height,
        size: 0.5 + Math.random() * (layer === 2 ? 2 : layer === 1 ? 1.5 : 1),
        brightness: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 0.5 + Math.random() * 2,
        twinklePhase: Math.random() * Math.PI * 2,
        layer,
      })
    }

    // Create initial floating aliens
    this.aliens = []
    for (let i = 0; i < 5; i++) {
      this.spawnAlien()
    }
  }

  spawnAlien() {
    const types: ('squid' | 'crab' | 'octopus')[] = ['squid', 'crab', 'octopus']
    const type = types[Math.floor(Math.random() * types.length)]
    const fromLeft = Math.random() > 0.5
    const y = 100 + Math.random() * (CANVAS.height - 300)

    this.aliens.push({
      x: fromLeft ? -50 : CANVAS.width + 50,
      y,
      type,
      scale: 0.8 + Math.random() * 0.8,
      speed: 15 + Math.random() * 25,
      direction: fromLeft ? 1 : -1,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 1 + Math.random() * 2,
      opacity: 0.15 + Math.random() * 0.25,
      frame: 0,
      frameTimer: 0,
    })
  }

  spawnComet() {
    // Random chance to spawn comet
    if (Math.random() > 0.003) return
    if (this.comets.length >= 3) return

    const fromTop = Math.random() > 0.3
    const angle = fromTop
      ? Math.PI / 4 + Math.random() * (Math.PI / 4)
      : -Math.PI / 4 + Math.random() * (Math.PI / 4)

    this.comets.push({
      x: fromTop ? Math.random() * CANVAS.width : CANVAS.width + 20,
      y: fromTop ? -20 : Math.random() * (CANVAS.height / 2),
      speed: 200 + Math.random() * 300,
      angle,
      length: 40 + Math.random() * 60,
      brightness: 0.6 + Math.random() * 0.4,
      lifetime: 0,
      maxLifetime: 3000 + Math.random() * 2000,
    })
  }

  update(dt: number) {
    const dtSeconds = dt / 1000

    // Update title pulse
    this.titlePulse += dt * 0.002
    this.titleGlowIntensity = 25 + Math.sin(this.titlePulse) * 10

    // Update stars (twinkling)
    for (const star of this.stars) {
      star.twinklePhase += star.twinkleSpeed * dtSeconds
    }

    // Update floating aliens
    for (const alien of this.aliens) {
      alien.x += alien.speed * alien.direction * dtSeconds
      alien.wobblePhase += alien.wobbleSpeed * dtSeconds
      alien.frameTimer += dt
      if (alien.frameTimer > 500) {
        alien.frameTimer = 0
        alien.frame = alien.frame === 0 ? 1 : 0
      }
    }

    // Remove off-screen aliens and spawn new ones
    this.aliens = this.aliens.filter((alien) => {
      if (alien.direction === 1) {
        return alien.x < CANVAS.width + 60
      }
      return alien.x > -60
    })

    // Maintain alien count
    while (this.aliens.length < 4) {
      this.spawnAlien()
    }

    // Try to spawn comets
    this.spawnComet()

    // Update comets
    for (const comet of this.comets) {
      comet.x += Math.cos(comet.angle) * comet.speed * dtSeconds
      comet.y += Math.sin(comet.angle) * comet.speed * dtSeconds
      comet.lifetime += dt

      // Spawn trail particles
      if (Math.random() > 0.5) {
        this.particles.push({
          x: comet.x,
          y: comet.y,
          vx: (Math.random() - 0.5) * 20,
          vy: (Math.random() - 0.5) * 20,
          size: 1 + Math.random() * 2,
          color: Math.random() > 0.5 ? '#FFD700' : '#FFFFFF',
          lifetime: 0,
          maxLifetime: 300 + Math.random() * 300,
        })
      }
    }

    // Remove expired comets
    this.comets = this.comets.filter(
      (c) =>
        c.lifetime < c.maxLifetime &&
        c.x > -100 &&
        c.x < CANVAS.width + 100 &&
        c.y < CANVAS.height + 100
    )

    // Update particles
    for (const particle of this.particles) {
      particle.x += particle.vx * dtSeconds
      particle.y += particle.vy * dtSeconds
      particle.lifetime += dt
    }

    // Remove expired particles
    this.particles = this.particles.filter((p) => p.lifetime < p.maxLifetime)
  }
}

// Singleton animation state
const animState = new MenuAnimationState()

// ========== RENDER FUNCTIONS ==========

interface MenuScreenProps {
  ctx: CanvasRenderingContext2D
  highScore: number
  onStart: () => void
  onHowTo: () => void
  onSettings: () => void
}

export function renderMenuScreen({
  ctx,
  highScore,
}: MenuScreenProps): void {
  // Initialize animation state
  animState.init()

  // Update animation
  const now = performance.now()
  const dt = Math.min(now - animState.lastTime, 100)
  animState.lastTime = now
  animState.update(dt)

  const centerX = CANVAS.width / 2

  // Background gradient (deep space)
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS.height)
  gradient.addColorStop(0, '#050510')
  gradient.addColorStop(0.5, '#0a0a1a')
  gradient.addColorStop(1, '#0a0815')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height)

  // Render starfield (back layer first)
  renderStarfield(ctx)

  // Render floating aliens (behind UI)
  renderFloatingAliens(ctx)

  // Render comets
  renderComets(ctx)

  // Render particles
  renderParticles(ctx)

  // Title with animated glow
  ctx.save()
  ctx.fillStyle = COLORS.player
  ctx.shadowColor = COLORS.player
  ctx.shadowBlur = animState.titleGlowIntensity
  ctx.font = 'bold 48px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('STELLAR', centerX, 120)
  ctx.fillText('INVADERS', centerX, 175)
  ctx.restore()

  // Subtitle with slight glow
  ctx.save()
  ctx.fillStyle = '#888888'
  ctx.shadowColor = '#888888'
  ctx.shadowBlur = 5
  ctx.font = '16px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('A Space Invaders Tribute', centerX, 210)
  ctx.restore()

  // High score with glow
  ctx.save()
  ctx.fillStyle = COLORS.ufo
  ctx.shadowColor = COLORS.ufo
  ctx.shadowBlur = 10
  ctx.font = 'bold 20px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(`HIGH SCORE: ${highScore.toString().padStart(6, '0')}`, centerX, 260)
  ctx.restore()

  // Decorative invaders with points
  renderDecorativeInvaders(ctx, centerX, 300)

  // Instructions with pulsing effect
  const instructionAlpha = 0.7 + Math.sin(animState.titlePulse * 2) * 0.3
  ctx.save()
  ctx.fillStyle = `rgba(255, 255, 255, ${instructionAlpha})`
  ctx.font = '16px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('Press SPACE or tap to start', centerX, 520)
  ctx.restore()

  ctx.fillStyle = '#666666'
  ctx.font = '14px monospace'
  ctx.fillText('Arrow keys / WASD to move', centerX, 550)

  // Version/credit
  ctx.fillStyle = '#444444'
  ctx.font = '12px monospace'
  ctx.fillText('v1.0 • Stellar Foundation', centerX, CANVAS.height - 20)
}

function renderStarfield(ctx: CanvasRenderingContext2D): void {
  for (const star of animState.stars) {
    const twinkle = 0.5 + Math.sin(star.twinklePhase) * 0.5
    const alpha = star.brightness * twinkle

    // Layer-based color (farther = bluer, closer = whiter)
    let color: string
    if (star.layer === 0) {
      color = `rgba(150, 180, 255, ${alpha * 0.6})`
    } else if (star.layer === 1) {
      color = `rgba(200, 220, 255, ${alpha * 0.8})`
    } else {
      color = `rgba(255, 255, 255, ${alpha})`
    }

    ctx.fillStyle = color

    // Add glow for brighter stars
    if (star.size > 1.5 && star.layer === 2) {
      ctx.save()
      ctx.shadowColor = '#FFFFFF'
      ctx.shadowBlur = star.size * 3
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    } else {
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function renderFloatingAliens(ctx: CanvasRenderingContext2D): void {
  for (const alien of animState.aliens) {
    const wobbleY = Math.sin(alien.wobblePhase) * 8
    const y = alien.y + wobbleY

    ctx.save()
    ctx.globalAlpha = alien.opacity

    let sprite: number[][]
    let color: string

    switch (alien.type) {
      case 'squid':
        sprite = alien.frame === 0 ? getSquidSprite() : getSquidSprite2()
        color = COLORS.invaders.squid
        break
      case 'crab':
        sprite = alien.frame === 0 ? getCrabSprite() : getCrabSprite2()
        color = COLORS.invaders.crab
        break
      case 'octopus':
        sprite = alien.frame === 0 ? getOctopusSprite() : getOctopusSprite2()
        color = COLORS.invaders.octopus
        break
    }

    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = 15

    const scale = alien.scale * 2
    const spriteWidth = sprite[0].length * scale
    const startX = alien.x - spriteWidth / 2

    for (let row = 0; row < sprite.length; row++) {
      for (let col = 0; col < sprite[row].length; col++) {
        if (sprite[row][col]) {
          ctx.fillRect(startX + col * scale, y + row * scale, scale, scale)
        }
      }
    }

    ctx.restore()
  }
}

function renderComets(ctx: CanvasRenderingContext2D): void {
  for (const comet of animState.comets) {
    const fadeIn = Math.min(1, comet.lifetime / 500)
    const fadeOut = Math.max(0, 1 - (comet.lifetime - comet.maxLifetime + 500) / 500)
    const alpha = comet.brightness * fadeIn * fadeOut

    // Comet tail
    const tailX = comet.x - Math.cos(comet.angle) * comet.length
    const tailY = comet.y - Math.sin(comet.angle) * comet.length

    const gradient = ctx.createLinearGradient(tailX, tailY, comet.x, comet.y)
    gradient.addColorStop(0, `rgba(255, 200, 100, 0)`)
    gradient.addColorStop(0.7, `rgba(255, 220, 150, ${alpha * 0.5})`)
    gradient.addColorStop(1, `rgba(255, 255, 255, ${alpha})`)

    ctx.save()
    ctx.strokeStyle = gradient
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(tailX, tailY)
    ctx.lineTo(comet.x, comet.y)
    ctx.stroke()

    // Comet head glow
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 15
    ctx.beginPath()
    ctx.arc(comet.x, comet.y, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

function renderParticles(ctx: CanvasRenderingContext2D): void {
  for (const particle of animState.particles) {
    const alpha = 1 - particle.lifetime / particle.maxLifetime
    ctx.fillStyle =
      particle.color === '#FFD700'
        ? `rgba(255, 215, 0, ${alpha})`
        : `rgba(255, 255, 255, ${alpha})`
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2)
    ctx.fill()
  }
}

// Render decorative invaders for the menu
function renderDecorativeInvaders(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number
): void {
  const invaderTypes = [
    { sprite: getSquidSprite(), color: COLORS.invaders.squid, points: '30', power: '⚡' },
    { sprite: getCrabSprite(), color: COLORS.invaders.crab, points: '20', power: '◆◆◆' },
    { sprite: getOctopusSprite(), color: COLORS.invaders.octopus, points: '10', power: '🛡' },
  ]

  let currentY = y
  const rowSpacing = 45

  for (const invader of invaderTypes) {
    ctx.save()
    ctx.fillStyle = invader.color
    ctx.shadowColor = invader.color
    ctx.shadowBlur = 12

    const scale = 2
    const spriteWidth = invader.sprite[0].length
    const startX = centerX - 80 - (spriteWidth * scale) / 2

    for (let row = 0; row < invader.sprite.length; row++) {
      for (let col = 0; col < invader.sprite[row].length; col++) {
        if (invader.sprite[row][col]) {
          ctx.fillRect(startX + col * scale, currentY + row * scale, scale, scale)
        }
      }
    }
    ctx.restore()

    // Points text
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '16px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`= ${invader.points} PTS`, centerX - 40, currentY + 12)

    currentY += rowSpacing
  }

  // UFO with mystery points
  ctx.save()
  ctx.fillStyle = COLORS.ufo
  ctx.shadowColor = COLORS.ufo
  ctx.shadowBlur = 15
  ctx.font = 'bold 18px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('?', centerX - 80, currentY + 8)
  ctx.restore()

  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'left'
  ctx.fillText('= ??? PTS', centerX - 40, currentY + 8)
}

// ========== SPRITE DATA ==========

// Frame 1 sprites
function getSquidSprite(): number[][] {
  return [
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 0, 1, 1, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0, 1, 0, 0],
    [0, 1, 0, 1, 1, 0, 1, 0],
    [1, 0, 1, 0, 0, 1, 0, 1],
  ]
}

function getCrabSprite(): number[][] {
  return [
    [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
    [0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0],
  ]
}

function getOctopusSprite(): number[][] {
  return [
    [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
  ]
}

// Frame 2 sprites (alternate animation frames)
function getSquidSprite2(): number[][] {
  return [
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 0, 1, 1, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 0, 1, 1, 0, 1, 0],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [0, 1, 0, 0, 0, 0, 1, 0],
  ]
}

function getCrabSprite2(): number[][] {
  return [
    [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
    [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  ]
}

function getOctopusSprite2(): number[][] {
  return [
    [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0],
    [0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0],
    [0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0],
  ]
}

export type { MenuScreenProps }
