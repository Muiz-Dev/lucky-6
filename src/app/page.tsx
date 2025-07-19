"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { DrawHistory } from "@/components/lucky-six/DrawHistory"
import { LiveDraw } from "@/components/lucky-six/LiveDraw"
import type { Draw } from "@/lib/types"
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client"

export default function Home() {
  const [currentDraw, setCurrentDraw] = useState<Draw | null>(null)
  const [history, setHistory] = useState<Draw[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeToNextDraw, setTimeToNextDraw] = useState(180)
  const [drawInterval, setDrawInterval] = useState(180)
  const [error, setError] = useState<string | null>(null)
  const [key, setKey] = useState(Date.now()) // Used to force re-render of LiveDraw for animation

  // Use a ref to track if a fetch is already in progress to prevent multiple simultaneous fetches
  const isFetchingRef = useRef(false)

  // Make fetchInitialData truly stable and prevent re-fetching if already fetching
  const fetchInitialData = useCallback(async () => {
    if (isFetchingRef.current) {
      console.log("Fetch already in progress, skipping.")
      return // Prevent re-entry
    }

    isFetchingRef.current = true // Set flag
    setError(null) // Clear any previous errors

    try {
      const response = await fetch("/api/draws")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setCurrentDraw(data.currentDraw)
      setHistory(data.history)
      setTimeToNextDraw(data.timeToNextDraw) // This will reset the timer
      setDrawInterval(data.drawInterval)
      setKey(Date.now()) // Force re-render of LiveDraw to trigger animation
    } catch (err) {
      console.error("Failed to fetch new draw data:", err)
      setError("Failed to load draw data. Please try again later.")
    } finally {
      if (isLoading) setIsLoading(false) // Only set isLoading to false if it's true
      isFetchingRef.current = false // Reset flag
    }
  }, [isLoading]) // isLoading is a dependency, but it only changes once from true to false

  // Effect for initial data fetch and Realtime subscription
  useEffect(() => {
    // Initial fetch on mount
    fetchInitialData()

    const supabase = createSupabaseBrowserClient()
    const channel = supabase
      .channel("draws_channel")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "draws" }, (payload) => {
        console.log("Realtime new draw received!", payload)
        // When a new draw comes in, fetch all data again to re-sync
        // Adding a small delay to ensure the database has committed the transaction
        setTimeout(() => {
          fetchInitialData() // This is the primary trigger for data refresh
        }, 500)
      })
      .subscribe()

    // Cleanup function for Realtime subscription
    return () => {
      channel.unsubscribe()
    }
  }, [fetchInitialData]) // fetchInitialData is a stable dependency

  // Effect for the countdown timer
  useEffect(() => {
    if (isLoading) return // Don't start the timer until data is loaded

    const countdownInterval = setInterval(() => {
      setTimeToNextDraw((prevTime) => {
        // The timer now ONLY decrements.
        // It does NOT trigger fetchInitialData().
        // The timeToNextDraw will be reset by fetchInitialData() when a Realtime event occurs.
        return Math.max(0, prevTime - 1)
      })
    }, 1000)

    // Cleanup function for the countdown interval
    return () => {
      clearInterval(countdownInterval)
    }
  }, [isLoading]) // Dependencies: isLoading (to start/stop timer). fetchInitialData is removed.

  return (
    <main
      className="min-h-screen w-full bg-background font-body text-foreground"
      style={{ background: "radial-gradient(circle, hsl(0 0% 12%), hsl(0 0% 7.1%) )" }}
    >
      <div className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 rounded-lg p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center bg-card/50 border border-border animate-fade-in">
            <LiveDraw
              key={key}
              currentDraw={currentDraw}
              timeToNextDraw={timeToNextDraw}
              isLoading={isLoading}
              error={error}
            />
          </div>
          <div className="lg:col-span-1 rounded-lg bg-card/50 border border-border overflow-hidden lg:max-h-[calc(100vh-4rem)] animate-fade-in-delay">
            <DrawHistory draws={history} />
          </div>
        </div>
      </div>
    </main>
  )
}
