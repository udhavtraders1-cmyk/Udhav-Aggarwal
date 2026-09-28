import React, { useState } from 'react';
import { X, User, Trophy, Sparkles, Check, History } from 'lucide-react';
import { Player } from '../types/chess';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  onUpdatePlayer: (updated: Partial<Player>) => void;
  onOpenAvatarGen: () => void;
  userGames?: {
    id: string;
    room_code: string;
    winner: string | null;
    result_reason: string | null;
    white_name: string;
    black_name: string;
    created_at: string;
  }[];
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  player,
  onUpdatePlayer,
  onOpenAvatarGen,
  userGames = [],
}) => {
  const [username, setUsername] = useState(player.name);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    onUpdatePlayer({ name: username.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#81b64c]/20 border border-[#81b64c]/40 flex items-center justify-center text-[#81b64c]">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Player Profile & Stats</h3>
            <p className="text-xs text-[#989795]">ChessKiDuniya.com Official Rating</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="flex items-center space-x-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 mb-5">
          <div className="relative group shrink-0">
            <img
              src={player.avatar}
              alt={player.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-500/50 bg-slate-900"
            />
            <button
              onClick={() => {
                onClose();
                onOpenAvatarGen();
              }}
              title="Generate new avatar with Gemini"
              className="absolute -bottom-1 -right-1 p-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition shadow-lg"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-base font-extrabold text-slate-100 truncate">{player.name}</span>
              {player.isGuest && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Guest
                </span>
              )}
            </div>

            <div className="flex items-center space-x-1.5 mt-1">
              <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-sm font-extrabold font-mono text-amber-400">
                {player.rating} ELO
              </span>
            </div>
          </div>
        </div>

        {/* Stats Counter */}
        <div className="grid grid-cols-3 gap-2 text-center mb-5">
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div className="text-[10px] uppercase font-bold text-slate-400">Rating</div>
            <div className="text-base font-extrabold text-amber-400 font-mono mt-0.5">{player.rating}</div>
          </div>
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div className="text-[10px] uppercase font-bold text-slate-400">Matches</div>
            <div className="text-base font-extrabold text-slate-200 font-mono mt-0.5">{userGames.length}</div>
          </div>
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div className="text-[10px] uppercase font-bold text-slate-400">Rank</div>
            <div className="text-base font-extrabold text-emerald-400 font-mono mt-0.5">
              {player.rating >= 2000 ? 'Master' : player.rating >= 1600 ? 'Expert' : 'Club'}
            </div>
          </div>
        </div>

        {/* Edit Username */}
        <form onSubmit={handleSave} className="mb-5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Display Name
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={24}
              className="flex-1 bg-slate-950 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center space-x-1"
            >
              {saved ? <Check className="w-3.5 h-3.5" /> : null}
              <span>{saved ? 'Saved' : 'Update'}</span>
            </button>
          </div>
        </form>

        {/* Recent Matches */}
        <div>
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <History className="w-3.5 h-3.5" />
            <span>Recent Match History</span>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {userGames.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs italic">
                No recorded games yet. Play a match to build your history!
              </div>
            ) : (
              userGames.slice(0, 5).map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800 text-xs"
                >
                  <span className="font-semibold text-slate-300 truncate max-w-[160px]">
                    {game.white_name} vs {game.black_name}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      game.winner === 'draw'
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {game.winner === 'draw' ? 'Draw' : `${game.winner === 'w' ? 'White' : 'Black'} Win`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
