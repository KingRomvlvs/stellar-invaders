'use client'

// Wave Intro Screen
// Brief "Wave X" display before gameplay resumes

import { CANVAS, COLORS } from '@/lib/game/config'

interface WaveIntroScreenProps {
  ctx: CanvasRenderingContext2D
  wave: number
  progress: number // 0 to 1
}

export function renderWaveIntroScreen({
  ctx,
  wave,
  progress,
}: WaveIntroScreenProps): void {
  const centerX = CANVAS.width / 2
  const centerY = CANVAS.height / 2

  // Background with fade
  ctx.fillStyle = COLORS.background
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height)

  // Calculate animation values
  const fadeIn = Math.min(progress * 3, 1) // Fade in during first third
  const fadeOut = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1 // Fade out in last third
  const alpha = fadeIn * fadeOut

  // Scale effect
  const scale = 0.8 + progress * 0.4

  ctx.globalAlpha = alpha

  // Wave number with glow
  ctx.save()
  ctx.translate(centerX, centerY - 40)
  ctx.scale(scale, scale)

  ctx.fillStyle = COLORS.player
  ctx.shadowColor = COLORS.player
  ctx.shadowBlur = 40
  ctx.font = 'bold 72px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(`WAVE ${wave}`, 0, 0)

  ctx.shadowBlur = 0
  ctx.restore()

  // Subtitle
  ctx.fillStyle = '#AAAAAA'
  ctx.font = '18px monospace'
  ctx.textAlign = 'center'

  if (wave === 1) {
    ctx.fillText('Get ready!', centerX, centerY + 40)
  } else if (wave % 5 === 0) {
    ctx.fillText('Boss wave incoming!', centerX, centerY + 40)
  } else {
    const messages = [
      'Here they come!',
      'Stay sharp!',
      'Watch the flanks!',
      'Keep moving!',
    ]
    ctx.fillText(messages[(wave - 1) % messages.length], centerX, centerY + 40)
  }

  // Progress bar
  const barWidth = 200
  const barHeight = 4
  const barX = centerX - barWidth / 2
  const barY = centerY + 80

  ctx.fillStyle = '#333333'
  ctx.fillRect(barX, barY, barWidth, barHeight)

  ctx.fillStyle = COLORS.player
  ctx.fillRect(barX, barY, barWidth * progress, barHeight)

  ctx.globalAlpha = 1
}

export type { WaveIntroScreenProps }
