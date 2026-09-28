import React from 'react';
import { PieceType, PieceColor } from '../types/chess';

interface PieceProps {
  type: PieceType;
  color: PieceColor;
  className?: string;
}

export const ChessPiece: React.FC<PieceProps> = ({ type, color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';

  // Aesthetic color palettes
  const fill = isWhite ? '#F8FAFC' : '#1E293B';
  const stroke = isWhite ? '#475569' : '#0F172A';
  const detail = isWhite ? '#CBD5E1' : '#334155';
  const highlight = isWhite ? '#FFFFFF' : '#475569';

  switch (type) {
    case 'p': // Pawn
      return (
        <svg viewBox="0 0 100 100" className={className} filter="drop-shadow(0 2px 3px rgba(0,0,0,0.35))">
          {/* Base */}
          <path d="M 28 84 L 72 84 L 68 76 L 32 76 Z" fill={fill} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          <path d="M 33 76 C 36 68 40 60 41 52 L 59 52 C 60 60 64 68 67 76 Z" fill={fill} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          {/* Ring collar */}
          <ellipse cx="50" cy="50" rx="13" ry="4" fill={detail} stroke={stroke} strokeWidth="3" />
          {/* Head sphere */}
          <circle cx="50" cy="34" r="16" fill={fill} stroke={stroke} strokeWidth="3" />
          {/* Highlight sheen */}
          <ellipse cx="46" cy="30" rx="6" ry="7" fill={highlight} opacity={isWhite ? 0.7 : 0.4} />
        </svg>
      );

    case 'n': // Knight
      return (
        <svg viewBox="0 0 100 100" className={className} filter="drop-shadow(0 2px 3px rgba(0,0,0,0.35))">
          {/* Base */}
          <path d="M 25 84 L 75 84 L 70 76 L 30 76 Z" fill={fill} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          {/* Horse body & muzzle */}
          <path
            d="M 32 76 C 34 66 33 55 27 47 C 23 41 24 35 30 33 C 35 31 39 37 42 36 C 45 35 44 26 47 22 C 48 20 53 22 55 25 C 57 20 63 18 66 22 C 69 26 68 34 71 40 C 74 46 72 58 68 76 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Mane ridges */}
          <path d="M 55 27 C 62 33 63 43 66 52" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Eye */}
          <circle cx="41" cy="33" r="3.2" fill={stroke} />
          <circle cx="40.2" cy="32.2" r="1" fill={highlight} />
          {/* Nostril & Jaw line */}
          <path d="M 27 41 Q 31 43 33 46" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M 46 54 C 41 53 37 60 35 68" stroke={detail} strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      );

    case 'b': // Bishop
      return (
        <svg viewBox="0 0 100 100" className={className} filter="drop-shadow(0 2px 3px rgba(0,0,0,0.35))">
          {/* Base */}
          <path d="M 26 84 L 74 84 L 69 76 L 31 76 Z" fill={fill} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          {/* Body */}
          <path d="M 33 76 C 36 67 42 62 43 54 L 57 54 C 58 62 64 67 67 76 Z" fill={fill} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          {/* Collar ring */}
          <ellipse cx="50" cy="54" rx="14" ry="4" fill={detail} stroke={stroke} strokeWidth="3" />
          {/* Bishop mitre head */}
          <path
            d="M 36 50 C 34 36 43 24 50 18 C 57 24 66 36 64 50 C 60 55 40 55 36 50 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Mitre cross top */}
          <circle cx="50" cy="15" r="3.5" fill={fill} stroke={stroke} strokeWidth="2.5" />
          {/* Mitre cut slit */}
          <path d="M 44 28 L 56 38" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <path d="M 50 25 L 50 48" stroke={detail} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'r': // Rook
      return (
        <svg viewBox="0 0 100 100" className={className} filter="drop-shadow(0 2px 3px rgba(0,0,0,0.35))">
          {/* Base */}
          <path d="M 25 84 L 75 84 L 71 76 L 29 76 Z" fill={fill} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          {/* Column */}
          <path d="M 32 76 L 35 44 L 65 44 L 68 76 Z" fill={fill} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          {/* Turret head with crenellations */}
          <path
            d="M 30 44 L 30 26 L 39 26 L 39 33 L 46 33 L 46 26 L 54 26 L 54 33 L 61 33 L 61 26 L 70 26 L 70 44 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Turret cornice line */}
          <path d="M 30 42 L 70 42" stroke={stroke} strokeWidth="2.5" />
          {/* Castle arrow slit window */}
          <rect x="47" y="52" width="6" height="13" rx="2" fill={stroke} />
        </svg>
      );

    case 'q': // Queen
      return (
        <svg viewBox="0 0 100 100" className={className} filter="drop-shadow(0 2px 3px rgba(0,0,0,0.35))">
          {/* Base */}
          <path d="M 24 84 L 76 84 L 71 76 L 29 76 Z" fill={fill} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          {/* Body */}
          <path d="M 31 76 C 34 66 41 60 42 54 L 58 54 C 59 60 66 66 69 76 Z" fill={fill} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          {/* Belt */}
          <ellipse cx="50" cy="54" rx="16" ry="4" fill={detail} stroke={stroke} strokeWidth="3" />
          {/* Crown petals */}
          <path
            d="M 31 52 L 24 30 L 37 38 L 50 25 L 63 38 L 76 30 L 69 52 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Crown jewel pearls */}
          <circle cx="24" cy="27" r="3" fill={fill} stroke={stroke} strokeWidth="2" />
          <circle cx="37" cy="34" r="3" fill={fill} stroke={stroke} strokeWidth="2" />
          <circle cx="50" cy="22" r="3.8" fill={fill} stroke={stroke} strokeWidth="2" />
          <circle cx="63" cy="34" r="3" fill={fill} stroke={stroke} strokeWidth="2" />
          <circle cx="76" cy="27" r="3" fill={fill} stroke={stroke} strokeWidth="2" />
        </svg>
      );

    case 'k': // King
      return (
        <svg viewBox="0 0 100 100" className={className} filter="drop-shadow(0 2px 3px rgba(0,0,0,0.35))">
          {/* Base */}
          <path d="M 24 84 L 76 84 L 71 76 L 29 76 Z" fill={fill} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          {/* Body */}
          <path d="M 31 76 C 34 65 41 58 42 52 L 58 52 C 59 58 66 65 69 76 Z" fill={fill} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          {/* Belt */}
          <ellipse cx="50" cy="52" rx="16" ry="4" fill={detail} stroke={stroke} strokeWidth="3" />
          {/* Crown Arch */}
          <path
            d="M 33 50 C 31 38 40 32 50 32 C 60 32 69 38 67 50 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Crown arches detail */}
          <path d="M 42 50 C 41 38 47 34 50 34 C 53 34 59 38 58 50" stroke={detail} strokeWidth="2" fill="none" />
          {/* Royal Cross */}
          <path d="M 50 17 L 50 31 M 44 22 L 56 22" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="50" cy="22" r="2" fill={highlight} />
        </svg>
      );

    default:
      return null;
  }
};
