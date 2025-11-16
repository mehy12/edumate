-- Add avatar_url and bio to user
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS bio text;

-- Create activity_events table
CREATE TABLE IF NOT EXISTS activity_events (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  type text NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now()
);
