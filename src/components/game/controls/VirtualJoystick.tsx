'use client'

// Virtual Joystick
// Touch-based joystick control for mobile

import React, { useRef, useCallback, useEffect } from 'react'

interface VirtualJoystickProps {
  onMove: (delta: { x: number; y: number } | null) => void
  size?: number
  deadzone?: number
}

export function VirtualJoystick({
  onMove,
  size = 120,
  deadzone = 10,
}: VirtualJoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const centerRef = useRef({ x: 0, y: 0 })

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return

      isDragging.current = true
      const rect = containerRef.current.getBoundingClientRect()
      centerRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      }
    },
    []
  )

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging.current || !knobRef.current) return

      const dx = clientX - centerRef.current.x
      const dy = clientY - centerRef.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const maxDistance = size / 2 - 20

      // Apply deadzone
      if (distance < deadzone) {
        knobRef.current.style.transform = 'translate(-50%, -50%)'
        onMove(null)
        return
      }

      // Clamp to circle
      const clampedDistance = Math.min(distance, maxDistance)
      const angle = Math.atan2(dy, dx)
      const clampedX = Math.cos(angle) * clampedDistance
      const clampedY = Math.sin(angle) * clampedDistance

      // Update knob position
      knobRef.current.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`

      // Calculate normalized delta (-1 to 1)
      const normalizedX = clampedX / maxDistance
      const normalizedY = clampedY / maxDistance

      onMove({ x: normalizedX, y: normalizedY })
    },
    [size, deadzone, onMove]
  )

  const handleEnd = useCallback(() => {
    isDragging.current = false
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(-50%, -50%)'
    }
    onMove(null)
  }, [onMove])

  // Touch event handlers
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      handleStart(touch.clientX, touch.clientY)
    },
    [handleStart]
  )

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      handleMove(touch.clientX, touch.clientY)
    },
    [handleMove]
  )

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      handleEnd()
    },
    [handleEnd]
  )

  // Mouse event handlers (for testing on desktop)
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      handleStart(e.clientX, e.clientY)
    },
    [handleStart]
  )

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        handleMove(e.clientX, e.clientY)
      }
    }

    const onMouseUp = () => {
      if (isDragging.current) {
        handleEnd()
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [handleMove, handleEnd])

  return (
    <div
      ref={containerRef}
      className="relative select-none touch-none"
      style={{
        width: size,
        height: size,
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      onMouseDown={onMouseDown}
    >
      {/* Base circle */}
      <div
        className="absolute inset-0 rounded-full border-2 border-white/30 bg-white/10"
        style={{
          boxShadow: 'inset 0 0 20px rgba(0, 255, 136, 0.1)',
        }}
      />

      {/* Direction indicators */}
      <div className="absolute inset-4 flex items-center justify-between text-white/20">
        <span>◀</span>
        <span>▶</span>
      </div>

      {/* Knob */}
      <div
        ref={knobRef}
        className="absolute top-1/2 left-1/2 rounded-full bg-gradient-to-b from-white/40 to-white/20 border border-white/50"
        style={{
          width: size * 0.35,
          height: size * 0.35,
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 15px rgba(0, 255, 136, 0.4)',
          transition: isDragging.current ? 'none' : 'transform 0.1s ease-out',
        }}
      />
    </div>
  )
}
