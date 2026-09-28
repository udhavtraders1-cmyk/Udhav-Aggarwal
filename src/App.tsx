import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Chess, Square } from 'chess.js';
import {
  BoardTheme,
  Friend,
  GameState,
  PieceColor,
  PieceType,
  Player,
  TimeControlKey,
  TIME_CONTROLS,
} from './types/chess';
import { sounds } from './services/soundService';
import { Navbar } from './components/Navbar';
import { ChessBoard } from './components/ChessBoard';
import { PlayerCard } from './components/PlayerCard';
import { ChessClock } from './components/ChessClock';
import { MoveHistory } from './components/MoveHistory';
import { GameControls } from './components/GameControls';
import { GameChat } from './components/GameChat';
import { CreateRoomModal } from './components/CreateRoomModal';
import { JoinRoomModal } from './components/JoinRoomModal';
import { MatchmakingModal } from './components/MatchmakingModal';
import { PostGameModal } from './components/PostGameModal';
import { GeminiCoachModal } from './components/GeminiCoachModal';
import { AvatarGeneratorModal } from './components/AvatarGeneratorModal';
import { FriendsModal } from './components/FriendsModal';
import { ProfileModal } from './components/ProfileModal';
import { DomainGuideModal } from './components/DomainGuideModal';
import { Bot, Share2, Sparkles, Swords, Zap } from 'lucide-react';

const PIECE_VALUES: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export default function App() {
  // Current user profile
  const [currentUser, setCurrentUser] = useState<Player>(() => {
    const saved = localStorage.getItem('chesskiduniya_user') || localStorage.getItem('stratagem_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    const randId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const randName = `ChessMaster_${Math.floor(1000 + Math.random() * 9000)}`;
    const initial: Player = {
      id: randId,
      name: randName,
      rating: 1200,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${randId}`,
      isGuest: true,
      connected: true,
    };
    localStorage.setItem('chesskiduniya_user', JSON.stringify(initial));
    return initial;
  });

  // Local chess state
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [boardOrientation, setBoardOrientation] = useState<PieceColor>('w');
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('emerald');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // Active game / room state
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isBotGame, setIsBotGame] = useState(false);
  const [myColor, setMyColor] = useState<PieceColor | null>('w');
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showMatchmakingModal, setShowMatchmakingModal] = useState(false);
  const [showPostGameModal, setShowPostGameModal] = useState(false);
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [showAvatarGenModal, setShowAvatarGenModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isSearchingQueue, setIsSearchingQueue] = useState(false);
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);

  // Friends & user games history
  const [friends, setFriends] = useState<Friend[]>([
    {
      id: 'friend_1',
      name: 'Grandmaster Bot',
      rating: 2200,
      avatar: 'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=150&auto=format&fit=crop&q=80',
      online: true,
    },
    {
      id: 'friend_2',
      name: 'MagnusFan99',
      rating: 1540,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=magnus',
      online: true,
    },
  ]);
  const [userGames, setUserGames] = useState<any[]>([]);

  // Socket reference
  const socketRef = useRef<Socket | null>(null);

  // Bot timer reference
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('user:register', currentUser);

      // Check URL for invite code
      const hash = window.location.hash;
      if (hash.startsWith('#room=')) {
        const code = hash.replace('#room=', '');
        if (code) {
          socket.emit('room:join', { roomCodeOrId: code, player: currentUser });
        }
      }
    });

    socket.on('room:created', (data: { roomId: string; code: string; state: GameState; playerColor: PieceColor }) => {
      setGameState(data.state);
      setMyColor(data.playerColor);
      setBoardOrientation(data.playerColor);
      setCreatedRoomCode(data.code);
      setIsBotGame(false);
    });

    socket.on('room:joined', (data: { roomId: string; state: GameState; playerColor?: PieceColor }) => {
      setGameState(data.state);
      setMyColor(data.playerColor || null);
      if (data.playerColor) setBoardOrientation(data.playerColor);
      setShowJoinModal(false);
      setShowCreateModal(false);
      setJoinError(null);
      setIsBotGame(false);
    });

    socket.on('room:error', (data: { message: string }) => {
      setJoinError(data.message);
    });

    socket.on('game:state', (updated: GameState) => {
      setGameState(updated);

      // Sync chess.js board
      chess.load(updated.fen);
      setFen(updated.fen);

      // Update last move
      if (updated.moves.length > 0) {
        const latest = updated.moves[updated.moves.length - 1];
        setLastMove({ from: latest.from, to: latest.to });

        // Play appropriate sound
        if (latest.captured) {
          sounds.playCapture();
        } else if (latest.san.includes('O-O')) {
          sounds.playCastle();
        } else {
          sounds.playMove();
        }

        if (updated.isCheck && updated.status === 'in_progress') {
          sounds.playCheck();
        }

        // Voice commentary with Gemini 3.8 Flash TTS if enabled
        if (ttsEnabled && latest.san) {
          triggerMoveTTS(latest.san, updated.isCheck, updated.status === 'checkmate');
        }
      }

      // Check game end
      if (updated.status !== 'waiting' && updated.status !== 'in_progress') {
        setShowPostGameModal(true);
      }
    });

    socket.on('chat:received', (msg: any) => {
      setGameState((prev) => (prev ? { ...prev, chat: [...prev.chat, msg] } : prev));
    });

    socket.on('matchmaking:queued', () => {
      setIsSearchingQueue(true);
    });

    socket.on('matchmaking:cancelled', () => {
      setIsSearchingQueue(false);
    });

    socket.on('matchmaking:found', (data: { roomId: string; code: string; state: GameState; playerColor: PieceColor }) => {
      setIsSearchingQueue(false);
      setShowMatchmakingModal(false);
      setGameState(data.state);
      setMyColor(data.playerColor);
      setBoardOrientation(data.playerColor);
      setIsBotGame(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Sync profile to database
  useEffect(() => {
    localStorage.setItem('chesskiduniya_user', JSON.stringify(currentUser));
    fetch('/api/user/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentUser),
    }).catch(() => {});
  }, [currentUser]);

  // Voice announcement via Gemini 3.8 Flash TTS
  const triggerMoveTTS = async (san: string, isCheck: boolean, isMate: boolean) => {
    try {
      let prompt = `White plays ${san}.`;
      if (san.startsWith('N')) prompt = `Knight to ${san.slice(1)}`;
      else if (san.startsWith('B')) prompt = `Bishop to ${san.slice(1)}`;
      else if (san.startsWith('R')) prompt = `Rook to ${san.slice(1)}`;
      else if (san.startsWith('Q')) prompt = `Queen to ${san.slice(1)}`;
      else if (san.startsWith('K')) prompt = `King to ${san.slice(1)}`;
      else if (san === 'O-O') prompt = `Castles kingside`;
      else if (san === 'O-O-O') prompt = `Castles queenside`;

      if (isMate) prompt += ', checkmate! Game over.';
      else if (isCheck) prompt += ', check!';

      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: prompt }),
      });
      const data = await res.json();
      if (data.audio) {
        sounds.playBase64Audio(data.audio, data.mimeType || 'audio/pcm;rate=24000');
      }
    } catch {
      // Ignore background tts errors
    }
  };

  // Bot move logic (when playing offline / practice vs Grandmaster Bot)
  useEffect(() => {
    if (!isBotGame || !gameState || gameState.status !== 'in_progress') return;

    if (gameState.turn === 'b' && myColor === 'w') {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);

      botTimerRef.current = setTimeout(() => {
        const moves = chess.moves({ verbose: true });
        if (moves.length === 0) return;

        // Smart move selection: prefer captures, checks, or random legal
        const captures = moves.filter((m) => m.captured);
        const checks = moves.filter((m) => m.san.includes('+'));
        let chosen = moves[Math.floor(Math.random() * moves.length)];

        if (checks.length > 0 && Math.random() > 0.3) {
          chosen = checks[Math.floor(Math.random() * checks.length)];
        } else if (captures.length > 0 && Math.random() > 0.4) {
          chosen = captures[Math.floor(Math.random() * captures.length)];
        }

        executeMove(chosen.from, chosen.to, chosen.promotion as PieceType);
      }, 700);
    }
  }, [fen, isBotGame, gameState?.turn]);

  // Execute a chess move (handles both multiplayer via socket and solo bot mode)
  const executeMove = (from: string, to: string, promotion?: PieceType) => {
    if (isBotGame && gameState) {
      try {
        const move = chess.move({ from, to, promotion: promotion || 'q' });
        if (!move) return;

        const newFen = chess.fen();
        setFen(newFen);
        setLastMove({ from, to });

        if (move.captured) sounds.playCapture();
        else if (move.san.includes('O-O')) sounds.playCastle();
        else sounds.playMove();

        if (chess.isCheck()) sounds.playCheck();

        // Update bot game state
        const moveRecord = {
          from: move.from,
          to: move.to,
          san: move.san,
          piece: move.piece as PieceType,
          color: move.color as PieceColor,
          captured: move.captured as PieceType | undefined,
          promotion: move.promotion as PieceType | undefined,
          flags: move.flags,
          fenAfter: newFen,
          timestamp: Date.now(),
          whiteTimeLeft: gameState.whiteTimeLeft,
          blackTimeLeft: gameState.blackTimeLeft,
        };

        const isMate = chess.isCheckmate();
        const isDraw = chess.isDraw();

        const updatedState: GameState = {
          ...gameState,
          fen: newFen,
          pgn: chess.pgn(),
          turn: chess.turn() as PieceColor,
          moves: [...gameState.moves, moveRecord],
          isCheck: chess.isCheck(),
          status: isMate ? 'checkmate' : isDraw ? 'stalemate' : 'in_progress',
          winner: isMate ? (move.color === 'w' ? 'w' : 'b') : isDraw ? 'draw' : null,
          resultReason: isMate
            ? `Checkmate! ${move.color === 'w' ? 'White' : 'Black'} wins.`
            : isDraw
            ? 'Draw by stalemate or repetition'
            : null,
        };

        setGameState(updatedState);

        if (ttsEnabled) {
          triggerMoveTTS(move.san, chess.isCheck(), isMate);
        }

        if (isMate || isDraw) {
          setShowPostGameModal(true);
        }
      } catch (err) {
        console.warn('Illegal bot move', err);
      }
    } else {
      // Multiplayer move through server socket
      socketRef.current?.emit('game:move', { from, to, promotion });
    }
  };

  // Start Play vs AI Bot
  const handlePlayBot = (tcKey: TimeControlKey = 'blitz_5_0') => {
    chess.reset();
    setFen(chess.fen());
    setLastMove(null);

    const tc = TIME_CONTROLS[tcKey];
    const botUser: Player = {
      id: 'bot_grandmaster',
      name: 'Grandmaster Bot',
      rating: 2200,
      avatar: 'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=150&auto=format&fit=crop&q=80',
      isGuest: false,
      connected: true,
      color: 'b',
    };

    const myPlayer: Player = { ...currentUser, color: 'w' };

    const initialBotGame: GameState = {
      id: `bot_match_${Date.now()}`,
      code: 'BOT-MATCH',
      isPrivate: false,
      rated: false,
      timeControl: tc,
      fen: chess.fen(),
      pgn: '',
      turn: 'w',
      status: 'in_progress',
      winner: null,
      resultReason: null,
      white: myPlayer,
      black: botUser,
      spectators: [],
      whiteTimeLeft: tc.initialSeconds,
      blackTimeLeft: tc.initialSeconds,
      lastMoveTime: Date.now(),
      moves: [],
      isCheck: false,
      drawOfferFrom: null,
      rematchOfferedBy: null,
      chat: [
        {
          id: 'welcome',
          senderId: 'bot_grandmaster',
          senderName: 'Grandmaster Bot',
          text: 'Good luck! Enjoy the match.',
          timestamp: Date.now(),
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setGameState(initialBotGame);
    setMyColor('w');
    setBoardOrientation('w');
    setIsBotGame(true);
  };

  // Calculate captured pieces & material difference
  const getCapturedPieces = () => {
    const startingCount: Record<PieceColor, Record<PieceType, number>> = {
      w: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
      b: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
    };

    const board = chess.board();
    const currentCount: Record<PieceColor, Record<PieceType, number>> = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    };

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          currentCount[piece.color as PieceColor][piece.type as PieceType]++;
        }
      }
    }

    // Pieces captured by White (i.e. lost by Black)
    const whiteCaptured: PieceType[] = [];
    // Pieces captured by Black (i.e. lost by White)
    const blackCaptured: PieceType[] = [];

    let whiteMaterial = 0;
    let blackMaterial = 0;

    (['p', 'n', 'b', 'r', 'q'] as PieceType[]).forEach((p) => {
      const lostByBlack = startingCount.b[p] - currentCount.b[p];
      for (let i = 0; i < lostByBlack; i++) whiteCaptured.push(p);

      const lostByWhite = startingCount.w[p] - currentCount.w[p];
      for (let i = 0; i < lostByWhite; i++) blackCaptured.push(p);

      whiteMaterial += currentCount.w[p] * PIECE_VALUES[p];
      blackMaterial += currentCount.b[p] * PIECE_VALUES[p];
    });

    const diff = whiteMaterial - blackMaterial;

    return {
      whiteCaptured,
      blackCaptured,
      whiteAdvantage: diff > 0 ? diff : 0,
      blackAdvantage: diff < 0 ? Math.abs(diff) : 0,
    };
  };

  const captured = getCapturedPieces();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        player={currentUser}
        boardTheme={boardTheme}
        soundEnabled={soundEnabled}
        onSelectTheme={setBoardTheme}
        onToggleSound={() => {
          const next = !soundEnabled;
          setSoundEnabled(next);
          sounds.setSoundEnabled(next);
        }}
        onOpenQuickMatch={() => setShowMatchmakingModal(true)}
        onOpenCreateRoom={() => {
          setCreatedRoomCode(null);
          setShowCreateModal(true);
        }}
        onOpenJoinRoom={() => setShowJoinModal(true)}
        onOpenPlayBot={() => handlePlayBot('blitz_5_0')}
        onOpenCoach={() => setShowCoachModal(true)}
        onOpenAvatarGen={() => setShowAvatarGenModal(true)}
        onOpenFriends={() => setShowFriendsModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenDomainGuide={() => setShowDomainModal(true)}
        friendsOnlineCount={friends.filter((f) => f.online).length}
      />

      {/* Main Chess Arena */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 py-3 sm:py-6 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 lg:gap-6">
        {/* Left Column: Board, Players & Clocks */}
        <div className="flex flex-col items-center w-full max-w-[560px]">
          {/* Top Player (Opponent) */}
          <div className="w-full flex items-center justify-between mb-2 gap-2">
            <div className="flex-1 min-w-0">
              <PlayerCard
                player={boardOrientation === 'w' ? gameState?.black || null : gameState?.white || null}
                color={boardOrientation === 'w' ? 'b' : 'w'}
                isTurn={gameState?.turn === (boardOrientation === 'w' ? 'b' : 'w')}
                capturedPieces={boardOrientation === 'w' ? captured.blackCaptured : captured.whiteCaptured}
                materialAdvantage={boardOrientation === 'w' ? captured.blackAdvantage : captured.whiteAdvantage}
                isMe={myColor === (boardOrientation === 'w' ? 'b' : 'w')}
              />
            </div>
            <ChessClock
              secondsLeft={boardOrientation === 'w' ? gameState?.blackTimeLeft ?? 300 : gameState?.whiteTimeLeft ?? 300}
              isTurn={gameState?.turn === (boardOrientation === 'w' ? 'b' : 'w')}
              isGameActive={gameState?.status === 'in_progress'}
            />
          </div>

          {/* Interactive Chessboard */}
          <ChessBoard
            chess={chess}
            boardOrientation={boardOrientation}
            theme={boardTheme}
            playerColor={myColor}
            lastMove={lastMove}
            isInteractive={gameState?.status === 'in_progress'}
            onMove={executeMove}
          />

          {/* Bottom Player (Self or White) */}
          <div className="w-full flex items-center justify-between mt-2 gap-2">
            <div className="flex-1 min-w-0">
              <PlayerCard
                player={boardOrientation === 'w' ? gameState?.white || null : gameState?.black || null}
                color={boardOrientation === 'w' ? 'w' : 'b'}
                isTurn={gameState?.turn === (boardOrientation === 'w' ? 'w' : 'b')}
                capturedPieces={boardOrientation === 'w' ? captured.whiteCaptured : captured.blackCaptured}
                materialAdvantage={boardOrientation === 'w' ? captured.whiteAdvantage : captured.blackAdvantage}
                isMe={myColor === (boardOrientation === 'w' ? 'w' : 'b')}
              />
            </div>
            <ChessClock
              secondsLeft={boardOrientation === 'w' ? gameState?.whiteTimeLeft ?? 300 : gameState?.blackTimeLeft ?? 300}
              isTurn={gameState?.turn === (boardOrientation === 'w' ? 'w' : 'b')}
              isGameActive={gameState?.status === 'in_progress'}
            />
          </div>
        </div>

        {/* Right Column: Move Notation, Game Controls & Chat */}
        <div className="w-full max-w-[560px] lg:max-w-md flex flex-col gap-3 h-full">
          {/* Quick Header Banner */}
          {!gameState || gameState.status === 'waiting' ? (
            <div className="bg-[#262421] border border-[#36322d] p-4 rounded-xl flex items-center justify-between shadow-lg">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Swords className="w-4 h-4 text-[#81b64c]" />
                  <span>Welcome to ChessKiDuniya.com</span>
                </h2>
                <p className="text-xs text-[#989795] mt-0.5">
                  Play with 150M+ players worldwide, invite friends or challenge bots.
                </p>
              </div>

              <button
                onClick={() => setShowMatchmakingModal(true)}
                className="px-4 py-2.5 bg-[#81b64c] hover:bg-[#a3d160] text-white font-extrabold text-xs rounded-lg shadow-md shadow-[#81b64c]/20 border-b-[3px] border-[#537c2b] transition flex items-center space-x-1.5 shrink-0"
              >
                <Zap className="w-3.5 h-3.5 fill-white text-white" />
                <span>Play 1v1</span>
              </button>
            </div>
          ) : (
            <div className="bg-[#262421] border border-[#36322d] p-3 rounded-xl flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#81b64c] animate-pulse" />
                <span className="text-xs font-bold text-white">
                  {isBotGame ? 'Practice vs Bot' : `Live Game • Room: ${gameState.code}`}
                </span>
                <span className="text-[11px] font-mono text-[#989795]">
                  ({gameState.timeControl.name})
                </span>
              </div>

              {gameState.code && !isBotGame && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/#room=${gameState.code}`);
                    alert('Room invite link copied to clipboard!');
                  }}
                  className="p-1.5 bg-[#312e2b] hover:bg-[#3d3a34] text-[#c3c2c1] rounded-md text-xs flex items-center space-x-1 transition"
                  title="Share Invite Link"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#81b64c]" />
                  <span className="text-[11px] font-semibold">Share</span>
                </button>
              )}
            </div>
          )}

          {/* Move History */}
          <div className="flex-1 min-h-[190px]">
            <MoveHistory moves={gameState?.moves || []} pgn={gameState?.pgn || ''} />
          </div>

          {/* In-Game Action Controls */}
          <GameControls
            status={gameState?.status || 'waiting'}
            canAbort={(gameState?.moves.length || 0) <= 2}
            isMyTurn={gameState?.turn === myColor}
            isParticipant={!!myColor}
            soundEnabled={soundEnabled}
            ttsEnabled={ttsEnabled}
            rematchOffered={gameState?.rematchOfferedBy === currentUser.id}
            drawOfferedByOpponent={!!gameState?.drawOfferFrom && gameState.drawOfferFrom !== myColor}
            onResign={() => {
              if (isBotGame) {
                setGameState((prev) =>
                  prev ? { ...prev, status: 'checkmate', winner: 'b', resultReason: 'White resigned' } : prev
                );
                setShowPostGameModal(true);
              } else {
                socketRef.current?.emit('game:resign');
              }
            }}
            onAbort={() => {
              if (isBotGame) {
                setGameState(null);
              } else {
                socketRef.current?.emit('game:abort');
              }
            }}
            onOfferDraw={() => {
              if (isBotGame) {
                setGameState((prev) =>
                  prev
                    ? { ...prev, status: 'draw_agreement', winner: 'draw', resultReason: 'Draw agreed by bot' }
                    : prev
                );
                setShowPostGameModal(true);
              } else {
                socketRef.current?.emit('game:draw_offer');
              }
            }}
            onRespondDraw={(accept) => socketRef.current?.emit('game:draw_respond', { accept })}
            onRematch={() => {
              if (isBotGame) {
                handlePlayBot();
              } else {
                socketRef.current?.emit('game:rematch_offer');
              }
            }}
            onFlipBoard={() => setBoardOrientation((prev) => (prev === 'w' ? 'b' : 'w'))}
            onToggleSound={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              sounds.setSoundEnabled(next);
            }}
            onToggleTts={() => {
              const next = !ttsEnabled;
              setTtsEnabled(next);
              sounds.setTtsEnabled(next);
            }}
          />

          {/* In-Game Live Chat */}
          <div className="h-56">
            <GameChat
              messages={gameState?.chat || []}
              currentUserId={currentUser.id}
              onSendMessage={(text) => {
                if (isBotGame) {
                  const myMsg = {
                    id: `msg_${Date.now()}`,
                    senderId: currentUser.id,
                    senderName: currentUser.name,
                    text,
                    timestamp: Date.now(),
                  };
                  setGameState((prev) => (prev ? { ...prev, chat: [...prev.chat, myMsg] } : prev));
                } else {
                  socketRef.current?.emit('chat:send', { text });
                }
              }}
            />
          </div>
        </div>
      </main>

      {/* Floating Bottom AI Coach Bar for Quick Insights */}
      <aside aria-label="Grandmaster analysis" className="max-w-7xl w-full mx-auto px-4 py-2.5 flex items-center justify-between text-xs text-[#989795] border-t border-[#36322d] bg-[#211f1c]">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-[#81b64c]" />
          <span>Need Grandmaster advice? Ask ChessKiDuniya.com AI Coach anytime during or after your match.</span>
        </div>
        <button
          onClick={() => setShowCoachModal(true)}
          className="font-bold text-[#81b64c] hover:text-[#a3d160] hover:underline"
        >
          Review Game &rarr;
        </button>
      </aside>

      {/* Modals */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        createdRoomCode={createdRoomCode}
        onCreateRoom={(params) => {
          socketRef.current?.emit('room:create', { player: currentUser, ...params });
        }}
      />

      <JoinRoomModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        errorMessage={joinError}
        onJoinRoom={(code) => {
          socketRef.current?.emit('room:join', { roomCodeOrId: code, player: currentUser });
        }}
      />

      <MatchmakingModal
        isOpen={showMatchmakingModal}
        onClose={() => setShowMatchmakingModal(false)}
        isSearching={isSearchingQueue}
        onQueue={(tcKey) => {
          socketRef.current?.emit('matchmaking:queue', { player: currentUser, timeControlKey: tcKey });
        }}
        onCancelQueue={() => {
          socketRef.current?.emit('matchmaking:cancel');
          setIsSearchingQueue(false);
        }}
        onPlayBot={(tcKey) => handlePlayBot(tcKey)}
      />

      <PostGameModal
        isOpen={showPostGameModal}
        onClose={() => setShowPostGameModal(false)}
        status={gameState?.status || 'checkmate'}
        winner={gameState?.winner || null}
        resultReason={gameState?.resultReason || null}
        whitePlayer={gameState?.white || null}
        blackPlayer={gameState?.black || null}
        myColor={myColor}
        onRematch={() => {
          if (isBotGame) {
            handlePlayBot();
          } else {
            socketRef.current?.emit('game:rematch_offer');
          }
        }}
        onOpenCoach={() => setShowCoachModal(true)}
      />

      <GeminiCoachModal
        isOpen={showCoachModal}
        onClose={() => setShowCoachModal(false)}
        currentFen={gameState?.fen || chess.fen()}
        currentPgn={gameState?.pgn || chess.pgn()}
      />

      <AvatarGeneratorModal
        isOpen={showAvatarGenModal}
        onClose={() => setShowAvatarGenModal(false)}
        onSetAvatar={(url) => {
          setCurrentUser((prev) => ({ ...prev, avatar: url }));
        }}
      />

      <FriendsModal
        isOpen={showFriendsModal}
        onClose={() => setShowFriendsModal(false)}
        friends={friends}
        onAddFriend={(uname) => {
          const newF: Friend = {
            id: `f_${Date.now()}`,
            name: uname,
            rating: 1200 + Math.floor(Math.random() * 400),
            avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${uname}`,
            online: true,
          };
          setFriends((prev) => [...prev, newF]);
        }}
        onChallengeFriend={() => {
          setShowFriendsModal(false);
          setShowCreateModal(true);
        }}
      />

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        player={currentUser}
        userGames={userGames}
        onUpdatePlayer={(updated) => {
          setCurrentUser((prev) => ({ ...prev, ...updated }));
        }}
        onOpenAvatarGen={() => setShowAvatarGenModal(true)}
      />

      <DomainGuideModal
        isOpen={showDomainModal}
        onClose={() => setShowDomainModal(false)}
        sharedUrl="https://ais-pre-i4qjvrnnctawfh3jrdy6fx-384406736379.asia-east1.run.app"
      />
    </div>
  );
}
