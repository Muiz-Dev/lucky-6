# Lucky Six Backend: Draw Generation Setup

This document provides a complete reference for the server-side draw generation architecture of the Lucky Six application. It consists of two key components:

1.  **A Supabase Edge Function (`generate-draw`)**: The core engine that creates a new draw.
2.  **A Supabase Cron Job (`draw-generation-job`)**: A scheduler that automatically triggers the Edge Function every 3 minutes.

---

## 1. The Edge Function: The Draw Generator

This is the main server-side function responsible for all draw logic. It runs on Supabase's servers and is written in Deno/TypeScript.

**Purpose:**
- Securely generates 6 unique random numbers.
- Calculates all associated draw data (colors, sum, high/low, etc.).
- Saves the new draw to the `draws` table.
- Updates the `draw_schedule` table with the next draw time.

### Full Edge Function Code

This code should be located at `supabase/functions/generate-draw/index.ts`.

```typescript
// Supabase Edge Runtime for Draw Generation
import { createClient } from "npm:@supabase/supabase-js@2.43.2";

// Secure Randomness Utility
const secureRandom = (min, max)=>{
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const cutoff = Math.floor(256 ** bytesNeeded / range) * range;
  const bytes = new Uint8Array(bytesNeeded);
  let value;
  do {
    crypto.getRandomValues(bytes);
    value = bytes.reduce((acc, x, n)=>acc + x * 256 ** n, 0);
  }while (value >= cutoff)
  return min + value % range;
};

// Robust Number Generation Algorithm
function generateLuckyNumbersAlgorithm() {
  const numbers = new Set();
  const decades = new Set();
  while(numbers.size < 6){
    const num = secureRandom(1, 99);
    const decade = Math.floor(num / 10);
    // Ensure spread across decades and uniqueness
    if (!numbers.has(num) && (numbers.size < 3 || !decades.has(decade) || numbers.size >= 4)) {
      numbers.add(num);
      decades.add(decade);
    }
  }
  return Array.from(numbers).sort((a, b)=>a - b);
}

// Constants
const BALL_COLORS = Object.freeze([
  "#c00",
  "#1E40AF",
  "#166534"
]);

// Use weighted randomness for color selection
const COLOR_DISTRIBUTION_WEIGHTS = [
  0.4, // Red
  0.3, // Blue
  0.3  // Green
];

const weightedRandomColor = ()=>{
  const rand = Math.random();
  let cumulativeWeight = 0;
  for(let i = 0; i < BALL_COLORS.length; i++){
    cumulativeWeight += COLOR_DISTRIBUTION_WEIGHTS[i];
    if (rand <= cumulativeWeight) return BALL_COLORS[i];
  }
  return BALL_COLORS[BALL_COLORS.length - 1];
};

const getHighLowMid = (sum)=>{
  if (sum < 150) return "Low";
  if (sum > 350) return "High";
  return "Mid";
};

// Logging Utility
const log = {
  info: (message, data)=>console.log(JSON.stringify({
      level: 'info',
      message,
      ...data
    })),
  error: (message, error)=>console.error(JSON.stringify({
      level: 'error',
      message,
      error
    }))
};

// Main Draw Generation Function
Deno.serve(async (req)=>{
  // Initialize Supabase client
  const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_ANON_KEY"));
  
  try {
    // Generate draw data
    const numbersArray = generateLuckyNumbersAlgorithm();
    const sum = numbersArray.reduce((a, b)=>a + b, 0);
    const colorsArray = Array.from({
      length: 6
    }, weightedRandomColor);
    const colorCounts = colorsArray.reduce((acc, color)=>{
      acc[color] = (acc[color] || 0) + 1;
      return acc;
    }, {});
    const maxCount = Math.max(...Object.values(colorCounts));
    const winningColors = Object.keys(colorCounts).filter((key)=>colorCounts[key] === maxCount);
    const now = new Date();
    
    const newDraw = {
      id: `draw_${crypto.randomUUID()}`,
      numbers: numbersArray,
      colors: colorsArray,
      sum,
      high_low: getHighLowMid(sum),
      color_counts: colorCounts,
      winning_colors: winningColors,
      created_at: now.toISOString()
    };
    
    // Insert draw
    const { error: drawError } = await supabase.from("draws").insert(newDraw);
    if (drawError) {
      log.error("Draw insertion failed", drawError);
      return new Response(JSON.stringify({
        error: "Failed to save draw"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    
    // Update draw schedule
    const newNextDrawTime = new Date(now.getTime() + 3 * 60 * 1000); // 3 minutes from now
    const { error: scheduleUpdateError } = await supabase.from("draw_schedule").upsert({
      id: 'singleton_schedule', // Use a fixed ID to always update the same row
      last_draw_time: now.toISOString(),
      next_draw_time: newNextDrawTime.toISOString(),
      draw_interval: '00:03:00',
      status: 'completed'
    });
    
    if (scheduleUpdateError) {
      log.error("Schedule update failed", scheduleUpdateError);
    }
    
    log.info("Draw generated successfully", {
      drawId: newDraw.id
    });
    
    return new Response(JSON.stringify({
      success: true,
      message: "Draw generated successfully",
      draw: newDraw,
      nextDrawTime: newNextDrawTime.toISOString()
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    log.error("Unexpected draw generation error", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      details: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
```

---

## 2. The Cron Job: The Scheduler

This is a SQL script that uses Supabase's `pg_cron` extension to automatically call the Edge Function at a set interval.

**Purpose:**
- To run on a schedule (e.g., every 3 minutes).
- To make a secure, authenticated HTTP request to the `generate-draw` Edge Function.
- To provide robust logging for debugging.

### Full Cron Job SQL Migration

This script should be saved as a new migration file inside your `supabase/migrations/` directory (e.g., `supabase/migrations/20240905120000_create_draw_generation_cron.sql`).

```sql
-- This migration corrects the Supabase cron job function and adds the necessary Authorization header.
-- It's designed to be a new migration file in your /supabase/migrations/ directory.
-- It's idempotent, meaning it can be run safely multiple times.

-- Drop existing cron job if it exists to ensure a clean update
DO $$
BEGIN
    PERFORM cron.unschedule('draw-generation-job');
EXCEPTION WHEN OTHERS THEN
    -- Ignore if job doesn't exist
    RAISE NOTICE 'No existing draw-generation job to remove';
END $$;

-- Create system_logs table if it doesn't exist (ensure this is only run once)
CREATE TABLE IF NOT EXISTS public.system_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    log_type TEXT NOT NULL,
    message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Create a more detailed logging function for draw generation
CREATE OR REPLACE FUNCTION public.trigger_draw_generation()
RETURNS void AS $$
DECLARE
    current_time TIMESTAMP := NOW();
    last_draw TIMESTAMP;
    http_request_id BIGINT; -- To store the request_id from net.http_post
    -- IMPORTANT: Replace with your project's public anon key.
    -- This key is required for your Edge Function to authenticate the request.
    anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhb3Vwa2p5dmh5aGN0emVwaWxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3Mzg1ODksImV4cCI6MjA2ODMxNDU4OX0.UQFi-zXVef2qaGai8eYUv67eSXNrLDtl_fjm-ANkwU0';
BEGIN
    -- Check last draw time (optional, for logging context)
    SELECT MAX(created_at) INTO last_draw
    FROM draws;

    -- Log the attempt
    INSERT INTO system_logs (
        log_type,
        message,
        metadata
    ) VALUES (
        'draw_generation_attempt',
        'Attempting to generate draw',
        jsonb_build_object(
            'current_time', current_time,
            'last_draw', last_draw
        )
    );

    -- Trigger HTTP request to the Edge Function
    -- CRITICAL: Added 'Authorization' header with your anon key
    SELECT net.http_post(
        url := 'https://taoupkjyvhyhctzepilm.functions.supabase.co/generate-draw',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || anon_key -- This is crucial for authentication
        ),
        body := '{}'::jsonb
    ) INTO http_request_id; -- Capture the request_id

    -- Log the HTTP request initiation with the request_id
    INSERT INTO system_logs (
        log_type,
        message,
        metadata
    ) VALUES (
        'draw_generation_http_request_initiated',
        'HTTP request to Edge Function initiated',
        jsonb_build_object(
            'request_id', http_request_id,
            'edge_function_url', 'https://taoupkjyvhyhctzepilm.functions.supabase.co/generate-draw'
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Comprehensive error logging for issues within the SQL function itself
        INSERT INTO system_logs (
            log_type,
            message,
            metadata
        ) VALUES (
            'draw_generation_error',
            'Draw generation failed at SQL function level',
            jsonb_build_object(
                'error_message', SQLERRM,
                'error_context', SQLSTATE
            )
        );
END;
$$ LANGUAGE plpgsql;


-- Schedule the cron job to run every 3 minutes
-- Note: cron.schedule will overwrite an existing job with the same name.
SELECT cron.schedule('draw-generation-job', '*/3 * * * *', 'SELECT public.trigger_draw_generation()');

-- Verify the job is scheduled
SELECT * FROM cron.job WHERE jobname = 'draw-generation-job';
```

### How to Deploy the Cron Job

1.  **Save the SQL:** Place the SQL script into a new file in the `supabase/migrations` directory.
2.  **Run the Migration:** Execute the following command from your project's root directory:
    ```bash
    npx supabase db push
    ```

This will apply the migration, set up the `system_logs` table, create the `trigger_draw_generation` function, and schedule the cron job. Your backend will then be fully automated.