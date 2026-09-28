import React, { useState } from 'react';
import { TimeControlKey, TIME_CONTROLS } from '../types/chess';
import { X, Copy, Check, Users, Sparkles, Clock } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (params: {
    timeControlKey: TimeControlKey;
    customInitialSec?: number;
    customIncrementSec?: number;
    preferredColor: 'w' | 'b' | 'random';
    rated: boolean;
    isPrivate: boolean;
  }) => void;
  createdRoomCode?: string | null;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
  createdRoomCode,
}) => {
  const [selectedTc, setSelectedTc] = useState<TimeControlKey>('blitz_3_2');
  const [customMinutes, setCustomMinutes] = useState(5);
  const [customIncrement, setCustomIncrement] = useState(3);
  const [preferredColor, setPreferredColor] = useState<'w' | 'b' | 'random'>('random');
  const [isRated, setIsRated] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const inviteLink = createdRoomCode
    ? `${window.location.origin}/#room=${createdRoomCode}`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categories = ['Bullet', 'Blitz', 'Rapid'] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {createdRoomCode ? (
          /* Room Created View with Invite Link */
          <div className="text-center py-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-4 text-amber-400">
              <Users className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-slate-100">Room Created!</h3>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              Share this invite code or link with a friend to start playing immediately.
            </p>

            {/* Room Code Badge */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-4">
              <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold block mb-1">
                Room Code
              </span>
              <span className="text-3xl font-mono font-extrabold text-amber-400 tracking-wider">
                {createdRoomCode}
              </span>
            </div>

            {/* Copyable Link */}
            <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl p-2 mb-6">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="bg-transparent text-xs text-slate-300 font-mono flex-1 outline-none px-2 truncate"
              />
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex items-center justify-center space-x-2 text-xs text-amber-400/90 bg-amber-500/10 py-2.5 px-4 rounded-xl border border-amber-500/20 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Waiting for your opponent to join...</span>
            </div>
          </div>
        ) : (
          /* Configuration View */
          <div>
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#81b64c]/20 border border-[#81b64c]/40 flex items-center justify-center text-[#81b64c]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Play a Friend</h3>
                <p className="text-xs text-[#989795]">Invite via custom link or room code</p>
              </div>
            </div>

            {/* Time Control Options */}
            <div className="space-y-4 mb-5">
              {categories.map((cat) => (
                <div key={cat}>
                  <span className="text-xs font-semibold text-[#989795] uppercase tracking-wider mb-2 block">
                    {cat}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.values(TIME_CONTROLS)
                      .filter((tc) => tc.category === cat)
                      .map((tc) => {
                        const isSelected = selectedTc === tc.key;
                        return (
                          <button
                            key={tc.key}
                            onClick={() => setSelectedTc(tc.key)}
                            className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                              isSelected
                                ? 'bg-[#81b64c] text-white border-[#537c2b] shadow-md shadow-[#81b64c]/20'
                                : 'bg-[#312e2b] hover:bg-[#3d3a34] text-[#c3c2c1] border-[#3d3a34]'
                            }`}
                          >
                            {tc.name}
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}

              {/* Custom Time Control */}
              <div>
                <button
                  onClick={() => setSelectedTc('custom')}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold border transition mb-2 ${
                    selectedTc === 'custom'
                      ? 'bg-[#81b64c] text-white border-[#537c2b]'
                      : 'bg-[#312e2b] hover:bg-[#3d3a34] text-[#c3c2c1] border-[#3d3a34]'
                  }`}
                >
                  Custom Time Control
                </button>

                {selectedTc === 'custom' && (
                  <div className="bg-[#211f1c] p-3.5 rounded-xl border border-[#36322d] space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-[#989795] mb-1">
                        <span>Minutes per side:</span>
                        <span className="font-bold text-[#81b64c]">{customMinutes} min</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="60"
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(Number(e.target.value))}
                        className="w-full accent-[#81b64c]"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-[#989795] mb-1">
                        <span>Increment per move:</span>
                        <span className="font-bold text-[#81b64c]">+{customIncrement} sec</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        value={customIncrement}
                        onChange={(e) => setCustomIncrement(Number(e.target.value))}
                        className="w-full accent-[#81b64c]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Side preference */}
            <div className="mb-5">
              <span className="text-xs font-semibold text-[#989795] uppercase tracking-wider mb-2 block">
                I play as
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'w', label: 'White' },
                  { key: 'random', label: 'Random' },
                  { key: 'b', label: 'Black' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setPreferredColor(item.key as 'w' | 'b' | 'random')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                      preferredColor === item.key
                        ? 'bg-white text-[#262421] border-white shadow-md'
                        : 'bg-[#312e2b] hover:bg-[#3d3a34] text-[#c3c2c1] border-[#3d3a34]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rated Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#211f1c] border border-[#36322d] mb-6">
              <div>
                <span className="text-xs font-bold text-white block">Rated Match</span>
                <span className="text-[11px] text-[#989795] block">
                  Updates player rating on ChessKiDuniya.com
                </span>
              </div>
              <input
                type="checkbox"
                checked={isRated}
                onChange={(e) => setIsRated(e.target.checked)}
                className="w-5 h-5 accent-[#81b64c] rounded cursor-pointer"
              />
            </div>

            {/* Submit */}
            <button
              onClick={() =>
                onCreateRoom({
                  timeControlKey: selectedTc,
                  customInitialSec: customMinutes * 60,
                  customIncrementSec: customIncrement,
                  preferredColor,
                  rated: isRated,
                  isPrivate: true,
                })
              }
              className="w-full py-3 bg-[#81b64c] hover:bg-[#a3d160] text-white font-extrabold text-sm rounded-xl shadow-lg shadow-[#81b64c]/20 border-b-[3px] border-[#537c2b] transition flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Challenge Link</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
