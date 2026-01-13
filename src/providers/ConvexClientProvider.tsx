'use client'

import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { ReactNode, useMemo } from 'react'

// Create a singleton convex client that's only initialized when the URL is available
let convexClient: ConvexReactClient | null = null

function getConvexClient(): ConvexReactClient | null {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) return null

  if (!convexClient) {
    convexClient = new ConvexReactClient(url)
  }
  return convexClient
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => getConvexClient(), [])

  // If no Convex URL is configured, render children without Convex
  if (!client) {
    return <>{children}</>
  }

  return <ConvexProvider client={client}>{children}</ConvexProvider>
}
