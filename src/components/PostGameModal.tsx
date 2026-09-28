import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameStatus, PieceColor, Player } from '../types/chess';
import { sounds } from '../services/soundService';
import { Trophy, Award, RefreshCw, Sparkles, X } from 'lucide-react';

interface PostGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: GameStatus;
  winner: PieceColor | 'draw' | null;
  resultReason: string | null;
  whitePlayer: Player | null;
  blackPlayer: Player | null;
  myColor?: PieceColor | null;
  onRematch: () => void;
  onOpenCoach: () => void;
}

export const PostGameModal: React.FC<PostGameModalProps> = ({
  isOpen,
  onClose,
  status,
  winner,
  resultReason,
  whitePlayer,
  blackPlayer,
  myColor,
  onRematch,
  onOpenCoach,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const isDraw = winner === 'draw';
    const isMyWin = myColor && winner === myColor;
    const isMyLoss = myColor && !isDraw && winner !== myColor;

    if (isMyWin) {
      sounds.playVictory();
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#EC4899'],
      });
    } else if (isMyLoss) {
      sounds.playDefeat();
    } else {
      sounds.playVictory();
    }
  }, [isOpen, winner, myColor]);

  if (!isOpen) return null;

  const isDraw = winner === 'draw';
  const isMyWin = myColor && winner === myColor;
  const isMyLoss = myColor && !isDraw && winner !== myColor;

  let title = 'Game Concluded';
  let badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';

  if (isDraw) {
    title = 'Draw!';
    badgeColor = 'text-slate-300 bg-slate-800 border-slate-700';
  } else if (isMyWin) {
    title = 'Victory!';
    badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  } else if (isMyLoss) {
    title = 'Defeat';
    badgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  } else {
    title = `${winner === 'w' ? 'White' : 'Black'} Wins!`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-center animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon banner */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-4 text-amber-400 shadow-xl shadow-amber-500/10">
          {isDraw ? <Award className="w-8 h-8" /> : <Trophy className="w-8 h-8" />}
        </div>

        <h2 className="text-2xl font-extrabold text-slate-100">{title}</h2>
        <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border mt-2 mb-4 ${badgeColor}`}>
          {resultReason || (status === 'checkmate' ? 'Checkmate' : 'Game Finished')}
        </div>

        {/* Players & Ratings summary */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 mb-5 text-left">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-white border border-slate-400" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-200 truncate">{whitePlayer?.name || 'White'}</div>
              <div className="text-[11px] font-mono text-slate-400">{whitePlayer?.rating ?? 1200} ELO</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-600" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-200 truncate">{blackPlayer?.name || 'Black'}</div>
              <div className="text-[11px] font-mono text-slate-400">{blackPlayer?.rating ?? 1200} ELO</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => {
              onClose();
              onOpenCoach();
            }}
            className="w-full py-3 bg-[#81b64c] hover:bg-[#a3d160] text-white font-extrabold text-sm rounded-xl shadow-lg shadow-[#81b64c]/20 border-b-[3px] border-[#537c2b] transition flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4 fill-white" />
            <span>Game Review & Coach Analysis</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onRematch();
            }}
            className="w-full py-2.5 bg-[#312e2b] hover:bg-[#3d3a34] text-[#c3c2c1] font-bold text-xs rounded-xl border border-[#3d3a34] transition flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Rematch</span>
          </button>
        </div>
      </div>
    </div>
  );
};
