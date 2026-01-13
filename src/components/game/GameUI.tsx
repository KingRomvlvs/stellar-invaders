'use client'

// Game UI (HUD)
// Overlay showing score, lives, wave during gameplay

import type { GameState, PowerUpType } from '@/lib/game/types'
import { COLORS, POWERUP } from '@/lib/game/config'

interface GameUIProps {
  gameState: GameState
  highScore: number
  isBossFight: boolean
}

// Power-up display names and colors
const POWERUP_INFO: Record<
  PowerUpType,
  { name: string; color: string; bgColor: string }
> = {
  extraLife: {
    name: '+1 LIFE',
    color: '#FF6B6B',
    bgColor: 'rgba(255, 107, 107, 0.2)',
  },
  rapidFire: {
    name: 'RAPID FIRE',
    color: '#FFD700',
    bgColor: 'rgba(255, 215, 0, 0.2)',
  },
  shield: {
    name: 'SHIELD',
    color: '#00BFFF',
    bgColor: 'rgba(0, 191, 255, 0.2)',
  },
  multiShot: {
    name: 'TRIPLE SHOT',
    color: '#9932CC',
    bgColor: 'rgba(153, 50, 204, 0.2)',
  },
}

export function GameUI({ gameState, highScore, isBossFight }: GameUIProps) {
  const { score, wave, player, formation, activePowerUps, powerUpNotification } =
    gameState

  // Calculate invaders remaining
  const invadersRemaining = formation?.activeInvaders ?? 0
  const totalInvaders = formation?.totalInvaders ?? 0

  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {/* Top bar - score on left, wave in center, high score on right */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-3 sm:p-4 text-white font-light">
        {/* Left section: Lives (hearts) */}
        <div className="flex flex-col items-start gap-2">
          {/* Lives as hearts */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <HeartIcon key={i} filled={i < player.lives} />
            ))}
          </div>
        </div>

        {/* Center section: Score + Wave */}
        <div className="flex flex-col items-center">
          {/* Score */}
          <span
            className="text-2xl sm:text-4xl font-mono tabular-nums font-bold"
            style={{ color: COLORS.player }}
          >
            {score.toLocaleString()}
          </span>
          {/* Wave */}
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-xs sm:text-sm uppercase tracking-wider"
              style={{
                color: isBossFight ? COLORS.boss : 'rgba(255,255,255,0.6)',
              }}
            >
              {isBossFight ? 'BOSS' : `Wave ${wave}`}
            </span>
            {!isBossFight && totalInvaders > 0 && (
              <span className="text-xs text-white/40 tabular-nums">
                ({invadersRemaining}/{totalInvaders})
              </span>
            )}
          </div>
        </div>

        {/* Right section: High Score - with padding for pause button */}
        <div className="flex flex-col items-end pr-10 sm:pr-0">
          <span className="text-xs text-white/50 uppercase tracking-wider">
            Best
          </span>
          <span
            className="text-sm sm:text-lg font-mono tabular-nums"
            style={{ color: COLORS.ufo }}
          >
            {highScore.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Power-up notification (center of screen) */}
      {powerUpNotification && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="px-6 py-3 rounded-xl text-xl sm:text-2xl font-bold uppercase tracking-wider animate-bounce"
            style={{
              backgroundColor: POWERUP_INFO[powerUpNotification.type].bgColor,
              color: POWERUP_INFO[powerUpNotification.type].color,
              border: `2px solid ${POWERUP_INFO[powerUpNotification.type].color}`,
              boxShadow: `0 0 30px ${POWERUP_INFO[powerUpNotification.type].color}50`,
            }}
          >
            {POWERUP_INFO[powerUpNotification.type].name}
          </div>
        </div>
      )}

      {/* Bottom bar - Active power-ups with duration bars */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center items-end p-3 sm:p-4 gap-3">
        {/* Rapid Fire */}
        {activePowerUps.rapidFire > 0 && (
          <PowerUpBar
            label="Rapid"
            color="#FFD700"
            remaining={activePowerUps.rapidFire}
            total={POWERUP.effectDuration.rapidFire}
          />
        )}

        {/* Shield */}
        {activePowerUps.shield > 0 && (
          <PowerUpBar
            label="Shield"
            color="#00BFFF"
            remaining={activePowerUps.shield}
            total={POWERUP.effectDuration.shield}
          />
        )}

        {/* Multi-Shot */}
        {activePowerUps.multiShot > 0 && (
          <PowerUpBar
            label="Triple"
            color="#9932CC"
            remaining={activePowerUps.multiShot}
            total={POWERUP.effectDuration.multiShot}
          />
        )}
      </div>

      {/* Formation speed indicator (subtle) */}
      {formation && !isBossFight && (
        <div className="absolute top-1/2 right-2 transform -translate-y-1/2">
          <SpeedIndicator
            current={formation.currentStepInterval}
            max={formation.baseStepInterval}
            min={100}
          />
        </div>
      )}
    </div>
  )
}

// Heart icon component
function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? '#FF6B6B' : 'transparent'}
      stroke={filled ? '#FF6B6B' : '#333'}
      strokeWidth="2"
      className="transition-all"
      style={{
        filter: filled ? 'drop-shadow(0 0 6px #FF6B6B)' : 'none',
        opacity: filled ? 1 : 0.3,
      }}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

// Power-up duration bar component
function PowerUpBar({
  label,
  color,
  remaining,
  total,
}: {
  label: string
  color: string
  remaining: number
  total: number
}) {
  const percent = Math.max(0, Math.min(100, (remaining / total) * 100))

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="text-xs uppercase tracking-wider font-medium"
        style={{ color }}
      >
        {label}
      </span>
      <div
        className="w-16 h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
      >
        <div
          className="h-full transition-all duration-100"
          style={{
            width: `${percent}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      </div>
    </div>
  )
}

// Speed indicator showing how fast the invaders are moving
function SpeedIndicator({
  current,
  max,
  min,
}: {
  current: number
  max: number
  min: number
}) {
  // Calculate speed percentage (faster = higher percentage)
  const speedPercent = Math.round(((max - current) / (max - min)) * 100)

  // Only show if speed has increased
  if (speedPercent <= 0) return null

  // Color based on speed
  let color = '#00FF88'
  if (speedPercent > 70) color = '#FF0040'
  else if (speedPercent > 40) color = '#FFAA00'

  return (
    <div className="flex flex-col items-center gap-1 opacity-50">
      <div
        className="w-1 rounded-full overflow-hidden"
        style={{
          height: 60,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          className="w-full transition-all duration-300"
          style={{
            height: `${speedPercent}%`,
            backgroundColor: color,
            marginTop: `${100 - speedPercent}%`,
          }}
        />
      </div>
      <span className="text-[8px] text-white/40 uppercase">Spd</span>
    </div>
  )
}
