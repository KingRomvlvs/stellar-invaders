'use client'

// Fire Button
// Touch-based fire button for mobile

import React, { useCallback, useState } from 'react'

interface FireButtonProps {
  onFire: () => void
  onRelease?: () => void
  size?: number
  autoFire?: boolean
}

export function FireButton({
  onFire,
  onRelease,
  size = 80,
  autoFire = false,
}: FireButtonProps) {
  const [isPressed, setIsPressed] = useState(false)

  const handlePress = useCallback(() => {
    setIsPressed(true)
    onFire()
  }, [onFire])

  const handleRelease = useCallback(() => {
    setIsPressed(false)
    onRelease?.()
  }, [onRelease])

  // Touch handlers
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      handlePress()
    },
    [handlePress]
  )

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      handleRelease()
    },
    [handleRelease]
  )

  // Mouse handlers (for testing)
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      handlePress()
    },
    [handlePress]
  )

  const onMouseUp = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      handleRelease()
    },
    [handleRelease]
  )

  const onMouseLeave = useCallback(() => {
    if (isPressed) {
      handleRelease()
    }
  }, [isPressed, handleRelease])

  return (
    <button
      type="button"
      className={`
        relative select-none touch-none rounded-full
        flex items-center justify-center
        font-bold text-white uppercase tracking-wider
        transition-all duration-100
        ${isPressed ? 'scale-95' : 'scale-100'}
      `}
      style={{
        width: size,
        height: size,
        background: isPressed
          ? 'linear-gradient(180deg, rgba(255, 100, 100, 0.6) 0%, rgba(200, 50, 50, 0.8) 100%)'
          : 'linear-gradient(180deg, rgba(255, 80, 80, 0.4) 0%, rgba(200, 50, 50, 0.6) 100%)',
        border: '2px solid rgba(255, 100, 100, 0.5)',
        boxShadow: isPressed
          ? '0 0 30px rgba(255, 100, 100, 0.6), inset 0 0 20px rgba(255, 100, 100, 0.3)'
          : '0 0 20px rgba(255, 100, 100, 0.3)',
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      <span
        style={{
          fontSize: size * 0.18,
          textShadow: '0 0 10px rgba(255, 100, 100, 0.8)',
        }}
      >
        FIRE
      </span>

      {/* Pulse effect when auto-fire is on */}
      {autoFire && (
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            background: 'rgba(255, 100, 100, 0.2)',
            animationDuration: '1.5s',
          }}
        />
      )}
    </button>
  )
}
