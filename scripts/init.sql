-- Game Telemetry API - MySQL Schema
-- Run this to set up the relational tables

-- Games registered in the system
CREATE TABLE IF NOT EXISTS games (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  api_key VARCHAR(64) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Player sessions (structured relational data)
CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_id VARCHAR(50) NOT NULL,
  player_id VARCHAR(100),
  platform VARCHAR(50),
  version VARCHAR(20),
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  duration_seconds INT,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  INDEX idx_game_started (game_id, started_at),
  INDEX idx_player (player_id)
);

-- Aggregated daily stats (for fast dashboard queries)
CREATE TABLE IF NOT EXISTS daily_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_id VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  crash_count INT DEFAULT 0,
  session_count INT DEFAULT 0,
  event_count INT DEFAULT 0,
  avg_session_seconds INT,
  unique_players INT DEFAULT 0,
  UNIQUE KEY uk_game_date (game_id, date),
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- Alert history
CREATE TABLE IF NOT EXISTS alert_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_id VARCHAR(50) NOT NULL,
  alert_type VARCHAR(50) NOT NULL,
  message TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  INDEX idx_game_sent (game_id, sent_at)
);

-- Insert a sample game for testing
INSERT INTO games (id, name) VALUES ('demo-game', 'Demo Game') 
ON DUPLICATE KEY UPDATE name = name;
