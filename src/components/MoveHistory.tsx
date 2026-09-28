import React from 'react';
import { MoveRecord } from '../types/chess';
import { Download, Copy, Check } from 'lucide-react';

interface MoveHistoryProps {
  moves: MoveRecord[];
  pgn: string;
  currentMoveIndex?: number | null;
  onSelectMove?: (index: number | null) => void;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  moves,
  pgn,
  currentMoveIndex,
  onSelectMove,
}) => {
  const [copied, setCopied] = React.useState(false);

  // Group moves into pairs (white, black)
  const movePairs: { white: MoveRecord; black?: MoveRecord; index: number }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      index: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  const handleCopyPgn = () => {
    if (!pgn) return;
    navigator.clipboard.writeText(pgn);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPgn = () => {
    if (!pgn) return;
    const blob = new Blob([pgn], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chesskiduniya_${Date.now()}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-[#262421] border border-[#36322d] rounded-xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#211f1c] border-b border-[#36322d] shrink-0">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#81b64c]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Move Notation
          </h3>
          <span className="text-[11px] font-mono text-[#989795]">
            ({moves.length} moves)
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handleCopyPgn}
            disabled={!pgn}
            title="Copy PGN"
            className="p-1.5 rounded-md text-[#989795] hover:text-white hover:bg-[#312e2b] disabled:opacity-40 transition"
          >
            {copied ? <Check className="w-4 h-4 text-[#81b64c]" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDownloadPgn}
            disabled={!pgn}
            title="Download PGN"
            className="p-1.5 rounded-md text-[#989795] hover:text-white hover:bg-[#312e2b] disabled:opacity-40 transition"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Move list table */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 font-mono text-xs max-h-56 sm:max-h-64">
        {movePairs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-[#989795] text-xs text-center px-4">
            <span className="font-semibold">Game not started</span>
            <span className="text-[11px] text-[#5c5955] mt-0.5">Moves will display in live notation</span>
          </div>
        ) : (
          movePairs.map((pair, pIdx) => {
            const whiteMoveIdx = pIdx * 2;
            const blackMoveIdx = pIdx * 2 + 1;

            const isWhiteSelected = currentMoveIndex === whiteMoveIdx;
            const isBlackSelected = currentMoveIndex === blackMoveIdx;

            return (
              <div
                key={pIdx}
                className="flex items-center text-xs py-0.5 px-2 rounded hover:bg-[#312e2b]/80 transition-colors"
              >
                {/* Move number */}
                <span className="w-8 text-[#989795] font-semibold select-none">
                  {pair.index}.
                </span>

                {/* White Move */}
                <button
                  onClick={() => onSelectMove && onSelectMove(whiteMoveIdx)}
                  className={`flex-1 text-left px-2 py-0.5 rounded transition font-bold ${
                    isWhiteSelected
                      ? 'bg-[#81b64c] text-white'
                      : 'text-white hover:bg-[#3d3a34]'
                  }`}
                >
                  {pair.white.san}
                </button>

                {/* Black Move */}
                {pair.black ? (
                  <button
                    onClick={() => onSelectMove && onSelectMove(blackMoveIdx)}
                    className={`flex-1 text-left px-2 py-0.5 rounded transition font-bold ${
                      isBlackSelected
                        ? 'bg-[#81b64c] text-white'
                        : 'text-[#c3c2c1] hover:bg-[#3d3a34]'
                    }`}
                  >
                    {pair.black.san}
                  </button>
                ) : (
                  <div className="flex-1" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
