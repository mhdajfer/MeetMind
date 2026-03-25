CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',     -- active | completed
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  duration INT,
  deepgram_session_id VARCHAR(100),
  language VARCHAR(10) DEFAULT 'en-US'
);

CREATE INDEX IF NOT EXISTS idx_meetings_user ON meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);

