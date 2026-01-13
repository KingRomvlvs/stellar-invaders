'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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

// Check if Convex URL is configured
const isConvexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL)

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
          <label className="block text-sm text-white/60 mb-2 uppercase tracking-wider">
            Enter Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 12))}
            onKeyDown={handleKeyDown}
            placeholder="Your name..."
            maxLength={12}
            autoFocus
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white text-center font-mono text-lg focus:outline-none focus:border-white/50 transition-colors"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          />
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting}
            className="w-full mt-3 px-6 py-3 rounded-full font-medium uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: COLORS.player,
              color: 'black',
              boxShadow: `0 0 20px ${COLORS.player}40`,
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Score'}
          </button>
        </div>
      )}

      {/* Success message */}
      {hasSubmitted && (
        <div
          className="mb-6 text-center py-3 rounded-lg"
          style={{
            backgroundColor: 'rgba(0, 255, 136, 0.1)',
            color: COLORS.player,
          }}
        >
          Score submitted!
        </div>
      )}

      {/* Leaderboard */}
      <div className="mb-6">
        <h3 className="text-sm text-white/60 uppercase tracking-wider mb-3 text-center">
          Top Scores
        </h3>
        <div
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
        >
          {topScores === undefined ? (
            <div className="text-center py-8 text-white/40">Loading...</div>
          ) : topScores.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              No scores yet. Be the first!
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {topScores.map((entry, index) => (
                <div
                  key={entry._id}
                  className="flex items-center justify-between px-4 py-3"
                  style={{
                    backgroundColor:
                      entry.score === score && hasSubmitted
                        ? 'rgba(0, 255, 136, 0.1)'
                        : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-6 text-center font-mono"
                      style={{
                        color:
                          index === 0
                            ? '#FFD700'
                            : index === 1
                              ? '#C0C0C0'
                              : index === 2
                                ? '#CD7F32'
                                : '#666',
                      }}
                    >
                      {index + 1}
                    </span>
                    <span className="text-white font-medium">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-white/40 text-sm">W{entry.wave}</span>
                    <span
                      className="font-mono tabular-nums"
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

// Fallback component when Convex is not configured
function LeaderboardFallback() {
  return (
    <div className="mb-6">
      <div
        className="text-center py-8 rounded-lg"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
      >
        <div className="text-white/40 text-sm">
          Leaderboard unavailable
        </div>
        <div className="text-white/30 text-xs mt-1">
          Configure Convex to enable online leaderboards
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
    <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-auto">
      <div
        className="w-full max-w-md mx-4 rounded-2xl backdrop-blur-xl p-6"
        style={{
          backgroundColor: 'rgba(10, 10, 26, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 0 40px rgba(0, 255, 136, 0.1)',
        }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2" style={{ color: COLORS.boss }}>
            GAME OVER
          </h2>
          <div className="text-4xl font-mono" style={{ color: COLORS.player }}>
            {score.toLocaleString()}
          </div>
          <div className="text-sm text-white/60 mt-1">Wave {wave}</div>
        </div>

        {/* Leaderboard content - conditional based on Convex availability */}
        {isConvexConfigured ? (
          <LeaderboardWithConvex score={score} wave={wave} visible={visible} />
        ) : (
          <LeaderboardFallback />
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-full bg-white/10 text-white font-medium uppercase tracking-wider transition-colors hover:bg-white/20 active:bg-white/30"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            Menu
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 px-4 py-3 rounded-full font-medium uppercase tracking-wider transition-all"
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
