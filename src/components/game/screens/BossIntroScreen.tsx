'use client'

// Boss Intro Screen
// Warning screen before boss fight

import { CANVAS, COLORS } from '@/lib/game/config'

interface BossIntroScreenProps {
  ctx: CanvasRenderingContext2D
  wave: number
  progress: number // 0 to 1
}

export function renderBossIntroScreen({
  ctx,
  wave,
  progress,
}: BossIntroScreenProps): void {
  const centerX = CANVAS.width / 2
  const centerY = CANVAS.height / 2

  // Background with red tint
  ctx.fillStyle = COLORS.background
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height)

  // Red overlay flash
  const flashIntensity = Math.sin(progress * Math.PI * 6) * 0.1
  ctx.fillStyle = `rgba(255, 0, 0, ${Math.max(0, flashIntensity)})`
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height)

  // Calculate animation
  const pulse = 1 + Math.sin(progress * Math.PI * 4) * 0.1
  const shake = Math.sin(progress * Math.PI * 20) * (1 - progress) * 5

  ctx.save()
  ctx.translate(centerX + shake, centerY - 60)
  ctx.scale(pulse, pulse)

  // Warning text
  ctx.fillStyle = COLORS.boss
  ctx.shadowColor = COLORS.boss
  ctx.shadowBlur = 50
  ctx.font = 'bold 48px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('WARNING', 0, 0)

  ctx.restore()

  // Boss incoming text
  ctx.fillStyle = '#FFFFFF'
  ctx.shadowColor = '#FFFFFF'
  ctx.shadowBlur = 20
  ctx.font = 'bold 32px monospace'
  ctx.fillText('BOSS INCOMING', centerX, centerY + 20)
  ctx.shadowBlur = 0

  // Boss wave number
  ctx.fillStyle = '#888888'
  ctx.font = '18px monospace'
  ctx.fillText(`Wave ${wave} Boss`, centerX, centerY + 60)

  // Animated warning symbols
  const symbolAlpha = (Math.sin(progress * Math.PI * 8) + 1) / 2
  ctx.globalAlpha = symbolAlpha
  ctx.fillStyle = COLORS.boss
  ctx.font = 'bold 36px monospace'
  ctx.fillText('⚠', centerX - 150, centerY - 50)
  ctx.fillText('⚠', centerX + 150, centerY - 50)
  ctx.globalAlpha = 1

  // Loading bar
  const barWidth = 300
  const barHeight = 8
  const barX = centerX - barWidth / 2
  const barY = centerY + 120

  ctx.fillStyle = '#333333'
  ctx.fillRect(barX, barY, barWidth, barHeight)

  // Animated loading fill
  ctx.fillStyle = COLORS.boss
  const fillWidth = barWidth * progress
  ctx.fillRect(barX, barY, fillWidth, barHeight)

  // Glow effect on bar
  ctx.shadowColor = COLORS.boss
  ctx.shadowBlur = 10
  ctx.fillRect(barX + fillWidth - 10, barY, 10, barHeight)
  ctx.shadowBlur = 0

  // Tip
  ctx.fillStyle = '#666666'
  ctx.font = '14px monospace'
  ctx.fillText('Watch for attack telegraphs!', centerX, CANVAS.height - 100)
}

export type { BossIntroScreenProps }
