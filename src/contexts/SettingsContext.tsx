'use client'

// Settings Context
// Provides game settings with localStorage persistence

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { GameSettings } from '@/lib/game/types'

interface SettingsContextValue {
  settings: GameSettings
  updateSettings: (updates: Partial<GameSettings>) => void
  highScore: number
  updateHighScore: (score: number) => void
}

const defaultSettings: GameSettings = {
  soundEnabled: true,
  reducedMotion: false,
  autoFireMobile: false,
  controlScheme: 'drag',
}

const SETTINGS_KEY = 'stellar-invaders-settings'
const HIGH_SCORE_KEY = 'stellar-invaders-highscore'

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<GameSettings>(defaultSettings)
  const [highScore, setHighScore] = useState<number>(0)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY)
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsed })
      }

      const savedHighScore = localStorage.getItem(HIGH_SCORE_KEY)
      if (savedHighScore) {
        setHighScore(parseInt(savedHighScore, 10) || 0)
      }

      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches
      if (prefersReducedMotion && !savedSettings) {
        setSettings((prev) => ({ ...prev, reducedMotion: true }))
      }
    } catch (error) {
      console.warn('Failed to load settings:', error)
    }

    setIsHydrated(true)
  }, [])

  // Save settings to localStorage when they change
  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return

    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch (error) {
      console.warn('Failed to save settings:', error)
    }
  }, [settings, isHydrated])

  const updateSettings = useCallback((updates: Partial<GameSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }))
  }, [])

  const updateHighScore = useCallback((score: number) => {
    setHighScore((prev) => {
      if (score > prev) {
        try {
          localStorage.setItem(HIGH_SCORE_KEY, score.toString())
        } catch (error) {
          console.warn('Failed to save high score:', error)
        }
        return score
      }
      return prev
    })
  }, [])

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, highScore, updateHighScore }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
