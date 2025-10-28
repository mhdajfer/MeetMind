CREATE TABLE IF NOT EXISTS meetings (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',     -- active | completed
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  duration INT,
  deepgram_session_id VARCHAR(100),
  language VARCHAR(10) DEFAULT 'en-US'
);
