'use client'

// Game UI (HUD)
// Overlay showing score, lives, wave during gameplay

import type { GameState } from '@/lib/game/types'
import { COLORS } from '@/lib/game/config'

interface GameUIProps {
  gameState: GameState
  highScore: number
  isBossFight: boolean
}

export function GameUI({ gameState, highScore, isBossFight }: GameUIProps) {
  const { score, wave, player, formation, activePowerUps } = gameState

  // Calculate invaders remaining
  const invadersRemaining = formation?.activeInvaders ?? 0
  const totalInvaders = formation?.totalInvaders ?? 0

  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-3 sm:p-4 text-white font-light">
        {/* Left section: Score + Lives */}
        <div className="flex flex-col items-start gap-2">
          {/* Score */}
          <div className="flex flex-col items-start">
            <span className="text-xs sm:text-sm text-white/60 uppercase tracking-wider">
              Score
            </span>
            <span
              className="text-xl sm:text-3xl font-mono tabular-nums"
              style={{ color: COLORS.player }}
            >
              {score.toString().padStart(6, '0')}
            </span>
          </div>

          {/* Lives */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-opacity ${
                  i < player.lives ? 'opacity-100' : 'opacity-20'
                }`}
                style={{
                  backgroundColor: i < player.lives ? COLORS.player : '#333',
                  boxShadow:
                    i < player.lives ? `0 0 8px ${COLORS.player}` : 'none',
                  clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Center section: Wave */}
        <div className="flex flex-col items-center">
          <span
            className="text-xs sm:text-sm uppercase tracking-wider"
            style={{ color: isBossFight ? COLORS.boss : 'rgba(255,255,255,0.6)' }}
          >
            {isBossFight ? '⚠ BOSS' : 'Wave'}
          </span>
          <span
            className="text-xl sm:text-2xl font-mono"
            style={{ color: isBossFight ? COLORS.boss : 'white' }}
          >
            {wave}
          </span>
          {!isBossFight && totalInvaders > 0 && (
            <span className="text-xs text-white/40 tabular-nums">
              {invadersRemaining}/{totalInvaders}
            </span>
          )}
        </div>

        {/* Right section: High Score */}
        <div className="flex flex-col items-end">
          <span className="text-xs sm:text-sm text-white/60 uppercase tracking-wider">
            Best
          </span>
          <span
            className="text-lg sm:text-xl font-mono tabular-nums"
            style={{ color: COLORS.ufo }}
          >
            {highScore.toString().padStart(6, '0')}
          </span>
        </div>
      </div>

      {/* Bottom bar - Status indicators and active power-ups */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between items-end p-3 sm:p-4">
        {/* Active Power-ups */}
        <div className="flex items-center gap-2">
          {activePowerUps.rapidFire > 0 && (
            <div
              className="px-2 py-1 rounded text-xs uppercase tracking-wider"
              style={{
                backgroundColor: 'rgba(255, 200, 0, 0.2)',
                color: '#FFC800',
                border: '1px solid rgba(255, 200, 0, 0.5)',
              }}
            >
              Rapid Fire
            </div>
          )}
          {activePowerUps.shield > 0 && (
            <div
              className="px-2 py-1 rounded text-xs uppercase tracking-wider"
              style={{
                backgroundColor: 'rgba(0, 255, 136, 0.2)',
                color: COLORS.player,
                border: `1px solid ${COLORS.player}`,
              }}
            >
              Shield
            </div>
          )}
          {activePowerUps.multiShot > 0 && (
            <div
              className="px-2 py-1 rounded text-xs uppercase tracking-wider"
              style={{
                backgroundColor: 'rgba(255, 0, 200, 0.2)',
                color: '#FF00C8',
                border: '1px solid rgba(255, 0, 200, 0.5)',
              }}
            >
              Multi-Shot
            </div>
          )}
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-3">
          {/* Invincibility indicator */}
          {player.isInvincible && (
            <div
              className="px-2 py-1 rounded text-xs uppercase tracking-wider animate-pulse"
              style={{
                backgroundColor: 'rgba(0, 255, 136, 0.2)',
                color: COLORS.player,
                border: `1px solid ${COLORS.player}`,
              }}
            >
              Shield
            </div>
          )}

          {/* Respawn indicator */}
          {player.isRespawning && (
            <div
              className="px-2 py-1 rounded text-xs uppercase tracking-wider animate-pulse"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              Respawning...
            </div>
          )}
        </div>
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
