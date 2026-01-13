'use client'

// Game Canvas
// Main game component with canvas and UI overlay

import { useRef, useEffect, useState, useCallback } from 'react'
import { GameEngine } from '@/lib/game/Engine'
import { CANVAS, COLORS } from '@/lib/game/config'
import type { GameState, GameScreen } from '@/lib/game/types'
import { useSettings } from '@/contexts/SettingsContext'
import { GameUI } from './GameUI'
import { MobileControls } from './controls/MobileControls'
import { LeaderboardOverlay } from './LeaderboardOverlay'

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const engineCreatedRef = useRef(false) // Track if engine has been created

  const { settings, updateHighScore, highScore } = useSettings()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('menu')
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile device once on mount
  useEffect(() => {
    const mobile =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth < 768
    setIsMobile(mobile)
  }, [])

  // Handle canvas resize
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    const gameAspectRatio = CANVAS.width / CANVAS.height // 800/600 = 1.333
    const isMobileDevice =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth < 768

    // Leave room for mobile controls if on mobile (reduced from 140 to 100)
    const controlsSpace = isMobileDevice ? 100 : 0
    const availableHeight = containerHeight - controlsSpace

    // Use full width in portrait mode for maximum game size
    const canvasWidth = containerWidth
    const canvasHeight = containerWidth / gameAspectRatio

    // Check if calculated height fits in available space
    if (canvasHeight <= availableHeight) {
      canvas.style.width = `${canvasWidth}px`
      canvas.style.height = `${canvasHeight}px`
    } else {
      // Fit to height if width-based sizing is too tall
      canvas.style.height = `${availableHeight}px`
      canvas.style.width = `${availableHeight * gameAspectRatio}px`
    }
  }, [])

  // Use ref to track high score without causing re-renders
  const highScoreRef = useRef(highScore)
  useEffect(() => {
    highScoreRef.current = highScore
  }, [highScore])

  // Use ref for updateHighScore to avoid dependency issues
  const updateHighScoreRef = useRef(updateHighScore)
  useEffect(() => {
    updateHighScoreRef.current = updateHighScore
  }, [updateHighScore])

  // Use ref for settings to avoid engine recreation on every settings change
  const settingsRef = useRef(settings)
  useEffect(() => {
    settingsRef.current = settings
    // Update existing engine with new settings (without recreating)
    if (engineRef.current) {
      engineRef.current.updateSettings(settings)
    }
  }, [settings])

  // Initialize game engine - ONLY create ONCE
  useEffect(() => {
    // Prevent double creation (React StrictMode or settings hydration)
    if (!canvasRef.current || engineCreatedRef.current) return

    engineCreatedRef.current = true

    const engine = new GameEngine(canvasRef.current, settingsRef.current)
    engineRef.current = engine

    // Subscribe to state changes
    engine.onStateChange((state) => {
      setGameState(state)

      // Update high score if needed (use refs to avoid stale closures)
      if (state.score > highScoreRef.current) {
        updateHighScoreRef.current(state.score)
      }
    })

    // Subscribe to screen changes
    engine.onScreenChange((screen) => {
      setCurrentScreen(screen)
    })

    engine.start()

    handleResize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    return () => {
      engine.destroy()
      engineCreatedRef.current = false
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [handleResize]) // Only depends on handleResize (which is stable via useCallback)


  // Handle mobile controls
  const handleMoveLeft = useCallback((active: boolean) => {
    if (engineRef.current) {
      engineRef.current.setMoveLeft(active)
    }
  }, [])

  const handleMoveRight = useCallback((active: boolean) => {
    if (engineRef.current) {
      engineRef.current.setMoveRight(active)
    }
  }, [])

  const handleShoot = useCallback((active: boolean) => {
    if (engineRef.current) {
      engineRef.current.setShoot(active)
    }
  }, [])

  const handlePause = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.togglePause()
    }
  }, [])

  const handleGoToMenu = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.navigateTo('menu')
    }
  }, [])

  const handlePlayAgain = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.startGame()
    }
  }, [])

  // Determine if we should show mobile controls
  const showMobileControls =
    isMobile &&
    (currentScreen === 'playing' || currentScreen === 'bossFight')

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: COLORS.background }}
    >
      <div className="relative flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={CANVAS.width}
          height={CANVAS.height}
          className="block touch-none"
          style={{
            imageRendering: 'pixelated',
          }}
        />
      </div>

      {/* HUD Overlay */}
      {gameState &&
        (currentScreen === 'playing' || currentScreen === 'bossFight') && (
          <GameUI
            gameState={gameState}
            highScore={highScore}
            isBossFight={currentScreen === 'bossFight'}
          />
        )}

      {/* Mobile Controls */}
      <MobileControls
        onMoveLeft={handleMoveLeft}
        onMoveRight={handleMoveRight}
        onShoot={handleShoot}
        visible={showMobileControls}
      />

      {/* Pause button for mobile */}
      {isMobile &&
        (currentScreen === 'playing' || currentScreen === 'bossFight') &&
        !gameState?.isPaused && (
          <button
            onClick={handlePause}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/30 flex items-center justify-center active:bg-white/30 transition-colors"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="white"
            >
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          </button>
        )}

      {/* Pause overlay */}
      {gameState?.isPaused &&
        (currentScreen === 'playing' || currentScreen === 'bossFight') && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40">
            <div className="text-center">
              <div
                className="text-4xl font-bold mb-4"
                style={{ color: COLORS.player }}
              >
                PAUSED
              </div>
              <div className="text-white/60 text-sm mb-6">
                {isMobile ? 'Tap to resume' : 'Press ESC or P to resume'}
              </div>
              {isMobile && (
                <button
                  onClick={handlePause}
                  className="px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/30 text-white font-medium uppercase tracking-wider active:bg-white/30 transition-colors"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  Resume
                </button>
              )}
            </div>
          </div>
        )}

      {/* Leaderboard overlay for game over */}
      <LeaderboardOverlay
        visible={currentScreen === 'gameOver'}
        score={gameState?.score ?? 0}
        wave={gameState?.wave ?? 1}
        onClose={handleGoToMenu}
        onPlayAgain={handlePlayAgain}
      />
    </div>
  )
}
