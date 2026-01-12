'use client'

// How To Play Screen
// Control instructions for desktop and mobile

import { CANVAS, COLORS } from '@/lib/game/config'

interface HowToScreenProps {
  ctx: CanvasRenderingContext2D
  isMobile: boolean
}

export function renderHowToScreen({ ctx, isMobile }: HowToScreenProps): void {
  const centerX = CANVAS.width / 2

  // Background
  ctx.fillStyle = COLORS.background
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height)

  // Title
  ctx.fillStyle = COLORS.player
  ctx.shadowColor = COLORS.player
  ctx.shadowBlur = 20
  ctx.font = 'bold 36px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('HOW TO PLAY', centerX, 80)
  ctx.shadowBlur = 0

  // Objective
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('OBJECTIVE', centerX, 140)

  ctx.fillStyle = '#AAAAAA'
  ctx.font = '14px monospace'
  ctx.fillText('Destroy all invaders before they reach the bottom!', centerX, 165)
  ctx.fillText('Use bunkers for cover - they degrade over time.', centerX, 185)

  // Controls section
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('CONTROLS', centerX, 240)

  if (isMobile) {
    renderMobileControls(ctx, centerX)
  } else {
    renderDesktopControls(ctx, centerX)
  }

  // Tips
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 18px monospace'
  ctx.fillText('TIPS', centerX, 440)

  ctx.fillStyle = '#AAAAAA'
  ctx.font = '14px monospace'
  const tips = [
    'Invaders speed up as you destroy them',
    'Boss appears every 5 waves - watch for telegraphs!',
    'Mystery UFO gives bonus points',
    'Asteroids can split or explode - be careful!',
  ]

  tips.forEach((tip, i) => {
    ctx.fillText(`• ${tip}`, centerX, 470 + i * 22)
  })

  // Back hint
  ctx.fillStyle = '#666666'
  ctx.font = '14px monospace'
  ctx.fillText('Press ESC or tap to go back', centerX, 580)
}

function renderDesktopControls(
  ctx: CanvasRenderingContext2D,
  centerX: number
): void {
  const controls = [
    { key: '← → or A D', action: 'Move ship' },
    { key: 'SPACE or Click', action: 'Fire' },
    { key: 'Mouse', action: 'Aim (ship follows)' },
    { key: 'ESC or P', action: 'Pause' },
  ]

  ctx.fillStyle = '#AAAAAA'
  ctx.font = '14px monospace'

  controls.forEach((control, i) => {
    const y = 275 + i * 35

    // Key box
    ctx.fillStyle = COLORS.invaders.crab
    ctx.fillRect(centerX - 180, y - 12, 140, 24)

    ctx.fillStyle = '#000000'
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(control.key, centerX - 110, y + 4)

    // Action
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '14px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(control.action, centerX - 20, y + 4)
  })

  ctx.textAlign = 'center'
}

function renderMobileControls(
  ctx: CanvasRenderingContext2D,
  centerX: number
): void {
  ctx.fillStyle = '#AAAAAA'
  ctx.font = '14px monospace'

  // Drag mode
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 14px monospace'
  ctx.fillText('DRAG MODE (Default)', centerX, 280)

  ctx.fillStyle = '#AAAAAA'
  ctx.font = '14px monospace'
  ctx.fillText('Left side: Drag to move', centerX, 305)
  ctx.fillText('Right side: Tap to fire', centerX, 325)

  // Joystick mode
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 14px monospace'
  ctx.fillText('JOYSTICK MODE', centerX, 365)

  ctx.fillStyle = '#AAAAAA'
  ctx.font = '14px monospace'
  ctx.fillText('Virtual joystick on left', centerX, 390)
  ctx.fillText('Fire button on right', centerX, 410)

  ctx.fillStyle = '#888888'
  ctx.font = '12px monospace'
  ctx.fillText('(Change in Settings)', centerX, 435)
}

export type { HowToScreenProps }
