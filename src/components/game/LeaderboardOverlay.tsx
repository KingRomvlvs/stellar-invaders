'use client'

import { useState, useEffect, useCallback, Component, ReactNode } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { COLORS } from '@/lib/game/config'

interface LeaderboardOverlayProps {
  visible: boolean
  score: number
  wave: number
  onClose: () => void
  onPlayAgain: () => void
}

// Check if Convex URL is configured (must be a valid URL)
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
const isConvexConfigured = Boolean(
  convexUrl &&
  convexUrl.length > 0 &&
  convexUrl !== 'undefined' &&
  convexUrl.startsWith('https://')
)

// Error boundary to catch Convex errors
class ConvexErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.warn('Leaderboard error:', error.message)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

// Inner component that uses Convex hooks
function LeaderboardWithConvex({
  score,
  wave,
  visible,
}: {
  score: number
  wave: number
  visible: boolean
}) {
  const [name, setName] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitScore = useMutation(api.leaderboard.submitScore)
  const topScores = useQuery(api.leaderboard.getTopScores)
  const qualifies = useQuery(api.leaderboard.checkScoreQualifies, { score })

  // Reset state when overlay becomes visible
  useEffect(() => {
    if (visible) {
      setName('')
      setHasSubmitted(false)
      setIsSubmitting(false)
    }
  }, [visible])

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || hasSubmitted || isSubmitting) return

    setIsSubmitting(true)
    try {
      await submitScore({
        name: name.trim(),
        score,
        wave,
      })
      setHasSubmitted(true)
    } catch (error) {
      console.error('Failed to submit score:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [name, hasSubmitted, isSubmitting, submitScore, score, wave])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !hasSubmitted) {
        handleSubmit()
      }
    },
    [handleSubmit, hasSubmitted]
  )

  return (
    <>
      {/* Name Entry - only show if qualifies and hasn't submitted */}
      {qualifies && !hasSubmitted && (
        <div className="mb-6">
          <label className="block text-sm text-white/50 mb-3 uppercase tracking-widest text-center">
            You made the leaderboard!
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 12))}
            onKeyDown={handleKeyDown}
            placeholder="Enter your name..."
            maxLength={12}
            autoFocus
            className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/20 text-white text-center font-mono text-xl focus:outline-none focus:border-white/40 transition-colors"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          />
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting}
            className="w-full mt-4 px-6 py-4 rounded-full font-medium uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            style={{
              backgroundColor: COLORS.ufo,
              color: 'black',
              boxShadow: `0 0 20px ${COLORS.ufo}40`,
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Score'}
          </button>
        </div>
      )}

      {/* Success message */}
      {hasSubmitted && (
        <div
          className="mb-6 text-center py-4 rounded-xl text-lg font-medium"
          style={{
            backgroundColor: 'rgba(0, 255, 136, 0.1)',
            color: COLORS.player,
            border: `1px solid ${COLORS.player}40`,
          }}
        >
          Score submitted!
        </div>
      )}

      {/* Leaderboard */}
      <div className="mb-4">
        <h3 className="text-sm text-white/50 uppercase tracking-widest mb-4 text-center">
          Leaderboard
        </h3>
        <div
          className="rounded-xl overflow-hidden border border-white/10"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
        >
          {topScores === undefined ? (
            <div className="text-center py-6 text-white/40">Loading...</div>
          ) : topScores.length === 0 ? (
            <div className="text-center py-6 text-white/40">
              No scores yet. Be the first!
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {topScores.slice(0, 5).map((entry, index) => (
                <div
                  key={entry._id}
                  className="flex items-center justify-between px-4 py-3"
                  style={{
                    backgroundColor:
                      entry.score === score && hasSubmitted
                        ? 'rgba(0, 255, 136, 0.15)'
                        : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-8 text-center font-bold text-lg"
                      style={{
                        color:
                          index === 0
                            ? '#FFD700'
                            : index === 1
                              ? '#C0C0C0'
                              : index === 2
                                ? '#CD7F32'
                                : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {index + 1}
                    </span>
                    <span className="text-white font-medium text-lg">
                      {entry.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-white/30 text-sm">W{entry.wave}</span>
                    <span
                      className="font-mono tabular-nums text-lg font-bold"
                      style={{ color: COLORS.player }}
                    >
                      {entry.score.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Fallback component when Convex is not configured or has errors
function LeaderboardFallback() {
  return (
    <div className="mb-6">
      <div
        className="text-center py-8 rounded-lg"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
      >
        <div className="text-white/40 text-sm">Leaderboard unavailable</div>
        <div className="text-white/30 text-xs mt-1">
          Run `npx convex dev` to enable online leaderboards
        </div>
      </div>
    </div>
  )
}

export function LeaderboardOverlay({
  visible,
  score,
  wave,
  onClose,
  onPlayAgain,
}: LeaderboardOverlayProps) {
  if (!visible) return null

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-50 pointer-events-auto"
      style={{ backgroundColor: COLORS.background }}
    >
      <div className="w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h2
            className="text-5xl font-bold mb-4 tracking-wider"
            style={{
              color: COLORS.boss,
              textShadow: `0 0 30px ${COLORS.boss}`,
            }}
          >
            GAME OVER
          </h2>
          <div
            className="text-6xl font-mono tabular-nums mb-2"
            style={{ color: COLORS.player }}
          >
            {score.toLocaleString()}
          </div>
          <div className="text-lg text-white/60">Wave {wave}</div>
        </div>

        {/* Leaderboard content - with error boundary */}
        {isConvexConfigured ? (
          <ConvexErrorBoundary fallback={<LeaderboardFallback />}>
            <LeaderboardWithConvex score={score} wave={wave} visible={visible} />
          </ConvexErrorBoundary>
        ) : (
          <LeaderboardFallback />
        )}

        {/* Action buttons */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-4 rounded-full bg-white/10 text-white font-medium uppercase tracking-wider transition-colors hover:bg-white/20 active:bg-white/30 text-lg"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            Menu
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 px-6 py-4 rounded-full font-medium uppercase tracking-wider transition-all text-lg"
            style={{
              backgroundColor: COLORS.player,
              color: 'black',
              boxShadow: `0 0 20px ${COLORS.player}40`,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  )
}
