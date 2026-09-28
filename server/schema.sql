-- Stratagem Chess - PostgreSQL Database Schema

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(32) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    rating INT DEFAULT 1200,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    draws INT DEFAULT 0,
    avatar_url TEXT,
    is_guest BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS games (
    id VARCHAR(64) PRIMARY KEY,
    room_code VARCHAR(16) NOT NULL,
    white_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    black_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    white_name VARCHAR(64),
    black_name VARCHAR(64),
    winner VARCHAR(8), -- 'w', 'b', 'draw'
    result_reason VARCHAR(64),
    time_control_key VARCHAR(32) NOT NULL,
    time_initial_sec INT NOT NULL,
    time_increment_sec INT NOT NULL,
    rated BOOLEAN DEFAULT true,
    pgn TEXT,
    fen TEXT,
    moves_json JSONB,
    white_rating_change INT DEFAULT 0,
    black_rating_change INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS friends (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(16) DEFAULT 'accepted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, friend_id)
);

CREATE TABLE IF NOT EXISTS game_analyses (
    game_id VARCHAR(64) PRIMARY KEY REFERENCES games(id) ON DELETE CASCADE,
    analysis_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_games_white_id ON games(white_id);
CREATE INDEX IF NOT EXISTS idx_games_black_id ON games(black_id);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating DESC);
