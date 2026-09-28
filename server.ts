import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { ChessRoom } from './server/chessEngine';
import { db } from './server/db';
import { GameState, PieceColor, Player, TimeControl, TIME_CONTROLS } from './src/types/chess';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI client (Server-side only with User-Agent telemetry)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Setup Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// In-memory room store & matchmaking queues
const rooms = new Map<string, ChessRoom>();
const matchmakingQueues = new Map<string, { socketId: string; player: Player }[]>();

// Connected users mapping
const connectedSockets = new Map<string, { userId: string; socketId: string }>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// REST Endpoints
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/leaderboard', async (_req: Request, res: Response) => {
  try {
    const list = await db.getLeaderboard(15);
    res.json({ leaderboard: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

app.get('/api/user/:id/games', async (req: Request, res: Response) => {
  try {
    const games = await db.getUserGames(req.params.id);
    res.json({ games });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user games' });
  }
});

app.post('/api/user/sync', async (req: Request, res: Response) => {
  try {
    const { id, username, avatar_url, is_guest, rating } = req.body;
    const user = await db.getOrCreateUser({ id, username, avatar_url, is_guest, rating });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

// --- GEMINI 3.8 FLASH TTS (Text to Speech for Grandmaster commentary) ---
app.post('/api/gemini/tts', async (req: Request, res: Response) => {
  try {
    const { text, voice } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text prompt required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Gemini API key not configured' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text,
              speechMetadata: {
                style: 'Professional, articulate chess grandmaster commentator and announcer',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Puck' }, // Puck, Charon, Kore, Fenrir, Zephyr
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'No audio returned from Gemini TTS' });
    }

    res.json({ audio: base64Audio, mimeType: 'audio/pcm;rate=24000' });
  } catch (err: unknown) {
    console.error('[Gemini TTS error]:', err);
    res.status(500).json({ error: (err as Error).message || 'TTS generation failed' });
  }
});

// --- GEMINI 3 PRO IMAGE PREVIEW (1K, 2K, 4K High Quality Image Generation) ---
app.post('/api/gemini/generate-image', async (req: Request, res: Response) => {
  try {
    const { prompt, imageSize = '1K', aspectRatio = '1:1' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Gemini API key not configured' });
    }

    // gemini-3-pro-image supports 1K, 2K, 4K resolution affordance as requested
    const validSizes = ['1K', '2K', '4K'];
    const chosenSize = validSizes.includes(imageSize) ? imageSize : '1K';

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image',
      contents: {
        parts: [
          {
            text: `High-detail aesthetic digital art for a chess game: ${prompt}. Cinematic lighting, intricate textures, masterpiece, high dynamic range.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as '1:1' | '16:9' | '9:16' | '4:3' | '3:4',
          imageSize: chosenSize as '1K' | '2K' | '4K',
        },
      },
    });

    let imageUrl: string | null = null;
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      return res.status(500).json({ error: 'Failed to extract generated image' });
    }

    res.json({ imageUrl, size: chosenSize });
  } catch (err: unknown) {
    console.error('[Gemini Image Error]:', err);
    res.status(500).json({ error: (err as Error).message || 'Image generation failed' });
  }
});

// --- GEMINI MULTI-TURN CHATBOT & CHESS COACH ---
// Uses gemini-3.1-pro-preview for complex analysis, gemini-3.5-flash for general, and gemini-3.1-flash-lite for fast blitz
app.post('/api/gemini/coach-chat', async (req: Request, res: Response) => {
  try {
    const { messages, roleType = 'general', currentFen, currentPgn } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Gemini API key not configured' });
    }

    let modelName = 'gemini-3.5-flash';
    let systemInstruction = `You are Grandmaster Mikhail, an elite chess grandmaster and coach. You provide helpful, articulate, strategic and tactical chess coaching. Analyze positions accurately, explain opening concepts, tactical motifs (pins, forks, skewers, discovered attacks, deflection), and endgame techniques concisely. Keep explanations engaging and educational.`;

    if (roleType === 'complex' || roleType === 'grandmaster') {
      modelName = 'gemini-3.1-pro-preview';
      systemInstruction = `You are Grandmaster Kasparov, a legendary chess tactician and deep opening theorist. Provide deep positional calculations, evaluate candidate moves, and explain positional sacrifices, pawn structures, and prophylactic plans with grandmaster precision.`;
    } else if (roleType === 'blitz' || roleType === 'fast') {
      modelName = 'gemini-3.1-flash-lite';
      systemInstruction = `You are Blitz Master Gary. Give swift, punchy, aggressive tactical tips for speed chess. Focus on piece activity, king safety, initiative, and simple practical moves.`;
    }

    // Format chat contents
    let contextHeader = '';
    if (currentFen) {
      contextHeader += `[Current Board Position FEN: "${currentFen}"]\n`;
    }
    if (currentPgn) {
      contextHeader += `[Game PGN History: "${currentPgn}"]\n\n`;
    }

    const contents = (messages || []).map((m: { role: string; content: string }, index: number) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [
        {
          text: index === 0 && contextHeader ? contextHeader + m.content : m.content,
        },
      ],
    }));

    if (contents.length === 0) {
      return res.status(400).json({ error: 'Messages cannot be empty' });
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || 'I analyzed the board, and the position remains rich in strategic possibilities.';
    res.json({ reply, modelUsed: modelName });
  } catch (err: unknown) {
    console.error('[Gemini Coach Chat Error]:', err);
    res.status(500).json({ error: (err as Error).message || 'Chatbot request failed' });
  }
});

// Socket.IO Real-Time Handlers
io.on('connection', (socket: Socket) => {
  let currentRoomId: string | null = null;
  let currentPlayer: Player | null = null;

  socket.on('user:register', (player: Player) => {
    currentPlayer = player;
    connectedSockets.set(socket.id, { userId: player.id, socketId: socket.id });
    db.getOrCreateUser({
      id: player.id,
      username: player.name,
      avatar_url: player.avatar,
      is_guest: player.isGuest,
      rating: player.rating,
    });
  });

  // Create Room
  socket.on(
    'room:create',
    (data: {
      player: Player;
      timeControlKey: string;
      customInitialSec?: number;
      customIncrementSec?: number;
      preferredColor?: 'w' | 'b' | 'random';
      rated?: boolean;
      isPrivate?: boolean;
    }) => {
      const code = generateRoomCode();
      const roomId = `room_${code}`;

      let tc: TimeControl = TIME_CONTROLS[data.timeControlKey as keyof typeof TIME_CONTROLS] || TIME_CONTROLS.blitz_5_0;
      if (data.timeControlKey === 'custom') {
        tc = {
          key: 'custom',
          name: `${Math.round((data.customInitialSec || 300) / 60)} | ${data.customIncrementSec || 0}`,
          category: 'Custom',
          initialSeconds: data.customInitialSec || 300,
          incrementSeconds: data.customIncrementSec || 0,
        };
      }

      const room = new ChessRoom(roomId, code, tc, data.rated ?? true, data.isPrivate ?? false, (state: GameState) => {
        io.to(roomId).emit('game:state', state);
      });

      // Assign initial player color
      let assignedColor: PieceColor = 'w';
      if (data.preferredColor === 'b') {
        assignedColor = 'b';
      } else if (data.preferredColor === 'random') {
        assignedColor = Math.random() > 0.5 ? 'w' : 'b';
      }

      const hostPlayer: Player = { ...data.player, color: assignedColor, connected: true };
      if (assignedColor === 'w') {
        room.state.white = hostPlayer;
      } else {
        room.state.black = hostPlayer;
      }

      rooms.set(roomId, room);
      socket.join(roomId);
      currentRoomId = roomId;
      currentPlayer = hostPlayer;

      socket.emit('room:created', { roomId, code, state: room.state, playerColor: assignedColor });
    }
  );

  // Join Room
  socket.on('room:join', (data: { roomCodeOrId: string; player: Player }) => {
    let targetRoom: ChessRoom | undefined;
    const cleanQuery = data.roomCodeOrId.trim().toUpperCase();

    for (const [, room] of rooms.entries()) {
      if (room.state.code.toUpperCase() === cleanQuery || room.state.id === data.roomCodeOrId) {
        targetRoom = room;
        break;
      }
    }

    if (!targetRoom) {
      socket.emit('room:error', { message: 'Room not found. Please check code.' });
      return;
    }

    const roomId = targetRoom.state.id;
    socket.join(roomId);
    currentRoomId = roomId;

    const joiningPlayer: Player = { ...data.player, connected: true };
    currentPlayer = joiningPlayer;

    // Determine seat: play or spectate
    if (!targetRoom.state.white && targetRoom.state.black?.id !== joiningPlayer.id) {
      joiningPlayer.color = 'w';
      targetRoom.state.white = joiningPlayer;
    } else if (!targetRoom.state.black && targetRoom.state.white?.id !== joiningPlayer.id) {
      joiningPlayer.color = 'b';
      targetRoom.state.black = joiningPlayer;
    } else if (targetRoom.state.white?.id === joiningPlayer.id) {
      joiningPlayer.color = 'w';
      targetRoom.state.white.connected = true;
    } else if (targetRoom.state.black?.id === joiningPlayer.id) {
      joiningPlayer.color = 'b';
      targetRoom.state.black.connected = true;
    } else {
      // Spectator
      targetRoom.state.spectators.push(joiningPlayer);
    }

    // If both players are seated and game waiting, start
    if (targetRoom.state.white && targetRoom.state.black && targetRoom.state.status === 'waiting') {
      targetRoom.state.status = 'in_progress';
      targetRoom.state.lastMoveTime = Date.now();
      targetRoom.startTimer();
    }

    socket.emit('room:joined', { roomId, state: targetRoom.state, playerColor: joiningPlayer.color });
    io.to(roomId).emit('game:state', targetRoom.state);
  });

  // Make Move
  socket.on('game:move', (data: { from: string; to: string; promotion?: string }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    // Verify player is on turn
    const isWhiteTurn = room.state.turn === 'w';
    const activePlayerId = isWhiteTurn ? room.state.white?.id : room.state.black?.id;

    if (!currentPlayer || currentPlayer.id !== activePlayerId) {
      socket.emit('game:move_error', { message: 'Not your turn' });
      return;
    }

    const res = room.makeMove(data.from, data.to, data.promotion as any);
    if (!res.success) {
      socket.emit('game:move_error', { message: res.error || 'Illegal move' });
    }
  });

  // Resign
  socket.on('game:resign', () => {
    if (!currentRoomId || !currentPlayer?.color) return;
    const room = rooms.get(currentRoomId);
    if (room) {
      room.resign(currentPlayer.color);
    }
  });

  // Abort
  socket.on('game:abort', () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (room) {
      room.abortGame();
    }
  });

  // Draw Offer
  socket.on('game:draw_offer', () => {
    if (!currentRoomId || !currentPlayer?.color) return;
    const room = rooms.get(currentRoomId);
    if (room) {
      room.offerDraw(currentPlayer.color);
    }
  });

  socket.on('game:draw_respond', (data: { accept: boolean }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (room) {
      room.respondDraw(data.accept);
    }
  });

  // Rematch
  socket.on('game:rematch_offer', () => {
    if (!currentRoomId || !currentPlayer) return;
    const room = rooms.get(currentRoomId);
    if (!room || room.state.status === 'in_progress') return;

    if (room.state.rematchOfferedBy && room.state.rematchOfferedBy !== currentPlayer.id) {
      // Both accepted rematch!
      room.resetForRematch();
    } else {
      room.state.rematchOfferedBy = currentPlayer.id;
      io.to(currentRoomId).emit('game:state', room.state);
    }
  });

  // Chat message
  socket.on('chat:send', (data: { text: string }) => {
    if (!currentRoomId || !currentPlayer || !data.text?.trim()) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const chatMsg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: currentPlayer.id,
      senderName: currentPlayer.name,
      text: data.text.trim().substring(0, 300),
      timestamp: Date.now(),
    };

    room.state.chat.push(chatMsg);
    if (room.state.chat.length > 100) room.state.chat.shift();
    io.to(currentRoomId).emit('chat:received', chatMsg);
  });

  // Matchmaking Quick Play Queue
  socket.on('matchmaking:queue', (data: { player: Player; timeControlKey: string }) => {
    const key = data.timeControlKey || 'blitz_3_2';
    let queue = matchmakingQueues.get(key);
    if (!queue) {
      queue = [];
      matchmakingQueues.set(key, queue);
    }

    // Remove if already in queue
    const filtered = queue.filter((item) => item.player.id !== data.player.id);
    matchmakingQueues.set(key, filtered);

    if (filtered.length > 0) {
      // Found opponent! Match them!
      const opponent = filtered.shift()!;
      matchmakingQueues.set(key, filtered);

      const code = generateRoomCode();
      const roomId = `match_${code}`;
      const tc = TIME_CONTROLS[key as keyof typeof TIME_CONTROLS] || TIME_CONTROLS.blitz_3_2;

      const room = new ChessRoom(roomId, code, tc, true, false, (state: GameState) => {
        io.to(roomId).emit('game:state', state);
      });

      // Randomize colors
      const whiteGoesToPlayer = Math.random() > 0.5;
      const whitePlayer: Player = { ...(whiteGoesToPlayer ? data.player : opponent.player), color: 'w', connected: true };
      const blackPlayer: Player = { ...(whiteGoesToPlayer ? opponent.player : data.player), color: 'b', connected: true };

      room.state.white = whitePlayer;
      room.state.black = blackPlayer;
      room.state.status = 'in_progress';
      room.state.lastMoveTime = Date.now();
      room.startTimer();

      rooms.set(roomId, room);

      // Notify matched players
      io.to(socket.id).emit('matchmaking:found', {
        roomId,
        code,
        state: room.state,
        playerColor: whiteGoesToPlayer ? 'w' : 'b',
      });
      io.to(opponent.socketId).emit('matchmaking:found', {
        roomId,
        code,
        state: room.state,
        playerColor: whiteGoesToPlayer ? 'b' : 'w',
      });
    } else {
      // Put in queue
      queue.push({ socketId: socket.id, player: data.player });
      socket.emit('matchmaking:queued', { timeControlKey: key });
    }
  });

  socket.on('matchmaking:cancel', () => {
    if (currentPlayer) {
      for (const [key, q] of matchmakingQueues.entries()) {
        matchmakingQueues.set(
          key,
          q.filter((i) => i.player.id !== currentPlayer?.id)
        );
      }
      socket.emit('matchmaking:cancelled');
    }
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    connectedSockets.delete(socket.id);

    // Remove from matchmaking queues
    if (currentPlayer) {
      for (const [key, q] of matchmakingQueues.entries()) {
        matchmakingQueues.set(
          key,
          q.filter((i) => i.player.id !== currentPlayer?.id)
        );
      }
    }

    // Flag player as disconnected in active room
    if (currentRoomId) {
      const room = rooms.get(currentRoomId);
      if (room && currentPlayer) {
        if (room.state.white?.id === currentPlayer.id) {
          room.state.white.connected = false;
        } else if (room.state.black?.id === currentPlayer.id) {
          room.state.black.connected = false;
        }
        io.to(currentRoomId).emit('game:state', room.state);
      }
    }
  });
});

// Start Full-Stack Server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[ChessKiDuniya.com] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
