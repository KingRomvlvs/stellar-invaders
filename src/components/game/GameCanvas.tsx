'use client'

// Game Canvas
// Main game component with canvas and UI overlay

import { useRef, useEffect, useState, useCallback } from 'react'
import { GameEngine } from '@/lib/game/Engine'
import { CANVAS, COLORS } from '@/lib/game/config'
import type { GameState, GameScreen, GameSettings } from '@/lib/game/types'
import { useSettings } from '@/contexts/SettingsContext'
import { GameUI } from './GameUI'
import { VirtualJoystick } from './controls/VirtualJoystick'
import { FireButton } from './controls/FireButton'

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<GameEngine | null>(null)

  const { settings, updateHighScore, highScore } = useSettings()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('menu')
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        'ontouchstart' in window ||
          navigator.maxTouchPoints > 0 ||
          window.innerWidth < 768
      )
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle canvas resize
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    const gameAspectRatio = CANVAS.width / CANVAS.height

    let canvasWidth: number
    let canvasHeight: number

    if (containerWidth / containerHeight > gameAspectRatio) {
      canvasHeight = containerHeight
      canvasWidth = containerHeight * gameAspectRatio
    } else {
      canvasWidth = containerWidth
      canvasHeight = containerWidth / gameAspectRatio
    }

    canvas.style.width = `${canvasWidth}px`
    canvas.style.height = `${canvasHeight}px`
  }, [])

  // Initialize game engine
  useEffect(() => {
    if (!canvasRef.current) return

    const engine = new GameEngine(canvasRef.current, settings)
    engineRef.current = engine

    // Subscribe to state changes
    engine.onStateChange((state) => {
      setGameState(state)

      // Update high score if needed
      if (state.score > highScore) {
        updateHighScore(state.score)
      }
    })

    // Subscribe to screen changes
    engine.onScreenChange((screen) => {
      setCurrentScreen(screen)
    })

    engine.start()

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      engine.destroy()
      window.removeEventListener('resize', handleResize)
    }
  }, [handleResize, settings, highScore, updateHighScore])

  // Update engine settings when they change
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateSettings(settings)
    }
  }, [settings])

  // Handle virtual joystick input
  const handleJoystickMove = useCallback(
    (delta: { x: number; y: number } | null) => {
      if (engineRef.current) {
        engineRef.current.setJoystickDelta(delta)
      }
    },
    []
  )

  // Handle fire button
  const handleFire = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.triggerShoot()
    }
  }, [])

  // Determine if we should show mobile controls
  const showMobileControls =
    isMobile &&
    settings.controlScheme === 'joystick' &&
    (currentScreen === 'playing' || currentScreen === 'bossFight')

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: COLORS.background }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS.width}
        height={CANVAS.height}
        className="block touch-none"
        style={{
          imageRendering: 'pixelated',
        }}
      />

      {/* HUD Overlay */}
      {gameState &&
        (currentScreen === 'playing' || currentScreen === 'bossFight') && (
          <GameUI
            gameState={gameState}
            highScore={highScore}
            isBossFight={currentScreen === 'bossFight'}
          />
        )}

      {/* Mobile Controls - Joystick Mode */}
      {showMobileControls && (
        <>
          <div className="absolute left-4 bottom-4 z-10">
            <VirtualJoystick onMove={handleJoystickMove} size={100} />
          </div>
          <div className="absolute right-4 bottom-4 z-10">
            <FireButton
              onFire={handleFire}
              size={70}
              autoFire={settings.autoFireMobile}
            />
          </div>
        </>
      )}

      {/* Mobile touch hint for drag mode */}
      {isMobile &&
        settings.controlScheme === 'drag' &&
        currentScreen === 'playing' &&
        gameState?.wave === 1 && (
          <div className="absolute bottom-20 left-0 right-0 text-center text-white/50 text-sm pointer-events-none">
            Drag left side to move • Tap right side to fire
          </div>
        )}

      {/* Pause indicator */}
      {gameState?.isPaused && currentScreen === 'playing' && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center">
            <div
              className="text-4xl font-bold mb-4"
              style={{ color: COLORS.player }}
            >
              PAUSED
            </div>
            <div className="text-white/60 text-sm">
              Press ESC or P to resume
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
