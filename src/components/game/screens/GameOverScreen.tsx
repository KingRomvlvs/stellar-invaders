'use client'

// Game Over Screen
// Final score, stats, and replay options

import { CANVAS, COLORS } from '@/lib/game/config'

interface GameStats {
  score: number
  highScore: number
  wave: number
  invadersDestroyed: number
  accuracy: number // 0 to 1
  isNewHighScore: boolean
}

interface GameOverScreenProps {
  ctx: CanvasRenderingContext2D
  stats: GameStats
  elapsedTime: number // For animations
}

export function renderGameOverScreen({
  ctx,
  stats,
  elapsedTime,
}: GameOverScreenProps): void {
  const centerX = CANVAS.width / 2

  // Background
  ctx.fillStyle = COLORS.background
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height)

  // Game Over text with animation
  const titlePulse = 1 + Math.sin(elapsedTime / 500) * 0.05
  ctx.save()
  ctx.translate(centerX, 100)
  ctx.scale(titlePulse, titlePulse)

  ctx.fillStyle = COLORS.boss
  ctx.shadowColor = COLORS.boss
  ctx.shadowBlur = 30
  ctx.font = 'bold 48px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('GAME OVER', 0, 0)

  ctx.restore()
  ctx.shadowBlur = 0

  // New high score celebration
  if (stats.isNewHighScore) {
    const celebrationAlpha = (Math.sin(elapsedTime / 200) + 1) / 2
    ctx.globalAlpha = 0.5 + celebrationAlpha * 0.5
    ctx.fillStyle = COLORS.ufo
    ctx.font = 'bold 24px monospace'
    ctx.fillText('★ NEW HIGH SCORE! ★', centerX, 160)
    ctx.globalAlpha = 1
  }

  // Score display
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 36px monospace'
  ctx.fillText(stats.score.toString().padStart(6, '0'), centerX, 220)

  ctx.fillStyle = '#888888'
  ctx.font = '16px monospace'
  ctx.fillText('SCORE', centerX, 245)

  // Stats box
  const boxX = centerX - 150
  const boxY = 280
  const boxWidth = 300
  const boxHeight = 180

  ctx.strokeStyle = '#333333'
  ctx.lineWidth = 2
  ctx.strokeRect(boxX, boxY, boxWidth, boxHeight)

  // Stats
  const statsList = [
    { label: 'Wave Reached', value: stats.wave.toString() },
    { label: 'Invaders Destroyed', value: stats.invadersDestroyed.toString() },
    { label: 'Accuracy', value: `${Math.round(stats.accuracy * 100)}%` },
    { label: 'High Score', value: stats.highScore.toString().padStart(6, '0') },
  ]

  statsList.forEach((stat, i) => {
    const y = boxY + 35 + i * 38

    ctx.fillStyle = '#888888'
    ctx.font = '14px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(stat.label, boxX + 20, y)

    ctx.fillStyle = COLORS.player
    ctx.font = 'bold 16px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(stat.value, boxX + boxWidth - 20, y)
  })

  // Play again hint
  const hintAlpha = (Math.sin(elapsedTime / 400) + 1) / 2
  ctx.globalAlpha = 0.5 + hintAlpha * 0.5
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '18px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('Press SPACE or tap to play again', centerX, 520)
  ctx.globalAlpha = 1

  // Menu hint
  ctx.fillStyle = '#666666'
  ctx.font = '14px monospace'
  ctx.fillText('Press ESC for menu', centerX, 560)
}

// Helper to create stats object
export function createGameStats(
  score: number,
  highScore: number,
  wave: number,
  invadersDestroyed: number,
  shotsFired: number,
  shotsHit: number
): GameStats {
  return {
    score,
    highScore: Math.max(score, highScore),
    wave,
    invadersDestroyed,
    accuracy: shotsFired > 0 ? shotsHit / shotsFired : 0,
    isNewHighScore: score > highScore,
  }
}

export type { GameOverScreenProps, GameStats }
