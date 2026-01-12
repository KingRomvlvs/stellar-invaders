'use client'

// Menu Screen
// Title screen with high score and navigation buttons

import { CANVAS, COLORS } from '@/lib/game/config'

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
  onStart,
  onHowTo,
  onSettings,
}: MenuScreenProps): void {
  const centerX = CANVAS.width / 2

  // Background
  ctx.fillStyle = COLORS.background
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height)

  // Title with glow
  ctx.save()
  ctx.fillStyle = COLORS.player
  ctx.shadowColor = COLORS.player
  ctx.shadowBlur = 30
  ctx.font = 'bold 48px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('STELLAR', centerX, 120)
  ctx.fillText('INVADERS', centerX, 175)
  ctx.restore()

  // Subtitle
  ctx.fillStyle = '#888888'
  ctx.font = '16px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('A Space Invaders Tribute', centerX, 210)

  // High score
  ctx.fillStyle = COLORS.ufo
  ctx.font = 'bold 20px monospace'
  ctx.fillText(`HIGH SCORE: ${highScore.toString().padStart(6, '0')}`, centerX, 280)

  // Decorative invaders
  renderDecorativeInvaders(ctx, centerX, 340)

  // Instructions hint
  ctx.fillStyle = '#666666'
  ctx.font = '14px monospace'
  ctx.fillText('Press SPACE or tap to start', centerX, 480)
  ctx.fillText('Arrow keys / WASD to move', centerX, 510)
}

// Render decorative invaders for the menu
function renderDecorativeInvaders(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number
): void {
  const invaderTypes = [
    { sprite: getSquidSprite(), color: COLORS.invaders.squid, points: '30' },
    { sprite: getCrabSprite(), color: COLORS.invaders.crab, points: '20' },
    { sprite: getOctopusSprite(), color: COLORS.invaders.octopus, points: '10' },
  ]

  let currentY = y

  for (const invader of invaderTypes) {
    // Draw invader
    ctx.fillStyle = invader.color
    ctx.shadowColor = invader.color
    ctx.shadowBlur = 8

    const scale = 2
    const spriteWidth = invader.sprite[0].length
    const startX = centerX - 80 - (spriteWidth * scale) / 2

    for (let row = 0; row < invader.sprite.length; row++) {
      for (let col = 0; col < invader.sprite[row].length; col++) {
        if (invader.sprite[row][col]) {
          ctx.fillRect(
            startX + col * scale,
            currentY + row * scale,
            scale,
            scale
          )
        }
      }
    }

    ctx.shadowBlur = 0

    // Draw points
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '16px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`= ${invader.points} PTS`, centerX - 40, currentY + 12)

    currentY += 40
  }

  // UFO
  ctx.fillStyle = COLORS.ufo
  ctx.shadowColor = COLORS.ufo
  ctx.shadowBlur = 8
  ctx.font = 'bold 16px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('?', centerX - 80, currentY + 8)
  ctx.shadowBlur = 0
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'left'
  ctx.fillText('= ??? PTS', centerX - 40, currentY + 8)
}

// Simple sprite data for menu display
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

export type { MenuScreenProps }
