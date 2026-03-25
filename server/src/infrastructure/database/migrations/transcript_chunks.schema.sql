CREATE TABLE IF NOT EXISTS transcript_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  speaker_label VARCHAR(10),
  text TEXT NOT NULL,
  start_time DOUBLE PRECISION,
  end_time DOUBLE PRECISION,
  is_final BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meeting_id ON transcript_chunks(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_time ON transcript_chunks(meeting_id, start_time);

