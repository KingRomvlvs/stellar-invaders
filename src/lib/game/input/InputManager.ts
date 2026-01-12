// Input Manager
// Handles keyboard, mouse, and touch input with proper coordination

import type { InputState, GameSettings } from '../types'
import { CANVAS } from '../config'

export class InputManager {
  private inputState: InputState
  private canvas: HTMLCanvasElement
  private settings: GameSettings
  private touchStartX: number | null = null
  private lastTouchX: number | null = null

  // Cleanup functions
  private cleanupFunctions: (() => void)[] = []

  constructor(canvas: HTMLCanvasElement, settings: GameSettings) {
    this.canvas = canvas
    this.settings = settings
    this.inputState = this.createInitialState()
    this.setupEventListeners()
  }

  // Create initial input state
  private createInitialState(): InputState {
    return {
      moveLeft: false,
      moveRight: false,
      shoot: false,
      pause: false,
      mouseX: null,
      mouseActive: false,
      touchMoveX: null,
      touchShoot: false,
      joystickDelta: null,
    }
  }

  // Setup all event listeners
  private setupEventListeners(): void {
    // Keyboard
    const handleKeyDown = this.handleKeyDown.bind(this)
    const handleKeyUp = this.handleKeyUp.bind(this)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    this.cleanupFunctions.push(() => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    })

    // Mouse
    const handleMouseMove = this.handleMouseMove.bind(this)
    const handleMouseDown = this.handleMouseDown.bind(this)
    const handleMouseUp = this.handleMouseUp.bind(this)
    const handleMouseLeave = this.handleMouseLeave.bind(this)
    this.canvas.addEventListener('mousemove', handleMouseMove)
    this.canvas.addEventListener('mousedown', handleMouseDown)
    this.canvas.addEventListener('mouseup', handleMouseUp)
    this.canvas.addEventListener('mouseleave', handleMouseLeave)
    this.cleanupFunctions.push(() => {
      this.canvas.removeEventListener('mousemove', handleMouseMove)
      this.canvas.removeEventListener('mousedown', handleMouseDown)
      this.canvas.removeEventListener('mouseup', handleMouseUp)
      this.canvas.removeEventListener('mouseleave', handleMouseLeave)
    })

    // Touch
    const handleTouchStart = this.handleTouchStart.bind(this)
    const handleTouchMove = this.handleTouchMove.bind(this)
    const handleTouchEnd = this.handleTouchEnd.bind(this)
    this.canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    this.canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    this.canvas.addEventListener('touchend', handleTouchEnd, { passive: false })
    this.canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false })
    this.cleanupFunctions.push(() => {
      this.canvas.removeEventListener('touchstart', handleTouchStart)
      this.canvas.removeEventListener('touchmove', handleTouchMove)
      this.canvas.removeEventListener('touchend', handleTouchEnd)
      this.canvas.removeEventListener('touchcancel', handleTouchEnd)
    })
  }

  // Keyboard handlers
  private handleKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.inputState.moveLeft = true
        break
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.inputState.moveRight = true
        break
      case ' ':
        e.preventDefault()
        this.inputState.shoot = true
        break
      case 'Escape':
      case 'p':
      case 'P':
        this.inputState.pause = true
        break
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.inputState.moveLeft = false
        break
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.inputState.moveRight = false
        break
      case ' ':
        this.inputState.shoot = false
        break
      case 'Escape':
      case 'p':
      case 'P':
        this.inputState.pause = false
        break
    }
  }

  // Mouse handlers
  private handleMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect()
    const scaleX = CANVAS.width / rect.width
    this.inputState.mouseX = (e.clientX - rect.left) * scaleX
    this.inputState.mouseActive = true
  }

  private handleMouseDown(e: MouseEvent): void {
    this.inputState.shoot = true
  }

  private handleMouseUp(e: MouseEvent): void {
    this.inputState.shoot = false
  }

  private handleMouseLeave(e: MouseEvent): void {
    this.inputState.mouseActive = false
  }

  // Touch handlers
  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault()

    const rect = this.canvas.getBoundingClientRect()
    const touch = e.touches[0]
    const touchX = touch.clientX - rect.left
    const scaleX = CANVAS.width / rect.width

    if (this.settings.controlScheme === 'drag') {
      // Drag mode: left half moves, right half shoots
      const halfWidth = rect.width / 2

      if (touchX < halfWidth) {
        // Movement touch
        this.touchStartX = touch.clientX
        this.lastTouchX = touch.clientX
      } else {
        // Fire touch
        this.inputState.touchShoot = true
      }
    } else {
      // Joystick mode - handled by VirtualJoystick component
      // For now, use touch position
      this.touchStartX = touch.clientX
      this.inputState.joystickDelta = { x: 0, y: 0 }
    }

    // Auto-fire if enabled
    if (this.settings.autoFireMobile) {
      this.inputState.touchShoot = true
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault()

    const touch = e.touches[0]

    if (this.settings.controlScheme === 'drag') {
      if (this.lastTouchX !== null) {
        // Calculate delta movement
        const deltaX = touch.clientX - this.lastTouchX
        this.inputState.touchMoveX = deltaX * 2 // Amplify for responsiveness
        this.lastTouchX = touch.clientX
      }
    } else {
      // Joystick mode
      if (this.touchStartX !== null) {
        this.inputState.joystickDelta = {
          x: touch.clientX - this.touchStartX,
          y: 0, // Only horizontal movement in Space Invaders
        }
      }
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    this.touchStartX = null
    this.lastTouchX = null
    this.inputState.touchMoveX = null
    this.inputState.joystickDelta = null
    this.inputState.touchShoot = false
  }

  // Update settings reference
  updateSettings(settings: GameSettings): void {
    this.settings = settings
  }

  // Get current input state
  getState(): InputState {
    return this.inputState
  }

  // Check for menu input (start game, etc.)
  consumePause(): boolean {
    if (this.inputState.pause) {
      this.inputState.pause = false
      return true
    }
    return false
  }

  // Check for any action input (for menu navigation)
  hasActionInput(): boolean {
    return this.inputState.shoot || this.inputState.touchShoot
  }

  // Reset input state after consuming
  resetActionInput(): void {
    // Only reset the transient states
    this.inputState.touchMoveX = null
  }

  // Get scaled mouse position
  getScaledMouseX(): number | null {
    return this.inputState.mouseActive ? this.inputState.mouseX : null
  }

  // Check if using touch
  isTouch(): boolean {
    return this.touchStartX !== null || this.inputState.touchShoot
  }

  // Cleanup
  destroy(): void {
    this.cleanupFunctions.forEach((fn) => fn())
    this.cleanupFunctions = []
  }
}
