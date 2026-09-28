import pg from 'pg';
import fs from 'fs';
import path from 'path';

export interface DbUser {
  id: string;
  username: string;
  email?: string;
  password_hash?: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  avatar_url: string;
  is_guest: boolean;
  created_at: string;
}

export interface DbGame {
  id: string;
  room_code: string;
  white_id?: string;
  black_id?: string;
  white_name: string;
  black_name: string;
  winner: string | null;
  result_reason: string | null;
  time_control_key: string;
  time_initial_sec: number;
  time_increment_sec: number;
  rated: boolean;
  pgn: string;
  fen: string;
  moves_json: unknown;
  white_rating_change: number;
  black_rating_change: number;
  created_at: string;
  finished_at?: string;
}

class DatabaseManager {
  private pool: pg.Pool | null = null;
  private isPgAvailable = false;

  // Local fallback storage
  private fallbackUsers: Map<string, DbUser> = new Map();
  private fallbackGames: DbGame[] = [];
  private fallbackFriends: Map<string, Set<string>> = new Map();

  constructor() {
    this.init();
  }

  private async init() {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      try {
        this.pool = new pg.Pool({
          connectionString: dbUrl,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
        });

        // Test connection
        const client = await this.pool.connect();
        this.isPgAvailable = true;
        client.release();
        console.log('[DB] Connected successfully to PostgreSQL database.');

        // Initialize schema
        const schemaPath = path.resolve(__dirname, 'schema.sql');
        if (fs.existsSync(schemaPath)) {
          const sql = fs.readFileSync(schemaPath, 'utf8');
          await this.pool.query(sql);
          console.log('[DB] PostgreSQL schema checked/initialized.');
        }
      } catch (err) {
        console.warn('[DB] PostgreSQL connection failed, switching to in-memory/disk store:', err);
        this.isPgAvailable = false;
        this.loadLocalData();
      }
    } else {
      console.log('[DB] No DATABASE_URL specified. Running with high-performance memory storage.');
      this.loadLocalData();
    }
  }

  private loadLocalData() {
    // Seed default bots/players for immediate play
    const stockfishBot: DbUser = {
      id: 'bot_grandmaster',
      username: 'Grandmaster Bot',
      rating: 2200,
      wins: 154,
      losses: 23,
      draws: 41,
      avatar_url: 'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=150&auto=format&fit=crop&q=80',
      is_guest: false,
      created_at: new Date().toISOString(),
    };
    this.fallbackUsers.set(stockfishBot.id, stockfishBot);
  }

  // --- Users ---
  public async getOrCreateUser(userData: {
    id: string;
    username: string;
    avatar_url: string;
    is_guest: boolean;
    rating?: number;
  }): Promise<DbUser> {
    if (this.isPgAvailable && this.pool) {
      try {
        const res = await this.pool.query('SELECT * FROM users WHERE id = $1', [userData.id]);
        if (res.rows.length > 0) {
          return res.rows[0];
        }
        const insertRes = await this.pool.query(
          `INSERT INTO users (id, username, avatar_url, is_guest, rating)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE SET last_active = CURRENT_TIMESTAMP
           RETURNING *`,
          [userData.id, userData.username, userData.avatar_url, userData.is_guest, userData.rating || 1200]
        );
        return insertRes.rows[0];
      } catch (err) {
        console.error('[DB] PG getOrCreateUser error:', err);
      }
    }

    // Fallback store
    let user = this.fallbackUsers.get(userData.id);
    if (!user) {
      user = {
        id: userData.id,
        username: userData.username,
        avatar_url: userData.avatar_url,
        is_guest: userData.is_guest,
        rating: userData.rating || 1200,
        wins: 0,
        losses: 0,
        draws: 0,
        created_at: new Date().toISOString(),
      };
      this.fallbackUsers.set(user.id, user);
    }
    return user;
  }

  public async updateUserStats(
    userId: string,
    result: 'win' | 'loss' | 'draw',
    newRating: number
  ): Promise<void> {
    if (this.isPgAvailable && this.pool) {
      try {
        const col = result === 'win' ? 'wins = wins + 1' : result === 'loss' ? 'losses = losses + 1' : 'draws = draws + 1';
        await this.pool.query(
          `UPDATE users SET ${col}, rating = $1, last_active = CURRENT_TIMESTAMP WHERE id = $2`,
          [newRating, userId]
        );
        return;
      } catch (err) {
        console.error('[DB] PG updateUserStats error:', err);
      }
    }

    const user = this.fallbackUsers.get(userId);
    if (user) {
      user.rating = newRating;
      if (result === 'win') user.wins++;
      else if (result === 'loss') user.losses++;
      else user.draws++;
    }
  }

  public async getUser(userId: string): Promise<DbUser | null> {
    if (this.isPgAvailable && this.pool) {
      try {
        const res = await this.pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        return res.rows[0] || null;
      } catch (err) {
        console.error('[DB] PG getUser error:', err);
      }
    }
    return this.fallbackUsers.get(userId) || null;
  }

  public async getLeaderboard(limit = 10): Promise<DbUser[]> {
    if (this.isPgAvailable && this.pool) {
      try {
        const res = await this.pool.query(
          'SELECT id, username, rating, wins, losses, draws, avatar_url FROM users ORDER BY rating DESC LIMIT $1',
          [limit]
        );
        return res.rows;
      } catch (err) {
        console.error('[DB] PG getLeaderboard error:', err);
      }
    }

    return Array.from(this.fallbackUsers.values())
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  // --- Games ---
  public async saveGame(game: DbGame): Promise<void> {
    if (this.isPgAvailable && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO games (
            id, room_code, white_id, black_id, white_name, black_name, winner, result_reason,
            time_control_key, time_initial_sec, time_increment_sec, rated, pgn, fen, moves_json,
            white_rating_change, black_rating_change, finished_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, CURRENT_TIMESTAMP)`,
          [
            game.id,
            game.room_code,
            game.white_id || null,
            game.black_id || null,
            game.white_name,
            game.black_name,
            game.winner,
            game.result_reason,
            game.time_control_key,
            game.time_initial_sec,
            game.time_increment_sec,
            game.rated,
            game.pgn,
            game.fen,
            JSON.stringify(game.moves_json),
            game.white_rating_change,
            game.black_rating_change,
          ]
        );
        return;
      } catch (err) {
        console.error('[DB] PG saveGame error:', err);
      }
    }

    this.fallbackGames.unshift(game);
    if (this.fallbackGames.length > 200) {
      this.fallbackGames.pop();
    }
  }

  public async getUserGames(userId: string, limit = 20): Promise<DbGame[]> {
    if (this.isPgAvailable && this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT * FROM games WHERE white_id = $1 OR black_id = $1 ORDER BY created_at DESC LIMIT $2`,
          [userId, limit]
        );
        return res.rows;
      } catch (err) {
        console.error('[DB] PG getUserGames error:', err);
      }
    }

    return this.fallbackGames
      .filter((g) => g.white_id === userId || g.black_id === userId)
      .slice(0, limit);
  }

  // --- Friends ---
  public async addFriend(userId: string, friendId: string): Promise<boolean> {
    if (userId === friendId) return false;
    let userFriends = this.fallbackFriends.get(userId);
    if (!userFriends) {
      userFriends = new Set();
      this.fallbackFriends.set(userId, userFriends);
    }
    userFriends.add(friendId);
    return true;
  }

  public async getFriends(userId: string): Promise<string[]> {
    const set = this.fallbackFriends.get(userId);
    return set ? Array.from(set) : [];
  }
}

export const db = new DatabaseManager();
