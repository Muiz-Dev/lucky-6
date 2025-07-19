// app/api/draws/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { Draw } from "@/lib/types"

export async function GET() {
  const supabase = createClient()

  try {
    // Fetch the draw schedule
    const { data: scheduleData, error: scheduleError } = await supabase
      .from("draw_schedule")
      .select("*")
      .order("next_draw_time", { ascending: false })
      .limit(1)
      .single()

    if (scheduleError) {
       console.error("Error fetching draw schedule:", scheduleError.message)
       // If no schedule exists yet, return a default pending state
       if (scheduleError.code === 'PGRST116') {
          return NextResponse.json({
            currentDraw: null,
            history: [],
            timeToNextDraw: 180,
            drawInterval: 180,
            drawScheduleStatus: 'pending'
          })
       }
        return NextResponse.json({ error: "Failed to fetch draw schedule" }, { status: 500 })
    }


    // Fetch the latest 20 draws
    const { data: drawsData, error: drawsError } = await supabase
      .from("draws")
      .select("*")
      .order("created_at", { ascending: false })
      .range(0, 19)

    if (drawsError) {
      console.error("Error fetching draws:", drawsError)
      return NextResponse.json({ error: "Failed to fetch draws" }, { status: 500 })
    }

    // Format draws, ensuring createdAt is a Date object
    const formatDraw = (draw: any): Draw => ({
      id: draw.id,
      numbers: draw.numbers,
      colors: draw.colors,
      sum: draw.sum,
      highLow: draw.high_low,
      colorCounts: draw.color_counts,
      winningColors: draw.winning_colors,
      createdAt: new Date(draw.created_at),
    })

    const history = drawsData ? drawsData.map(formatDraw) : []
    const currentDraw = history.length > 0 ? history[0] : null

    // Calculate time to next draw from the schedule table
    let timeToNextDraw = 180 // Default to 3 minutes
    let drawInterval = 180
    
    if (scheduleData && scheduleData.next_draw_time) {
      const nextDrawTime = new Date(scheduleData.next_draw_time)
      const now = new Date()
      timeToNextDraw = Math.max(0, Math.floor((nextDrawTime.getTime() - now.getTime()) / 1000))
    }
     if (scheduleData && scheduleData.draw_interval) {
        // Supabase interval format is like "00:03:00"
        const parts = scheduleData.draw_interval.split(':');
        drawInterval = (+parts[0]) * 60 * 60 + (+parts[1]) * 60 + (+parts[2]);
    }


    return NextResponse.json({
      currentDraw,
      history,
      timeToNextDraw,
      drawInterval,
      drawScheduleStatus: scheduleData?.status || 'pending'
    })
  } catch (error) {
    console.error("Unexpected error in draws API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
