import React, { useState } from 'react';
import { Flag, RotateCcw, Volume2, VolumeX, Mic, MicOff, RefreshCw, Handshake } from 'lucide-react';
import { GameStatus } from '../types/chess';

interface GameControlsProps {
  status: GameStatus;
  canAbort: boolean;
  isMyTurn: boolean;
  isParticipant: boolean;
  soundEnabled: boolean;
  ttsEnabled: boolean;
  rematchOffered: boolean;
  drawOfferedByOpponent: boolean;
  onResign: () => void;
  onAbort: () => void;
  onOfferDraw: () => void;
  onRespondDraw: (accept: boolean) => void;
  onRematch: () => void;
  onFlipBoard: () => void;
  onToggleSound: () => void;
  onToggleTts: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  status,
  canAbort,
  isParticipant,
  soundEnabled,
  ttsEnabled,
  rematchOffered,
  drawOfferedByOpponent,
  onResign,
  onAbort,
  onOfferDraw,
  onRespondDraw,
  onRematch,
  onFlipBoard,
  onToggleSound,
  onToggleTts,
}) => {
  const [showResignConfirm, setShowResignConfirm] = useState(false);
  const isGameActive = status === 'in_progress';
  const isGameOver = status !== 'waiting' && status !== 'in_progress';

  return (
    <div className="flex flex-col space-y-2 w-full">
      {/* Draw Offer Notification Banner */}
      {drawOfferedByOpponent && isGameActive && (
        <div className="bg-[#81b64c]/20 border border-[#81b64c]/50 rounded-xl p-3 flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-2">
            <Handshake className="w-5 h-5 text-[#81b64c]" />
            <span className="text-xs font-semibold text-white">
              Opponent offered a draw!
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onRespondDraw(true)}
              className="px-3 py-1 bg-[#81b64c] hover:bg-[#a3d160] text-white text-xs font-bold rounded-lg transition"
            >
              Accept
            </button>
            <button
              onClick={() => onRespondDraw(false)}
              className="px-3 py-1 bg-[#312e2b] hover:bg-[#3d3a34] text-[#c3c2c1] text-xs font-bold rounded-lg transition"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Main Action Bar */}
      <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 bg-[#262421] border border-[#36322d] p-2 rounded-xl">
        {/* Draw Offer / Abort button */}
        {isGameActive && isParticipant ? (
          canAbort ? (
            <button
              onClick={onAbort}
              className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-[#312e2b] hover:bg-[#fa412d]/20 hover:text-[#fa412d] text-[#c3c2c1] text-xs font-semibold transition"
            >
              <RotateCcw className="w-4 h-4 text-[#989795]" />
              <span>Abort</span>
            </button>
          ) : (
            <button
              onClick={onOfferDraw}
              className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-[#312e2b] hover:bg-[#3d3a34] text-[#c3c2c1] text-xs font-semibold transition"
            >
              <Handshake className="w-4 h-4 text-[#81b64c]" />
              <span>Draw</span>
            </button>
          )
        ) : null}

        {/* Resign Button */}
        {isGameActive && isParticipant && (
          <button
            onClick={() => setShowResignConfirm(true)}
            className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-[#312e2b] hover:bg-[#fa412d]/20 hover:text-[#fa412d] text-[#c3c2c1] text-xs font-semibold transition"
          >
            <Flag className="w-4 h-4 text-[#fa412d]" />
            <span>Resign</span>
          </button>
        )}

        {/* Rematch Button (when game over) */}
        {isGameOver && isParticipant && (
          <button
            onClick={onRematch}
            className={`col-span-2 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg font-bold text-xs transition border-b-[2px] ${
              rematchOffered
                ? 'bg-[#81b64c]/20 text-[#a3d160] border-[#81b64c] animate-pulse'
                : 'bg-[#81b64c] hover:bg-[#a3d160] text-white border-[#537c2b]'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>{rematchOffered ? 'Rematch Pending...' : 'Rematch'}</span>
          </button>
        )}

        {/* Flip Board */}
        <button
          onClick={onFlipBoard}
          title="Flip Board"
          className="flex items-center justify-center space-x-1 py-2 px-3 rounded-lg bg-[#312e2b] hover:bg-[#3d3a34] text-[#c3c2c1] hover:text-white text-xs font-semibold transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Flip</span>
        </button>

        {/* Sound toggle */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
          className={`flex items-center justify-center space-x-1 py-2 px-3 rounded-lg text-xs font-semibold transition ${
            soundEnabled ? 'bg-[#312e2b] text-[#c3c2c1] hover:bg-[#3d3a34]' : 'bg-[#312e2b]/40 text-[#5c5955]'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-[#81b64c]" /> : <VolumeX className="w-4 h-4 text-[#5c5955]" />}
          <span className="hidden sm:inline">SFX</span>
        </button>

        {/* Gemini TTS commentary toggle */}
        <button
          onClick={onToggleTts}
          title={ttsEnabled ? 'Mute AI Commentary' : 'Enable AI Commentary'}
          className={`flex items-center justify-center space-x-1 py-2 px-3 rounded-lg text-xs font-semibold transition ${
            ttsEnabled ? 'bg-[#312e2b] text-[#c3c2c1] hover:bg-[#3d3a34]' : 'bg-[#312e2b]/40 text-[#5c5955]'
          }`}
        >
          {ttsEnabled ? <Mic className="w-4 h-4 text-[#e68f00]" /> : <MicOff className="w-4 h-4 text-[#5c5955]" />}
          <span className="hidden sm:inline">Voice</span>
        </button>
      </div>

      {/* Resign Confirmation Modal */}
      {showResignConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-3">
              <Flag className="w-6 h-6 text-rose-400" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-1">Resign Game?</h3>
            <p className="text-xs text-slate-400 mb-5">
              Are you sure you want to surrender? This counts as an official loss and updates your rating.
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowResignConfirm(false)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
              >
                Keep Playing
              </button>
              <button
                onClick={() => {
                  setShowResignConfirm(false);
                  onResign();
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition"
              >
                Yes, Resign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
