CREATE TABLE IF NOT EXISTS ai_analysis (
  id SERIAL PRIMARY KEY,
  meeting_id INT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,               
  content TEXT NOT NULL,
  model VARCHAR(50) DEFAULT 'gpt-5',
  created_at TIMESTAMP DEFAULT NOW()
);


