'use client'

import { useEffect, useRef, useCallback } from 'react'

interface MobileControlsProps {
  onMoveLeft: (active: boolean) => void
  onMoveRight: (active: boolean) => void
  onShoot: (active: boolean) => void
  visible: boolean
}

export function MobileControls({
  onMoveLeft,
  onMoveRight,
  onShoot,
  visible,
}: MobileControlsProps) {
  const leftButtonRef = useRef<HTMLButtonElement>(null)
  const rightButtonRef = useRef<HTMLButtonElement>(null)
  const fireButtonRef = useRef<HTMLButtonElement>(null)
  const activeMovementRef = useRef<'left' | 'right' | null>(null)
  const movementTouchIdRef = useRef<number | null>(null)
  const fireTouchIdRef = useRef<number | null>(null)

  // Check which movement button a touch point is over
  const getMovementButtonAt = useCallback(
    (clientX: number, clientY: number): 'left' | 'right' | null => {
      const leftRect = leftButtonRef.current?.getBoundingClientRect()
      const rightRect = rightButtonRef.current?.getBoundingClientRect()

      if (
        leftRect &&
        clientX >= leftRect.left &&
        clientX <= leftRect.right &&
        clientY >= leftRect.top &&
        clientY <= leftRect.bottom
      ) {
        return 'left'
      }

      if (
        rightRect &&
        clientX >= rightRect.left &&
        clientX <= rightRect.right &&
        clientY >= rightRect.top &&
        clientY <= rightRect.bottom
      ) {
        return 'right'
      }

      return null
    },
    []
  )

  // Update movement state
  const updateMovement = useCallback(
    (direction: 'left' | 'right' | null) => {
      if (activeMovementRef.current === direction) return

      // Clear previous direction
      if (activeMovementRef.current === 'left') {
        onMoveLeft(false)
      } else if (activeMovementRef.current === 'right') {
        onMoveRight(false)
      }

      // Set new direction
      activeMovementRef.current = direction
      if (direction === 'left') {
        onMoveLeft(true)
      } else if (direction === 'right') {
        onMoveRight(true)
      }
    },
    [onMoveLeft, onMoveRight]
  )

  // Handle touch start on the movement area
  const handleMovementTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()

      const touch = e.changedTouches[0]
      if (!touch) return

      // Only track one movement touch at a time
      if (movementTouchIdRef.current !== null) return

      movementTouchIdRef.current = touch.identifier
      const direction = getMovementButtonAt(touch.clientX, touch.clientY)
      updateMovement(direction)
    },
    [getMovementButtonAt, updateMovement]
  )

  // Handle touch move - allows sliding between buttons
  const handleMovementTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()

      // Find our tracked touch
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i]
        if (touch.identifier === movementTouchIdRef.current) {
          const direction = getMovementButtonAt(touch.clientX, touch.clientY)
          updateMovement(direction)
          break
        }
      }
    },
    [getMovementButtonAt, updateMovement]
  )

  // Handle touch end
  const handleMovementTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()

      // Check if our tracked touch ended
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i]
        if (touch.identifier === movementTouchIdRef.current) {
          movementTouchIdRef.current = null
          updateMovement(null)
          break
        }
      }
    },
    [updateMovement]
  )

  // Handle fire button touch
  const handleFireTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()

      const touch = e.changedTouches[0]
      if (!touch) return

      if (fireTouchIdRef.current !== null) return

      fireTouchIdRef.current = touch.identifier
      onShoot(true)
    },
    [onShoot]
  )

  const handleFireTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i]
        if (touch.identifier === fireTouchIdRef.current) {
          fireTouchIdRef.current = null
          onShoot(false)
          break
        }
      }
    },
    [onShoot]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      onMoveLeft(false)
      onMoveRight(false)
      onShoot(false)
    }
  }, [onMoveLeft, onMoveRight, onShoot])

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-50 pb-safe">
      <div className="flex justify-between items-end px-3 py-2 max-w-3xl mx-auto">
        {/* Left side - Movement buttons */}
        <div
          className="pointer-events-auto select-none touch-none flex gap-1"
          onTouchStart={handleMovementTouchStart}
          onTouchMove={handleMovementTouchMove}
          onTouchEnd={handleMovementTouchEnd}
          onTouchCancel={handleMovementTouchEnd}
        >
          {/* Left button */}
          <button
            ref={leftButtonRef}
            className={`
              w-16 h-16 rounded-xl
              bg-white/10 backdrop-blur-sm
              border-2 border-white/30
              flex items-center justify-center
              active:bg-white/30 active:scale-95
              transition-transform
              select-none touch-none
            `}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Right button */}
          <button
            ref={rightButtonRef}
            className={`
              w-16 h-16 rounded-xl
              bg-white/10 backdrop-blur-sm
              border-2 border-white/30
              flex items-center justify-center
              active:bg-white/30 active:scale-95
              transition-transform
              select-none touch-none
            `}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Right side - Fire button */}
        <button
          ref={fireButtonRef}
          className={`
            pointer-events-auto
            w-18 h-18 rounded-full
            bg-red-500/80 backdrop-blur-sm
            border-3 border-red-300/50
            flex items-center justify-center
            active:bg-red-400 active:scale-95
            transition-transform
            select-none touch-none
            shadow-lg shadow-red-500/30
          `}
          style={{
            WebkitTapHighlightColor: 'transparent',
            width: '72px',
            height: '72px',
          }}
          onTouchStart={handleFireTouchStart}
          onTouchEnd={handleFireTouchEnd}
          onTouchCancel={handleFireTouchEnd}
        >
          <span className="text-white font-bold text-sm tracking-wider">
            FIRE
          </span>
        </button>
      </div>
    </div>
  )
}
