import React from 'react';
import { sounds } from '../services/soundService';

interface ChessClockProps {
  secondsLeft: number;
  isTurn: boolean;
  isGameActive: boolean;
}

export const ChessClock: React.FC<ChessClockProps> = ({ secondsLeft, isTurn, isGameActive }) => {
  const isLowTime = secondsLeft <= 20 && isGameActive;
  const isCritical = secondsLeft <= 10 && isGameActive;

  // Sound effect on low time warning every few seconds
  React.useEffect(() => {
    if (isTurn && isCritical && secondsLeft > 0) {
      sounds.playLowTime();
    }
  }, [secondsLeft, isTurn, isCritical]);

  const formatTime = (totalSeconds: number): string => {
    if (totalSeconds < 0) totalSeconds = 0;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const padMinutes = String(minutes).padStart(2, '0');
    const padSeconds = String(seconds).padStart(2, '0');

    if (totalSeconds < 10 && isGameActive) {
      // Show tenth of second
      const tenth = Math.floor((totalSeconds % 1) * 10);
      return `${padMinutes}:${padSeconds}.${tenth}`;
    }

    return `${padMinutes}:${padSeconds}`;
  };

  return (
    <div
      className={`relative px-3.5 py-1.5 rounded-lg font-mono text-xl sm:text-2xl font-bold transition-all duration-150 select-none ${
        isTurn && isGameActive
          ? isCritical
            ? 'bg-[#401b1b] text-[#fa412d] border-2 border-[#fa412d] animate-pulse shadow-md shadow-[#fa412d]/20'
            : isLowTime
            ? 'bg-[#3b2a1a] text-[#e68f00] border-2 border-[#e68f00] shadow-md shadow-[#e68f00]/20'
            : 'bg-[#272522] text-white border-2 border-[#81b64c] shadow-md shadow-[#81b64c]/20'
          : 'bg-[#211f1c] text-[#989795] border border-[#36322d]'
      }`}
    >
      <div className="flex items-center space-x-2">
        <svg
          className={`w-3.5 h-3.5 ${isTurn && isGameActive ? (isLowTime ? 'text-[#e68f00] animate-spin' : 'text-[#81b64c]') : 'text-[#5c5955]'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{formatTime(secondsLeft)}</span>
      </div>
    </div>
  );
};
