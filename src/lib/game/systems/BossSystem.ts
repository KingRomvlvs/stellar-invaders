// Boss System
// Handles boss behavior, patterns, and attacks with telegraphing

import type { BossState, GameState, Projectile, BossPattern, BossPhase } from '../types'
import { BOSS, CANVAS, PROJECTILE, COLORS } from '../config'
import type { ParticleSystem } from './ParticleSystem'
import type { AudioManager } from '../audio/AudioManager'

export class BossSystem {
  private readonly PATTERNS: BossPattern[] = ['sweep', 'spiral', 'spread']

  constructor(
    private particleSystem: ParticleSystem,
    private audioManager: AudioManager
  ) {}

  // Create a new boss for the wave
  createBoss(wave: number): BossState {
    const bossNumber = Math.floor(wave / BOSS.waveInterval)
    const healthMultiplier = 1 + (bossNumber - 1) * BOSS.healthMultiplierPerBoss
    const health = Math.floor(BOSS.baseHealth * healthMultiplier)

    return {
      position: { x: CANVAS.width / 2, y: 80 },
      velocity: { x: BOSS.speed, y: 0 },
      width: BOSS.width,
      height: BOSS.height,
      isActive: true,
      health,
      maxHealth: health,
      phase: 1,
      currentPattern: 'sweep',
      patternTimer: 0,
      attackCooldown: BOSS.attackCooldown[1],
      isTelegraphing: false,
      telegraphTimer: 0,
      nextAttack: 'sweep',
      addsCooldown: BOSS.addsCooldown,
      addsRemaining: BOSS.maxAdds,
    }
  }

  // Main update
  update(dt: number, state: GameState): void {
    const boss = state.boss
    if (!boss || !boss.isActive) return

    // Update movement
    this.updateMovement(boss, dt)

    // Update phase based on health
    this.updatePhase(boss)

    // Update attack pattern
    this.updateAttacks(boss, state, dt)

    // Update adds (minion spawning)
    this.updateAdds(boss, state, dt)

    // Check for death
    if (boss.health <= 0) {
      this.killBoss(boss, state)
    }
  }

  // Update boss movement (sweeping back and forth)
  private updateMovement(boss: BossState, dt: number): void {
    const dtSeconds = dt / 1000

    // Faster movement in later phases
    const speedMultiplier = 1 + (boss.phase - 1) * 0.3
    boss.position.x += boss.velocity.x * speedMultiplier * dtSeconds

    // Bounce off edges
    const halfWidth = boss.width / 2
    if (
      boss.position.x <= halfWidth + 20 ||
      boss.position.x >= CANVAS.width - halfWidth - 20
    ) {
      boss.velocity.x *= -1
    }

    // Slight vertical bobbing
    boss.position.y = 80 + Math.sin(performance.now() / 500) * 10
  }

  // Update phase based on health percentage
  private updatePhase(boss: BossState): void {
    const healthPercent = boss.health / boss.maxHealth

    let newPhase: BossPhase = 1
    if (healthPercent < BOSS.phase3Threshold) {
      newPhase = 3
    } else if (healthPercent < BOSS.phase2Threshold) {
      newPhase = 2
    }

    if (newPhase !== boss.phase) {
      boss.phase = newPhase
      boss.attackCooldown = BOSS.attackCooldown[newPhase]
      this.audioManager.playBossPhaseChange()
    }
  }

  // Update attack patterns
  private updateAttacks(boss: BossState, state: GameState, dt: number): void {
    if (boss.isTelegraphing) {
      // In telegraph phase - warning before attack
      boss.telegraphTimer += dt

      if (boss.telegraphTimer >= BOSS.telegraphDuration) {
        // Execute the attack
        boss.isTelegraphing = false
        this.executePattern(boss, state)
        boss.patternTimer = 0
      }
    } else {
      // Not telegraphing - wait for next attack
      boss.patternTimer += dt

      if (boss.patternTimer >= boss.attackCooldown) {
        // Start telegraphing next attack
        this.startTelegraph(boss)
      }
    }
  }

  // Start telegraphing an attack
  private startTelegraph(boss: BossState): void {
    boss.isTelegraphing = true
    boss.telegraphTimer = 0

    // Pick random pattern, weighted by phase
    if (boss.phase === 3) {
      // More aggressive in phase 3
      boss.nextAttack = this.PATTERNS[Math.floor(Math.random() * this.PATTERNS.length)]
    } else if (boss.phase === 2) {
      // Mix of patterns in phase 2
      boss.nextAttack = Math.random() < 0.5 ? 'sweep' : 'spiral'
    } else {
      // Simple sweep in phase 1
      boss.nextAttack = 'sweep'
    }

    this.audioManager.playBossTelegraph()
  }

  // Execute the attack pattern
  private executePattern(boss: BossState, state: GameState): void {
    switch (boss.nextAttack) {
      case 'sweep':
        this.patternSweep(boss, state)
        break
      case 'spiral':
        this.patternSpiral(boss, state)
        break
      case 'spread':
        this.patternSpread(boss, state)
        break
    }

    this.audioManager.playBossAttack()
  }

  // Sweep pattern - horizontal line of bullets
  private patternSweep(boss: BossState, state: GameState): void {
    const bulletCount = 5 + boss.phase * 2 // More bullets in later phases

    for (let i = 0; i < bulletCount; i++) {
      const offset = (i - (bulletCount - 1) / 2) * 15

      const projectile: Projectile = {
        position: {
          x: boss.position.x + offset,
          y: boss.position.y + boss.height / 2 + 10,
        },
        velocity: {
          x: 0,
          y: PROJECTILE.boss.speed,
        },
        width: PROJECTILE.boss.width,
        height: PROJECTILE.boss.height,
        isActive: true,
        isPlayerProjectile: false,
        damage: 1,
        type: 'powered',
      }

      state.enemyProjectiles.push(projectile)
    }
  }

  // Spiral pattern - bullets in circular pattern
  private patternSpiral(boss: BossState, state: GameState): void {
    const bulletCount = 8 + boss.phase * 4

    for (let i = 0; i < bulletCount; i++) {
      const angle = (Math.PI * 2 * i) / bulletCount
      const speed = PROJECTILE.boss.speed * 0.8

      const projectile: Projectile = {
        position: {
          x: boss.position.x,
          y: boss.position.y + boss.height / 2,
        },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed + speed * 0.3, // Downward bias
        },
        width: PROJECTILE.boss.width,
        height: PROJECTILE.boss.height,
        isActive: true,
        isPlayerProjectile: false,
        damage: 1,
        type: 'powered',
      }

      state.enemyProjectiles.push(projectile)
    }
  }

  // Spread pattern - aimed at player with spread
  private patternSpread(boss: BossState, state: GameState): void {
    const player = state.player
    const dx = player.position.x - boss.position.x
    const dy = player.position.y - boss.position.y
    const baseAngle = Math.atan2(dy, dx)

    const bulletCount = 5 + boss.phase
    const spreadAngle = 0.15

    for (let i = 0; i < bulletCount; i++) {
      const angleOffset = (i - (bulletCount - 1) / 2) * spreadAngle
      const angle = baseAngle + angleOffset

      const projectile: Projectile = {
        position: {
          x: boss.position.x,
          y: boss.position.y + boss.height / 2,
        },
        velocity: {
          x: Math.cos(angle) * PROJECTILE.boss.speed,
          y: Math.sin(angle) * PROJECTILE.boss.speed,
        },
        width: PROJECTILE.boss.width,
        height: PROJECTILE.boss.height,
        isActive: true,
        isPlayerProjectile: false,
        damage: 1,
        type: 'powered',
      }

      state.enemyProjectiles.push(projectile)
    }
  }

  // Update adds (limited minion spawning)
  private updateAdds(boss: BossState, state: GameState, dt: number): void {
    if (boss.addsRemaining <= 0 || boss.phase < 2) return

    boss.addsCooldown -= dt

    if (boss.addsCooldown <= 0) {
      this.spawnAdds(boss, state)
      boss.addsRemaining--
      boss.addsCooldown = BOSS.addsCooldown
    }
  }

  // Spawn minion adds
  private spawnAdds(boss: BossState, state: GameState): void {
    // Create a few additional projectiles that act like mini-threats
    // These are just extra projectiles, not full enemies
    for (let i = 0; i < 3; i++) {
      const offset = (i - 1) * 40
      const projectile: Projectile = {
        position: {
          x: boss.position.x + offset,
          y: boss.position.y + boss.height,
        },
        velocity: {
          x: offset * 0.5,
          y: PROJECTILE.boss.speed * 0.5,
        },
        width: 8,
        height: 8,
        isActive: true,
        isPlayerProjectile: false,
        damage: 1,
        type: 'powered',
      }
      state.enemyProjectiles.push(projectile)
    }

    this.audioManager.playBossAdds()
  }

  // Kill the boss
  private killBoss(boss: BossState, state: GameState): void {
    boss.isActive = false

    // Big explosion sequence
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const x = boss.position.x + (Math.random() - 0.5) * boss.width
        const y = boss.position.y + (Math.random() - 0.5) * boss.height
        this.particleSystem.createExplosion(state, { x, y }, COLORS.boss)
      }, i * 100)
    }

    // Calculate bonus
    const bossNumber = Math.floor(state.wave / BOSS.waveInterval)
    const bonus = Math.floor(
      BOSS.waveInterval * 1000 * (1 + (bossNumber - 1) * BOSS.healthMultiplierPerBoss)
    )
    state.score += bonus

    this.audioManager.playBossDeath()
  }

  // Check if it's a boss wave
  isBossWave(wave: number): boolean {
    return wave > 0 && wave % BOSS.waveInterval === 0
  }
}
