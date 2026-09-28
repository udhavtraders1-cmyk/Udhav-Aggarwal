export type TimeControlKey =
  | 'bullet_1_0'
  | 'bullet_2_1'
  | 'blitz_3_0'
  | 'blitz_3_2'
  | 'blitz_5_0'
  | 'blitz_5_3'
  | 'rapid_10_0'
  | 'rapid_15_10'
  | 'rapid_30_0'
  | 'custom';

export interface TimeControl {
  key: TimeControlKey;
  name: string;
  category: 'Bullet' | 'Blitz' | 'Rapid' | 'Custom';
  initialSeconds: number;
  incrementSeconds: number;
}

export const TIME_CONTROLS: Record<TimeControlKey, TimeControl> = {
  bullet_1_0: { key: 'bullet_1_0', name: '1 min', category: 'Bullet', initialSeconds: 60, incrementSeconds: 0 },
  bullet_2_1: { key: 'bullet_2_1', name: '2 | 1', category: 'Bullet', initialSeconds: 120, incrementSeconds: 1 },
  blitz_3_0: { key: 'blitz_3_0', name: '3 min', category: 'Blitz', initialSeconds: 180, incrementSeconds: 0 },
  blitz_3_2: { key: 'blitz_3_2', name: '3 | 2', category: 'Blitz', initialSeconds: 180, incrementSeconds: 2 },
  blitz_5_0: { key: 'blitz_5_0', name: '5 min', category: 'Blitz', initialSeconds: 300, incrementSeconds: 0 },
  blitz_5_3: { key: 'blitz_5_3', name: '5 | 3', category: 'Blitz', initialSeconds: 300, incrementSeconds: 3 },
  rapid_10_0: { key: 'rapid_10_0', name: '10 min', category: 'Rapid', initialSeconds: 600, incrementSeconds: 0 },
  rapid_15_10: { key: 'rapid_15_10', name: '15 | 10', category: 'Rapid', initialSeconds: 900, incrementSeconds: 10 },
  rapid_30_0: { key: 'rapid_30_0', name: '30 min', category: 'Rapid', initialSeconds: 1800, incrementSeconds: 0 },
  custom: { key: 'custom', name: 'Custom', category: 'Custom', initialSeconds: 300, incrementSeconds: 5 },
};

export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export interface Player {
  id: string;
  name: string;
  rating: number;
  avatar: string;
  isGuest: boolean;
  color?: PieceColor;
  connected?: boolean;
}

export type GameStatus =
  | 'waiting'
  | 'in_progress'
  | 'checkmate'
  | 'stalemate'
  | 'draw_agreement'
  | 'draw_repetition'
  | 'draw_50move'
  | 'draw_material'
  | 'resigned'
  | 'timeout'
  | 'aborted';

export interface MoveRecord {
  from: string;
  to: string;
  san: string;
  piece: PieceType;
  color: PieceColor;
  captured?: PieceType;
  promotion?: PieceType;
  flags: string;
  fenAfter: string;
  timestamp: number;
  whiteTimeLeft: number;
  blackTimeLeft: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface CapturedPieces {
  w: PieceType[];
  b: PieceType[];
  advantage: {
    color: PieceColor | null;
    diff: number;
  };
}

export interface GameState {
  id: string;
  code: string;
  isPrivate: boolean;
  rated: boolean;
  timeControl: TimeControl;
  fen: string;
  pgn: string;
  turn: PieceColor;
  status: GameStatus;
  winner: PieceColor | 'draw' | null;
  resultReason: string | null;
  white: Player | null;
  black: Player | null;
  spectators: Player[];
  whiteTimeLeft: number;
  blackTimeLeft: number;
  lastMoveTime: number | null;
  moves: MoveRecord[];
  isCheck: boolean;
  drawOfferFrom: PieceColor | null;
  rematchOfferedBy: string | null;
  chat: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface EloChange {
  whiteBefore: number;
  whiteAfter: number;
  whiteDiff: number;
  blackBefore: number;
  blackAfter: number;
  blackDiff: number;
}

export interface GameAnalysisReview {
  summary: string;
  whiteAccuracy: number;
  blackAccuracy: number;
  keyMoments: {
    moveNumber: number;
    san: string;
    color: PieceColor;
    judgment: 'Best' | 'Excellent' | 'Good' | 'Inaccuracy' | 'Mistake' | 'Blunder' | 'Brilliant';
    comment: string;
  }[];
  openingName?: string;
  tacticalAdvice: string;
}

export interface Friend {
  id: string;
  name: string;
  rating: number;
  avatar: string;
  online: boolean;
  inGame?: boolean;
  roomId?: string;
}

export type BoardTheme = 'emerald' | 'wood' | 'slate' | 'cyber' | 'royal';
export type PieceTheme = 'classic' | 'modern' | 'alpha';
