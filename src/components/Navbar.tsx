import React from 'react';
import { BoardTheme, Player } from '../types/chess';
import {
  Zap,
  PlusCircle,
  LogIn,
  Bot,
  Sparkles,
  Users,
  Palette,
  Volume2,
  VolumeX,
  Globe,
} from 'lucide-react';

interface NavbarProps {
  player: Player;
  boardTheme: BoardTheme;
  soundEnabled: boolean;
  onSelectTheme: (theme: BoardTheme) => void;
  onToggleSound: () => void;
  onOpenQuickMatch: () => void;
  onOpenCreateRoom: () => void;
  onOpenJoinRoom: () => void;
  onOpenPlayBot: () => void;
  onOpenCoach: () => void;
  onOpenAvatarGen: () => void;
  onOpenFriends: () => void;
  onOpenProfile: () => void;
  onOpenDomainGuide?: () => void;
  friendsOnlineCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  player,
  boardTheme,
  soundEnabled,
  onSelectTheme,
  onToggleSound,
  onOpenQuickMatch,
  onOpenCreateRoom,
  onOpenJoinRoom,
  onOpenPlayBot,
  onOpenCoach,
  onOpenAvatarGen,
  onOpenFriends,
  onOpenProfile,
  onOpenDomainGuide,
  friendsOnlineCount = 1,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer select-none">
          <div className="w-10 h-10 rounded-xl bg-[#81b64c] p-0.5 shadow-lg shadow-[#81b64c]/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#1b1917] rounded-[10px] flex items-center justify-center">
              {/* Chess Pawn / Crown iconic logo */}
              <svg className="w-6 h-6 text-[#81b64c]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a3 3 0 0 0-3 3c0 .8.3 1.5.8 2.1C8.2 8.3 7 10.5 7 13c0 .7.1 1.4.3 2H5v3h14v-3h-2.3c.2-.6.3-1.3.3-2 0-2.5-1.2-4.7-2.8-5.9.5-.6.8-1.3.8-2.1a3 3 0 0 0-3-3zm-6 18v2h12v-2H6z" />
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-sans">
                Chess<span className="text-[#81b64c]">KiDuniyaa</span><span className="text-xs text-[#989795] font-normal">.com</span>
              </span>
            </div>
            <div className="text-[10px] text-[#989795] font-medium -mt-1 hidden sm:block">
              Play Chess Online • Free Games & Community
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Quick Match Action Button */}
          <button
            onClick={onOpenQuickMatch}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#81b64c] hover:bg-[#a3d160] text-white font-extrabold text-xs rounded-lg shadow-md shadow-[#81b64c]/20 transition transform active:scale-95 border-b-[3px] border-[#537c2b]"
          >
            <Zap className="w-3.5 h-3.5 fill-white text-white" />
            <span className="hidden sm:inline">Play Online</span>
            <span className="sm:hidden">Play</span>
          </button>

          {/* Custom Domain Guide Button */}
          {onOpenDomainGuide && (
            <button
              onClick={onOpenDomainGuide}
              title="Open via chesskiduniyaa.vercel.app"
              className="flex items-center space-x-1 px-2.5 py-2 bg-[#312e2b] hover:bg-[#3d3a34] text-[#81b64c] hover:text-[#a3d160] font-bold text-xs rounded-lg border border-[#81b64c]/40 transition"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">chesskiduniyaa.vercel.app</span>
            </button>
          )}

          {/* Create Room */}
          <button
            onClick={onOpenCreateRoom}
            className="hidden md:flex items-center space-x-1.5 px-3 py-2 bg-[#312e2b] hover:bg-[#3d3a34] text-[#c3c2c1] hover:text-white font-bold text-xs rounded-lg border border-[#3d3a34] transition"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#81b64c]" />
            <span>Play a Friend</span>
          </button>

          {/* Join Room */}
          <button
            onClick={onOpenJoinRoom}
            className="hidden md:flex items-center space-x-1.5 px-3 py-2 bg-[#312e2b] hover:bg-[#3d3a34] text-[#c3c2c1] hover:text-white font-bold text-xs rounded-lg border border-[#3d3a34] transition"
          >
            <LogIn className="w-3.5 h-3.5 text-[#58a5f8]" />
            <span>Custom Room</span>
          </button>

          {/* Play Bot */}
          <button
            onClick={onOpenPlayBot}
            title="Play vs Chess Bots"
            className="flex items-center space-x-1 px-2.5 py-2 bg-[#312e2b] hover:bg-[#3d3a34] text-[#c3c2c1] hover:text-white font-bold text-xs rounded-lg border border-[#3d3a34] transition"
          >
            <Bot className="w-4 h-4 text-[#e68f00]" />
            <span className="hidden lg:inline">Play Bot</span>
          </button>

          {/* Gemini AI Coach */}
          <button
            onClick={onOpenCoach}
            title="Game Review & AI Coach"
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-2 bg-[#312e2b] hover:bg-[#3d3a34] text-[#81b64c] font-bold text-xs rounded-lg border border-[#81b64c]/40 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Coach Review</span>
          </button>

          {/* Board Theme Picker */}
          <div className="relative group">
            <button
              title="Board Theme"
              className="p-2 bg-[#312e2b] hover:bg-[#3d3a34] text-[#c3c2c1] rounded-lg border border-[#3d3a34] transition flex items-center"
            >
              <Palette className="w-4 h-4 text-purple-400" />
            </button>
            <div className="absolute right-0 mt-2 w-36 bg-[#262421] border border-[#3d3a34] rounded-xl p-1.5 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50">
              <span className="text-[10px] font-bold text-[#989795] uppercase tracking-wider px-2 py-1 block">
                Board Theme
              </span>
              {(['emerald', 'wood', 'slate', 'cyber', 'royal'] as BoardTheme[]).map((thm) => (
                <button
                  key={thm}
                  onClick={() => onSelectTheme(thm)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                    boardTheme === thm
                      ? 'bg-[#81b64c]/20 text-[#81b64c] font-bold'
                      : 'text-[#c3c2c1] hover:bg-[#312e2b]'
                  }`}
                >
                  {thm === 'emerald' ? 'Chess.com Green' : thm}
                </button>
              ))}
            </div>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
            className="p-2 bg-[#312e2b] hover:bg-[#3d3a34] text-[#c3c2c1] rounded-lg border border-[#3d3a34] transition"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#81b64c]" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Friends Modal Button */}
          <button
            onClick={onOpenFriends}
            title="Friends & Challenges"
            className="relative p-2 bg-[#312e2b] hover:bg-[#3d3a34] text-[#c3c2c1] rounded-lg border border-[#3d3a34] transition"
          >
            <Users className="w-4 h-4 text-[#58a5f8]" />
            {friendsOnlineCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#81b64c] text-white font-bold text-[9px] rounded-full flex items-center justify-center">
                {friendsOnlineCount}
              </span>
            )}
          </button>

          {/* Player Profile & Avatar Pill */}
          <button
            onClick={onOpenProfile}
            className="flex items-center space-x-2 pl-1.5 pr-2.5 py-1 bg-[#312e2b] hover:bg-[#3d3a34] border border-[#3d3a34] rounded-lg transition"
          >
            <img
              src={player.avatar}
              alt={player.name}
              className="w-7 h-7 rounded-md object-cover ring-1 ring-[#81b64c]/40 bg-[#1b1917]"
            />
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-white truncate max-w-[80px] leading-tight">
                {player.name}
              </div>
              <div className="text-[10px] font-mono font-semibold text-[#81b64c] leading-tight">
                {player.rating}
              </div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
