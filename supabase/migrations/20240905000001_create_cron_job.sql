-- This migration creates a Supabase cron job to trigger the draw generation function every 3 minutes.
-- It's designed to be a new migration file in your /supabase/migrations/ directory.
-- It's idempotent, meaning it can be run safely multiple times.

-- 1. Create the trigger function that calls the Edge Function internally
-- This method is more secure and reliable than using an HTTP request.
CREATE OR REPLACE FUNCTION public.trigger_draw_generation()
RETURNS void AS $$
BEGIN
    -- Use supabase_functions.invoke to call the Edge Function by name
    -- The second argument is the function name.
    -- The fourth argument is the JWT from the current user (in this case, postgres/authenticator).
    PERFORM supabase_functions.invoke(
        'generate-draw',
        '{}'::jsonb, -- request_body
        '{}'::jsonb, -- request_headers
        (SELECT current_setting('request.jwt.claims', true))::text -- request_jwt
    );
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Error invoking draw generation function: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- 2. Grant necessary permissions to the postgres user and anon role to execute the function
-- This ensures the cron job, running as postgres, can call the trigger.
GRANT EXECUTE ON FUNCTION public.trigger_draw_generation() TO postgres;
GRANT USAGE ON SCHEMA supabase_functions TO postgres;

-- 3. Schedule the cron job to run every 3 minutes
-- It will call the trigger function we just created.
-- The 'if_not_exists' flag prevents errors if the job already exists.
SELECT cron.schedule(
    'draw-generation-job', -- A unique name for the job
    '*/3 * * * *',         -- The schedule: every 3 minutes
    'SELECT public.trigger_draw_generation()',
    (SELECT true) -- if_not_exists
);

-- Optional: Unschedule the old job if it exists to avoid conflicts
DO $$
BEGIN
   IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'draw-generation') THEN
      SELECT cron.unschedule('draw-generation');
      RAISE NOTICE 'Unscheduled old "draw-generation" job.';
   END IF;
END;
$$;
