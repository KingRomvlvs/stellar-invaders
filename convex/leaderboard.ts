import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

// Get top 10 scores
export const getTopScores = query({
  args: {},
  handler: async (ctx) => {
    const scores = await ctx.db
      .query('leaderboard')
      .withIndex('by_score')
      .order('desc')
      .take(10)
    return scores
  },
})

// Submit a new score
export const submitScore = mutation({
  args: {
    name: v.string(),
    score: v.number(),
    wave: v.number(),
  },
  handler: async (ctx, args) => {
    // Validate name (1-12 chars, alphanumeric + spaces)
    const name = args.name.trim().slice(0, 12)
    if (name.length === 0) {
      throw new Error('Name is required')
    }

    // Insert the score
    const id = await ctx.db.insert('leaderboard', {
      name,
      score: args.score,
      wave: args.wave,
      createdAt: Date.now(),
    })

    return id
  },
})

// Check if score qualifies for leaderboard (top 10)
export const checkScoreQualifies = query({
  args: {
    score: v.number(),
  },
  handler: async (ctx, args) => {
    const scores = await ctx.db
      .query('leaderboard')
      .withIndex('by_score')
      .order('desc')
      .take(10)

    // If less than 10 entries, any score qualifies
    if (scores.length < 10) {
      return true
    }

    // Check if score beats the lowest top 10 score
    const lowestTopScore = scores[scores.length - 1]
    return args.score > lowestTopScore.score
  },
})
