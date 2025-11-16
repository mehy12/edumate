-- Add Google token columns
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS google_access_token text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS google_refresh_token text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS google_token_expiry timestamp;

-- Create course_enrollments
CREATE TABLE IF NOT EXISTS course_enrollments (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  topic text NOT NULL,
  estimated_class_count integer,
  learning_speed text,
  status text NOT NULL DEFAULT 'planned',
  created_at timestamp without time zone NOT NULL DEFAULT now()
);

-- Create class_sessions
CREATE TABLE IF NOT EXISTS class_sessions (
  id text PRIMARY KEY,
  enrollment_id text NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
  session_index integer NOT NULL,
  title text NOT NULL,
  description text,
  scheduled_at timestamp without time zone,
  google_calendar_event_id text,
  created_at timestamp without time zone NOT NULL DEFAULT now()
);
