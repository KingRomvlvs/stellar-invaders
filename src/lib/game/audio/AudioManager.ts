// Audio Manager
// Synthesized retro sound effects using Web Audio API

export class AudioManager {
  private audioContext: AudioContext | null = null
  private enabled: boolean = true
  private reducedMotion: boolean = false
  private backgroundMusic: HTMLAudioElement | null = null
  private musicVolume: number = 0.3

  constructor() {
    // AudioContext will be created on first user interaction
    // Initialize background music
    if (typeof window !== 'undefined') {
      this.backgroundMusic = new Audio('/audio/background-music.m4a')
      this.backgroundMusic.loop = true
      this.backgroundMusic.volume = this.musicVolume
    }
  }

  // Initialize audio context (must be called after user interaction)
  private getContext(): AudioContext | null {
    if (!this.enabled) return null

    if (!this.audioContext && typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)()
      } catch {
        console.warn('Web Audio API not supported')
        return null
      }
    }

    // Resume suspended audio context (browser autoplay policy)
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    return this.audioContext
  }

  // Enable/disable audio
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) {
      if (this.audioContext) {
        this.audioContext.close()
        this.audioContext = null
      }
      this.stopMusic()
    }
  }

  // Start background music
  startMusic(): void {
    if (!this.enabled || !this.backgroundMusic) return

    this.backgroundMusic.play().catch(() => {
      // Browser blocked autoplay, will start on next user interaction
    })
  }

  // Stop background music
  stopMusic(): void {
    if (!this.backgroundMusic) return

    this.backgroundMusic.pause()
    this.backgroundMusic.currentTime = 0
  }

  // Pause background music
  pauseMusic(): void {
    if (!this.backgroundMusic) return
    this.backgroundMusic.pause()
  }

  // Resume background music
  resumeMusic(): void {
    if (!this.enabled || !this.backgroundMusic) return
    this.backgroundMusic.play().catch(() => {})
  }

  // Set music volume (0-1)
  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume))
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.musicVolume
    }
  }

  // Set reduced motion (affects sound frequency/intensity)
  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced
  }

  // Player shoot sound
  playShoot(): void {
    const ctx = this.getContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'square'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.1)

    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.1)
  }

  // Generic explosion sound
  playExplosion(): void {
    const ctx = this.getContext()
    if (!ctx) return

    const bufferSize = ctx.sampleRate * 0.15
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    }

    const source = ctx.createBufferSource()
    const gain = ctx.createGain()

    source.buffer = buffer
    source.connect(gain)
    gain.connect(ctx.destination)

    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)

    source.start()
  }

  // Invader step sound (classic beep)
  playInvaderStep(): void {
    if (this.reducedMotion) return // Too frequent in reduced motion mode

    const ctx = this.getContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'square'
    osc.frequency.setValueAtTime(100, ctx.currentTime)

    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.05)
  }

  // Player death sound
  playPlayerDeath(): void {
    const ctx = this.getContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(400, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5)

    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
  }

  // Hit sound (smaller than explosion)
  playHit(): void {
    const ctx = this.getContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'square'
    osc.frequency.setValueAtTime(200, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08)

    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.08)
  }

  // UFO sound (warbling)
  playUFO(): void {
    const ctx = this.getContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sine'
    const now = ctx.currentTime

    // Warbling frequency
    for (let i = 0; i < 3; i++) {
      osc.frequency.setValueAtTime(150, now + i * 0.1)
      osc.frequency.setValueAtTime(200, now + i * 0.1 + 0.05)
    }

    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.setValueAtTime(0.01, ctx.currentTime + 0.3)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  }

  // UFO hit sound
  playUFOHit(): void {
    const ctx = this.getContext()
    if (!ctx) return

    // Higher pitched explosion
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'square'
    osc.frequency.setValueAtTime(600, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3)

    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  }

  // Boss telegraph sound
  playBossTelegraph(): void {
    const ctx = this.getContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(220, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.5)

    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.4)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
  }

  // Boss attack sound
  playBossAttack(): void {
    const ctx = this.getContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(150, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.2)

    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.2)
  }

  // Boss phase change sound
  playBossPhaseChange(): void {
    const ctx = this.getContext()
    if (!ctx) return

    // Descending tone
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'square'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.5)

    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
  }

  // Boss adds spawn sound
  playBossAdds(): void {
    const ctx = this.getContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(300, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.1)
    osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.2)

    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.2)
  }

  // Boss death sound
  playBossDeath(): void {
    const ctx = this.getContext()
    if (!ctx) return

    // Long explosion sequence
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playExplosion()
      }, i * 100)
    }
  }

  // Asteroid destroy sound
  playAsteroidDestroy(): void {
    const ctx = this.getContext()
    if (!ctx) return

    // Crunchy sound
    const bufferSize = ctx.sampleRate * 0.2
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate
      data[i] =
        (Math.random() * 2 - 1) *
        (1 - i / bufferSize) *
        Math.sin(t * 100 * Math.PI)
    }

    const source = ctx.createBufferSource()
    const gain = ctx.createGain()

    source.buffer = buffer
    source.connect(gain)
    gain.connect(ctx.destination)

    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)

    source.start()
  }

  // Wave complete sound
  playWaveComplete(): void {
    const ctx = this.getContext()
    if (!ctx) return

    const notes = [262, 330, 392, 523] // C4, E4, G4, C5
    notes.forEach((freq, i) => {
      setTimeout(() => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime)

        gain.gain.setValueAtTime(0.15, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)

        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.2)
      }, i * 100)
    })
  }

  // Game over sound
  playGameOver(): void {
    const ctx = this.getContext()
    if (!ctx) return

    const notes = [392, 330, 262, 196] // G4, E4, C4, G3 (descending)
    notes.forEach((freq, i) => {
      setTimeout(() => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.type = 'square'
        osc.frequency.setValueAtTime(freq, ctx.currentTime)

        gain.gain.setValueAtTime(0.2, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)

        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.3)
      }, i * 150)
    })
  }

  // Power-up collection sound
  playPowerUp(): void {
    const ctx = this.getContext()
    if (!ctx) return

    // Ascending sparkly sound
    const notes = [523, 659, 784, 1047] // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime)

        gain.gain.setValueAtTime(0.12, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)

        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.15)
      }, i * 50)
    })
  }

  // Menu select sound
  playMenuSelect(): void {
    const ctx = this.getContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(440, ctx.currentTime)
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.05)

    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.1)
  }

  // Cleanup
  destroy(): void {
    this.stopMusic()
    this.backgroundMusic = null

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}
