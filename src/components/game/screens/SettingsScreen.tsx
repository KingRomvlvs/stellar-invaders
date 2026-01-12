'use client'

// Settings Screen
// Toggle sound, motion, and control options

import { CANVAS, COLORS } from '@/lib/game/config'
import type { GameSettings } from '@/lib/game/types'

interface SettingsScreenProps {
  ctx: CanvasRenderingContext2D
  settings: GameSettings
  selectedIndex: number
}

interface SettingOption {
  key: keyof GameSettings
  label: string
  getValue: (settings: GameSettings) => string
}

const settingOptions: SettingOption[] = [
  {
    key: 'soundEnabled',
    label: 'Sound Effects',
    getValue: (s) => (s.soundEnabled ? 'ON' : 'OFF'),
  },
  {
    key: 'reducedMotion',
    label: 'Reduced Motion',
    getValue: (s) => (s.reducedMotion ? 'ON' : 'OFF'),
  },
  {
    key: 'autoFireMobile',
    label: 'Auto-Fire (Mobile)',
    getValue: (s) => (s.autoFireMobile ? 'ON' : 'OFF'),
  },
  {
    key: 'controlScheme',
    label: 'Mobile Controls',
    getValue: (s) => s.controlScheme.toUpperCase(),
  },
]

export function renderSettingsScreen({
  ctx,
  settings,
  selectedIndex,
}: SettingsScreenProps): void {
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
  ctx.fillText('SETTINGS', centerX, 80)
  ctx.shadowBlur = 0

  // Settings options
  const startY = 180
  const rowHeight = 60

  settingOptions.forEach((option, i) => {
    const y = startY + i * rowHeight
    const isSelected = i === selectedIndex

    // Selection highlight
    if (isSelected) {
      ctx.fillStyle = 'rgba(0, 255, 136, 0.1)'
      ctx.fillRect(centerX - 200, y - 20, 400, 45)

      // Selection indicator
      ctx.fillStyle = COLORS.player
      ctx.font = 'bold 20px monospace'
      ctx.textAlign = 'right'
      ctx.fillText('▶', centerX - 190, y + 8)
    }

    // Label
    ctx.fillStyle = isSelected ? '#FFFFFF' : '#888888'
    ctx.font = isSelected ? 'bold 18px monospace' : '18px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(option.label, centerX - 170, y + 5)

    // Value
    const value = option.getValue(settings)
    ctx.fillStyle = isSelected ? COLORS.player : '#AAAAAA'
    ctx.textAlign = 'right'
    ctx.fillText(value, centerX + 180, y + 5)

    // Value indicator arrows for selected
    if (isSelected) {
      ctx.fillStyle = COLORS.player
      ctx.font = '16px monospace'
      ctx.fillText('◀', centerX + 90, y + 5)
      ctx.textAlign = 'left'
      ctx.fillText('▶', centerX + 190, y + 5)
    }
  })

  // Control hints
  ctx.fillStyle = '#666666'
  ctx.font = '14px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('↑↓ to select, ←→ to change', centerX, 480)
  ctx.fillText('Press ESC or tap outside to go back', centerX, 510)

  // Description for selected option
  const descriptions: Record<keyof GameSettings, string> = {
    soundEnabled: 'Toggle retro sound effects',
    reducedMotion: 'Reduce visual effects and animations',
    autoFireMobile: 'Automatically fire on mobile devices',
    controlScheme: 'Choose between drag or joystick controls',
  }

  const selectedOption = settingOptions[selectedIndex]
  if (selectedOption) {
    ctx.fillStyle = '#888888'
    ctx.font = '12px monospace'
    ctx.fillText(descriptions[selectedOption.key], centerX, 550)
  }
}

export function getSettingOptions(): SettingOption[] {
  return settingOptions
}

export type { SettingsScreenProps, SettingOption }
