import { Chess } from 'chess.js';
import { GameState, MoveRecord, PieceColor, PieceType, TimeControl } from '../src/types/chess';
import { db } from './db';

export function calculateEloChange(
  whiteRating: number,
  blackRating: number,
  result: 'w' | 'b' | 'draw',
  kFactor = 32
): { whiteDiff: number; blackDiff: number; whiteAfter: number; blackAfter: number } {
  const expectedWhite = 1 / (1 + Math.pow(10, (blackRating - whiteRating) / 400));
  const expectedBlack = 1 - expectedWhite;

  const actualWhite = result === 'w' ? 1 : result === 'b' ? 0 : 0.5;
  const actualBlack = 1 - actualWhite;

  const whiteDiff = Math.round(kFactor * (actualWhite - expectedWhite));
  const blackDiff = Math.round(kFactor * (actualBlack - expectedBlack));

  return {
    whiteDiff,
    blackDiff,
    whiteAfter: Math.max(100, whiteRating + whiteDiff),
    blackAfter: Math.max(100, blackRating + blackDiff),
  };
}

export class ChessRoom {
  public state: GameState;
  public chess: Chess;
  private timerInterval: NodeJS.Timeout | null = null;
  private onStateUpdate: (state: GameState) => void;

  constructor(
    id: string,
    code: string,
    timeControl: TimeControl,
    rated = true,
    isPrivate = false,
    onStateUpdate: (state: GameState) => void
  ) {
    this.chess = new Chess();
    this.onStateUpdate = onStateUpdate;

    this.state = {
      id,
      code,
      isPrivate,
      rated,
      timeControl,
      fen: this.chess.fen(),
      pgn: '',
      turn: 'w',
      status: 'waiting',
      winner: null,
      resultReason: null,
      white: null,
      black: null,
      spectators: [],
      whiteTimeLeft: timeControl.initialSeconds,
      blackTimeLeft: timeControl.initialSeconds,
      lastMoveTime: null,
      moves: [],
      isCheck: false,
      drawOfferFrom: null,
      rematchOfferedBy: null,
      chat: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  public startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (this.state.status !== 'in_progress') {
        this.stopTimer();
        return;
      }

      if (this.state.turn === 'w') {
        this.state.whiteTimeLeft = Math.max(0, this.state.whiteTimeLeft - 1);
        if (this.state.whiteTimeLeft === 0) {
          this.endGame('b', 'White ran out of time');
          return;
        }
      } else {
        this.state.blackTimeLeft = Math.max(0, this.state.blackTimeLeft - 1);
        if (this.state.blackTimeLeft === 0) {
          this.endGame('w', 'Black ran out of time');
          return;
        }
      }

      this.state.updatedAt = Date.now();
      this.onStateUpdate(this.state);
    }, 1000);
  }

  public stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public makeMove(
    from: string,
    to: string,
    promotion?: PieceType
  ): { success: boolean; error?: string; moveRecord?: MoveRecord } {
    if (this.state.status !== 'in_progress') {
      return { success: false, error: 'Game is not in progress' };
    }

    try {
      const move = this.chess.move({
        from,
        to,
        promotion: promotion || 'q',
      });

      if (!move) {
        return { success: false, error: 'Illegal move' };
      }

      // Add increment
      const prevTurn = this.state.turn;
      if (prevTurn === 'w') {
        this.state.whiteTimeLeft += this.state.timeControl.incrementSeconds;
      } else {
        this.state.blackTimeLeft += this.state.timeControl.incrementSeconds;
      }

      const moveRecord: MoveRecord = {
        from: move.from,
        to: move.to,
        san: move.san,
        piece: move.piece as PieceType,
        color: move.color as PieceColor,
        captured: move.captured as PieceType | undefined,
        promotion: move.promotion as PieceType | undefined,
        flags: move.flags,
        fenAfter: this.chess.fen(),
        timestamp: Date.now(),
        whiteTimeLeft: this.state.whiteTimeLeft,
        blackTimeLeft: this.state.blackTimeLeft,
      };

      this.state.moves.push(moveRecord);
      this.state.fen = this.chess.fen();
      this.state.pgn = this.chess.pgn();
      this.state.turn = this.chess.turn() as PieceColor;
      this.state.isCheck = this.chess.isCheck();
      this.state.lastMoveTime = Date.now();
      this.state.updatedAt = Date.now();
      this.state.drawOfferFrom = null; // Clear draw offer upon move

      // Check game-over conditions
      if (this.chess.isCheckmate()) {
        const winner = prevTurn; // Player who just moved delivered mate
        this.endGame(winner, `Checkmate! ${winner === 'w' ? 'White' : 'Black'} wins.`);
      } else if (this.chess.isStalemate()) {
        this.endGame('draw', 'Draw by stalemate');
      } else if (this.chess.isThreefoldRepetition()) {
        this.endGame('draw', 'Draw by threefold repetition');
      } else if (this.chess.isInsufficientMaterial()) {
        this.endGame('draw', 'Draw by insufficient material');
      } else if (this.chess.isDraw()) {
        this.endGame('draw', 'Draw by 50-move rule');
      }

      this.onStateUpdate(this.state);
      return { success: true, moveRecord };
    } catch {
      return { success: false, error: 'Invalid move' };
    }
  }

  public resign(color: PieceColor) {
    if (this.state.status !== 'in_progress') return;
    const winner: PieceColor = color === 'w' ? 'b' : 'w';
    this.endGame(winner, `${color === 'w' ? 'White' : 'Black'} resigned`);
  }

  public abortGame() {
    if (this.state.moves.length > 2) return;
    this.state.status = 'aborted';
    this.state.resultReason = 'Game aborted by player';
    this.stopTimer();
    this.onStateUpdate(this.state);
  }

  public offerDraw(from: PieceColor) {
    if (this.state.status !== 'in_progress') return;
    this.state.drawOfferFrom = from;
    this.onStateUpdate(this.state);
  }

  public respondDraw(accept: boolean) {
    if (this.state.status !== 'in_progress') return;
    if (accept) {
      this.endGame('draw', 'Draw agreed by mutual consent');
    } else {
      this.state.drawOfferFrom = null;
      this.onStateUpdate(this.state);
    }
  }

  public async endGame(winner: PieceColor | 'draw', reason: string) {
    this.stopTimer();

    if (winner === 'draw') {
      this.state.status = 'draw_agreement';
      this.state.winner = 'draw';
    } else {
      this.state.status = 'checkmate';
      this.state.winner = winner;
    }
    this.state.resultReason = reason;
    this.state.updatedAt = Date.now();

    // Calculate rating changes if rated and two players present
    let whiteRatingChange = 0;
    let blackRatingChange = 0;

    if (this.state.rated && this.state.white && this.state.black) {
      const elo = calculateEloChange(
        this.state.white.rating,
        this.state.black.rating,
        winner
      );
      whiteRatingChange = elo.whiteDiff;
      blackRatingChange = elo.blackDiff;

      this.state.white.rating = elo.whiteAfter;
      this.state.black.rating = elo.blackAfter;

      // Update in database
      const whiteResult = winner === 'w' ? 'win' : winner === 'b' ? 'loss' : 'draw';
      const blackResult = winner === 'b' ? 'win' : winner === 'w' ? 'loss' : 'draw';

      await Promise.all([
        db.updateUserStats(this.state.white.id, whiteResult, elo.whiteAfter),
        db.updateUserStats(this.state.black.id, blackResult, elo.blackAfter),
      ]);
    }

    // Persist completed game to database
    await db.saveGame({
      id: this.state.id,
      room_code: this.state.code,
      white_id: this.state.white?.id,
      black_id: this.state.black?.id,
      white_name: this.state.white?.name || 'White',
      black_name: this.state.black?.name || 'Black',
      winner: this.state.winner,
      result_reason: this.state.resultReason,
      time_control_key: this.state.timeControl.key,
      time_initial_sec: this.state.timeControl.initialSeconds,
      time_increment_sec: this.state.timeControl.incrementSeconds,
      rated: this.state.rated,
      pgn: this.state.pgn,
      fen: this.state.fen,
      moves_json: this.state.moves,
      white_rating_change: whiteRatingChange,
      black_rating_change: blackRatingChange,
      created_at: new Date(this.state.createdAt).toISOString(),
      finished_at: new Date().toISOString(),
    });

    this.onStateUpdate(this.state);
  }

  // Restart/Rematch
  public resetForRematch() {
    this.chess = new Chess();
    this.stopTimer();

    // Swap colors
    const oldWhite = this.state.white;
    const oldBlack = this.state.black;

    this.state.white = oldBlack ? { ...oldBlack, color: 'w' } : null;
    this.state.black = oldWhite ? { ...oldWhite, color: 'b' } : null;

    this.state.fen = this.chess.fen();
    this.state.pgn = '';
    this.state.turn = 'w';
    this.state.status = 'in_progress';
    this.state.winner = null;
    this.state.resultReason = null;
    this.state.whiteTimeLeft = this.state.timeControl.initialSeconds;
    this.state.blackTimeLeft = this.state.timeControl.initialSeconds;
    this.state.lastMoveTime = Date.now();
    this.state.moves = [];
    this.state.isCheck = false;
    this.state.drawOfferFrom = null;
    this.state.rematchOfferedBy = null;
    this.state.updatedAt = Date.now();

    this.startTimer();
    this.onStateUpdate(this.state);
  }
}
