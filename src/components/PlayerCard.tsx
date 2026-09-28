import React from 'react';
import { Player, PieceColor, PieceType } from '../types/chess';
import { ChessPiece } from './ChessPieces';

interface PlayerCardProps {
  player: Player | null;
  color: PieceColor;
  isTurn: boolean;
  capturedPieces: PieceType[];
  materialAdvantage: number; // positive if this player has material lead
  isMe?: boolean;
}

const PIECE_VALUES: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  color,
  isTurn,
  capturedPieces,
  materialAdvantage,
  isMe,
}) => {
  // Sort captured pieces by value
  const sortedPieces = [...capturedPieces].sort(
    (a, b) => PIECE_VALUES[b] - PIECE_VALUES[a]
  );

  const opponentColor = color === 'w' ? 'b' : 'w';

  return (
    <div
      className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all duration-150 ${
        isTurn
          ? 'bg-[#312e2b] border-[#81b64c]/70 shadow-sm'
          : 'bg-[#272522] border-[#36322d]'
      }`}
    >
      {/* Player info */}
      <div className="flex items-center space-x-2.5 min-w-0">
        <div className="relative shrink-0">
          <img
            src={player?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${color === 'w' ? 'white' : 'black'}`}
            alt={player?.name || 'Player'}
            className="w-9 h-9 rounded-md object-cover ring-1 ring-[#3d3a34] bg-[#1b1917]"
          />
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#262421] ${
              player?.connected !== false ? 'bg-[#81b64c]' : 'bg-[#fa412d] animate-pulse'
            }`}
            title={player?.connected !== false ? 'Online' : 'Reconnecting...'}
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[130px] sm:max-w-[180px]">
              {player?.name || (color === 'w' ? 'White' : 'Black')}
            </span>
            {isMe && (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#81b64c]/20 text-[#a3d160] border border-[#81b64c]/30">
                YOU
              </span>
            )}
            <span className="text-[11px] text-[#989795] font-mono font-semibold">
              ({player?.rating ?? 1200})
            </span>
          </div>

          {/* Captured pieces and material difference */}
          <div className="flex items-center space-x-1 mt-0.5 overflow-hidden">
            <div className="flex items-center space-x-0.5 max-h-5 overflow-x-auto no-scrollbar">
              {sortedPieces.map((p, idx) => (
                <div key={idx} className="w-3.5 h-3.5 shrink-0 opacity-90">
                  <ChessPiece type={p} color={opponentColor} />
                </div>
              ))}
            </div>
            {materialAdvantage > 0 && (
              <span className="text-[11px] font-bold text-[#81b64c] pl-1 font-mono">
                +{materialAdvantage}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Turn indicator badge */}
      {isTurn && (
        <div className="flex items-center space-x-1 text-[10px] font-bold text-[#81b64c] bg-[#81b64c]/10 px-2 py-0.5 rounded border border-[#81b64c]/30 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-[#81b64c] animate-ping" />
          <span>Move</span>
        </div>
      )}
    </div>
  );
};
