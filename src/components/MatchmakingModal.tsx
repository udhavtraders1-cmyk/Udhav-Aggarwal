import React, { useState, useEffect } from 'react';
import { TimeControlKey, TIME_CONTROLS } from '../types/chess';
import { X, Zap, Bot, Loader2 } from 'lucide-react';

interface MatchmakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQueue: (tcKey: TimeControlKey) => void;
  onCancelQueue: () => void;
  onPlayBot: (tcKey: TimeControlKey) => void;
  isSearching: boolean;
}

export const MatchmakingModal: React.FC<MatchmakingModalProps> = ({
  isOpen,
  onClose,
  onQueue,
  onCancelQueue,
  onPlayBot,
  isSearching,
}) => {
  const [selectedTc, setSelectedTc] = useState<TimeControlKey>('blitz_3_2');
  const [searchTimer, setSearchTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearching) {
      setSearchTimer(0);
      interval = setInterval(() => {
        setSearchTimer((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  if (!isOpen) return null;

  const quickControls: TimeControlKey[] = ['bullet_1_0', 'blitz_3_0', 'blitz_3_2', 'blitz_5_0', 'rapid_10_0'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95">
        <button
          onClick={() => {
            if (isSearching) onCancelQueue();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {isSearching ? (
          /* Radar searching view */
          <div className="text-center py-4">
            <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-amber-500/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-amber-500/40 animate-pulse" />
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/20">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-100">Searching for Opponent...</h3>
            <p className="text-xs text-slate-400 mt-1 mb-2">
              Time Control: {TIME_CONTROLS[selectedTc]?.name}
            </p>
            <div className="font-mono text-xl font-extrabold text-amber-400 mb-6">
              00:{String(searchTimer).padStart(2, '0')}
            </div>

            <div className="space-y-2">
              <button
                onClick={onCancelQueue}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
              >
                Cancel Search
              </button>

              <button
                onClick={() => {
                  onCancelQueue();
                  onPlayBot(selectedTc);
                  onClose();
                }}
                className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5"
              >
                <Bot className="w-4 h-4" />
                <span>Play Against Grandmaster Bot Now</span>
              </button>
            </div>
          </div>
        ) : (
          /* Selection View */
          <div>
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Quick Matchmaking</h3>
                <p className="text-xs text-slate-400">Find an online opponent in seconds</p>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <span className="text-xs font-semibold text-[#989795] uppercase tracking-wider block">
                Select Time Format
              </span>
              <div className="grid grid-cols-2 gap-2">
                {quickControls.map((tcKey) => {
                  const tc = TIME_CONTROLS[tcKey];
                  const isSelected = selectedTc === tcKey;
                  return (
                    <button
                      key={tcKey}
                      onClick={() => setSelectedTc(tcKey)}
                      className={`p-3 rounded-xl border text-left transition ${
                        isSelected
                          ? 'bg-[#81b64c] text-white border-[#537c2b] font-bold shadow-md shadow-[#81b64c]/20'
                          : 'bg-[#312e2b] hover:bg-[#3d3a34] text-[#c3c2c1] border-[#3d3a34]'
                      }`}
                    >
                      <div className="text-sm font-extrabold">{tc.name}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-[#989795]'}`}>
                        {tc.category}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => onQueue(selectedTc)}
                className="w-full py-3 bg-[#81b64c] hover:bg-[#a3d160] text-white font-extrabold text-sm rounded-xl shadow-lg shadow-[#81b64c]/20 border-b-[3px] border-[#537c2b] transition flex items-center justify-center space-x-2"
              >
                <Zap className="w-4 h-4 fill-white text-white" />
                <span>Play Online</span>
              </button>

              <button
                onClick={() => {
                  onPlayBot(selectedTc);
                  onClose();
                }}
                className="w-full py-2.5 bg-[#312e2b] hover:bg-[#3d3a34] text-[#c3c2c1] font-semibold text-xs rounded-xl border border-[#3d3a34] transition flex items-center justify-center space-x-2"
              >
                <Bot className="w-4 h-4 text-[#e68f00]" />
                <span>Practice vs Bot</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
