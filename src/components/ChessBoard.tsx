import React, { useState, useEffect } from 'react';
import { Chess, Square } from 'chess.js';
import { BoardTheme, PieceColor, PieceType } from '../types/chess';
import { ChessPiece } from './ChessPieces';

interface ChessBoardProps {
  chess: Chess;
  boardOrientation?: PieceColor;
  theme?: BoardTheme;
  isInteractive?: boolean;
  playerColor?: PieceColor | null;
  lastMove?: { from: string; to: string } | null;
  onMove?: (from: string, to: string, promotion?: PieceType) => void;
}

const THEME_COLORS: Record<BoardTheme, { light: string; dark: string; border: string }> = {
  emerald: {
    light: '#ebecd0', // Authentic Chess.com Green board light square
    dark: '#779556',  // Authentic Chess.com Green board dark square
    border: '#2e2b27',
  },
  wood: {
    light: '#f0d9b5',
    dark: '#b58863',
    border: '#2e2b27',
  },
  slate: {
    light: '#dee3e6',
    dark: '#8ca2ad',
    border: '#262421',
  },
  cyber: {
    light: '#2a3b4c',
    dark: '#16222f',
    border: '#0ea5e9',
  },
  royal: {
    light: '#e0e7ff',
    dark: '#6366f1',
    border: '#4338ca',
  },
};

export const ChessBoard: React.FC<ChessBoardProps> = ({
  chess,
  boardOrientation = 'w',
  theme = 'emerald',
  isInteractive = true,
  playerColor,
  lastMove,
  onMove,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(null);

  const colors = THEME_COLORS[theme] || THEME_COLORS.emerald;
  const isFlipped = boardOrientation === 'b';

  // Files & Ranks
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayFiles = isFlipped ? [...files].reverse() : files;
  const displayRanks = isFlipped ? [...ranks].reverse() : ranks;

  // Clear selection if chess turn changes
  useEffect(() => {
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [chess.fen()]);

  // Find king square if in check
  let checkSquare: string | null = null;
  if (chess.isCheck()) {
    const turn = chess.turn();
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const piece = board[r][f];
        if (piece && piece.type === 'k' && piece.color === turn) {
          checkSquare = `${files[f]}${8 - r}`;
          break;
        }
      }
    }
  }

  const handleSquareClick = (square: string) => {
    if (!isInteractive) return;

    // Check if it's the player's turn to move
    if (playerColor && chess.turn() !== playerColor) {
      return;
    }

    const pieceOnSquare = chess.get(square as Square);

    // If already selected a square and clicked a legal target
    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      if (legalMoves.includes(square)) {
        const movingPiece = chess.get(selectedSquare as Square);
        const isPawnPromotion =
          movingPiece?.type === 'p' &&
          ((movingPiece.color === 'w' && square[1] === '8') ||
            (movingPiece.color === 'b' && square[1] === '1'));

        if (isPawnPromotion) {
          setPendingPromotion({ from: selectedSquare, to: square });
          return;
        }

        // Execute standard move
        if (onMove) {
          onMove(selectedSquare, square);
        }
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }
    }

    // New selection: only allow selecting pieces of the active turn (and player's color if seated)
    if (pieceOnSquare && pieceOnSquare.color === chess.turn()) {
      if (playerColor && pieceOnSquare.color !== playerColor) {
        return;
      }

      setSelectedSquare(square);
      // Calculate legal destinations
      try {
        const moves = chess.moves({ square: square as Square, verbose: true });
        setLegalMoves(moves.map((m) => m.to));
      } catch {
        setLegalMoves([]);
      }
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const completePromotion = (promotionPiece: PieceType) => {
    if (pendingPromotion && onMove) {
      onMove(pendingPromotion.from, pendingPromotion.to, promotionPiece);
    }
    setPendingPromotion(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  return (
    <div className="relative w-full max-w-[560px] aspect-square select-none shadow-2xl rounded-xl overflow-hidden border-[6px] border-[#211f1c]">
      {/* Chess Grid 8x8 */}
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {displayRanks.map((rank, rIdx) =>
          displayFiles.map((file, fIdx) => {
            const square = `${file}${rank}`;
            const isLight = (files.indexOf(file) + parseInt(rank)) % 2 !== 0;
            const piece = chess.get(square as Square);

            const isSelected = selectedSquare === square;
            const isLegalMove = legalMoves.includes(square);
            const isLastMoveFrom = lastMove?.from === square;
            const isLastMoveTo = lastMove?.to === square;
            const isKingInCheck = checkSquare === square;

            return (
              <div
                key={square}
                onClick={() => handleSquareClick(square)}
                style={{
                  backgroundColor: isLight ? colors.light : colors.dark,
                }}
                className={`relative flex items-center justify-center cursor-pointer transition-colors duration-100 ${
                  isLastMoveFrom || isLastMoveTo
                    ? 'after:absolute after:inset-0 after:bg-[#f5f682]/40'
                    : ''
                } ${isSelected ? 'ring-4 ring-inset ring-[#baca44] z-10' : ''} ${
                  isKingInCheck ? 'bg-[#fa412d]/70 animate-pulse' : ''
                }`}
              >
                {/* Board Rank Label (on leftmost column) */}
                {fIdx === 0 && (
                  <span
                    className={`absolute top-0.5 left-1 text-[11px] font-bold font-mono pointer-events-none ${
                      isLight ? 'text-[#779556]' : 'text-[#ebecd0]'
                    }`}
                  >
                    {rank}
                  </span>
                )}

                {/* Board File Label (on bottom row) */}
                {rIdx === 7 && (
                  <span
                    className={`absolute bottom-0.5 right-1 text-[11px] font-bold font-mono pointer-events-none ${
                      isLight ? 'text-[#779556]' : 'text-[#ebecd0]'
                    }`}
                  >
                    {file}
                  </span>
                )}

                {/* Piece Icon */}
                {piece && (
                  <div className="w-[88%] h-[88%] flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
                    <ChessPiece type={piece.type as PieceType} color={piece.color as PieceColor} />
                  </div>
                )}

                {/* Legal Move Indicators (Chess.com style dots and capture rings) */}
                {isLegalMove && !piece && (
                  <div className="absolute w-4 h-4 rounded-full bg-[#1b1917]/25 ring-2 ring-black/10 pointer-events-none" />
                )}
                {isLegalMove && piece && (
                  <div className="absolute inset-0 ring-4 ring-inset ring-[#e11d48]/60 rounded-full scale-90 pointer-events-none animate-pulse" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pawn Promotion Modal Overlay */}
      {pendingPromotion && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#262421] border border-[#3d3a34] rounded-2xl p-5 shadow-2xl text-center max-w-xs w-full animate-in fade-in zoom-in-95">
            <h4 className="text-base font-bold text-white mb-1">Promote Pawn</h4>
            <p className="text-xs text-[#989795] mb-4">Select piece to promote to:</p>

            <div className="grid grid-cols-4 gap-2">
              {(['q', 'r', 'b', 'n'] as PieceType[]).map((pType) => (
                <button
                  key={pType}
                  onClick={() => completePromotion(pType)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#312e2b] hover:bg-[#81b64c]/20 hover:border-[#81b64c] border border-[#3d3a34] transition group"
                >
                  <div className="w-12 h-12 group-hover:scale-110 transition-transform">
                    <ChessPiece type={pType} color={chess.turn() as PieceColor} />
                  </div>
                  <span className="text-[11px] font-bold text-[#c3c2c1] uppercase mt-1">
                    {pType === 'q' ? 'Queen' : pType === 'r' ? 'Rook' : pType === 'b' ? 'Bishop' : 'Knight'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
