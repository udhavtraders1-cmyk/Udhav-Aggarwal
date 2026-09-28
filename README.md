# ♔ Stratagem Chess - Modern Online Multiplayer Chess Platform

An original, fast, and feature-complete online multiplayer chess web application inspired by the functionality of Chess.com and Lichess.org, built with modern design principles and full-stack real-time architecture.

---

## 🌟 Core Features

- **Real-Time 1v1 Multiplayer:**
  - Create private rooms with custom room codes and shareable one-click invite links (`#room=CODE`).
  - Join room modal with code or full URL support.
  - Quick Match matchmaking queue matching players by time control.
  - Solo practice vs Grandmaster AI Bot with dynamic tactics.
  - Spectator mode for ongoing games.

- **Authoritative Chess Rules & Validation:**
  - Legal move validation powered by `chess.js` on both server and client.
  - Full support for Castling (kingside & queenside), En Passant, Pawn Promotion dialog (Queen, Rook, Bishop, Knight).
  - Complete game termination detection: Checkmate, Stalemate, Threefold Repetition, 50-Move Rule, Insufficient Material, Resignation, Draw Offer agreement, and Abort (< 2 moves).

- **Chess Clocks & Time Controls:**
  - Selectable presets: Bullet (1|0, 2|1), Blitz (3|0, 3|2, 5|0, 5|3), Rapid (10|0, 15|10, 30|0), or Custom time & increments.
  - Server-synchronized clocks with increment addition (+1s, +2s, +3s).
  - Visual pulsation and low-time warning audio (< 20s and tenth-second precision under 10s).

- **Original UI & Board Polish:**
  - Custom vector SVG chess piece set (King, Queen, Rook, Bishop, Knight, Pawn).
  - Multiple board themes: Emerald Green (Classic), Wood Grain (Master), Midnight Slate (Modern Dark), Cosmic Neon (Cyber), Royal Velvet.
  - Last-move glowing trails, check alerts, and legal move indicators.
  - Board orientation flip (White / Black perspective).
  - Move history with standard SAN notation and one-click PGN copy & download.
  - Captured pieces advantage counter (+1, +3, etc.).

- **Sound & Voice Commentary:**
  - Zero-latency synthesized Web Audio effects for moves, captures, castling, check, checkmate, and low time.
  - High-fidelity Grandmaster move announcements and spoken commentary using **Gemini 3.8 Flash TTS** (`gemini-3.8-flash-tts`).

- **Gemini AI Coaching & Chatbot:**
  - Multi-turn chess conversation maintaining dialogue history in a scrollable thread.
  - Switchable Grandmaster Coach personas:
    - Mikhail (Instructive & Strategic) - powered by `gemini-3.5-flash`
    - Kasparov Deep Theorist (Complex Calculation) - powered by `gemini-3.1-pro-preview`
    - Gary Blitz Coach (Fast Tactical Reflexes) - powered by `gemini-3.1-flash-lite`
  - "Analyze Current Position" button: automatically passes live FEN and PGN context to the coach.
  - Spoken audio playback of coach analysis via Gemini TTS.

- **AI Chess Portrait Generator:**
  - High-quality avatar art generator using **Gemini 3 Pro Image** (`gemini-3-pro-image-preview` / `gemini-3-pro-image`).
  - User affordance to select **1K**, **2K**, and **4K** image sizes.

- **Player Profiles, ELO & Friends:**
  - Standard Elo rating calculation formula with $K=32$.
  - Guest and user accounts with match history.
  - Friends system with online status and direct challenge invites.

---

## 🛠 Tech Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS v4 + Motion
- **Backend:** Node.js + Express + Socket.IO (Server-authoritative game state)
- **Chess Engine:** `chess.js`
- **Database:** PostgreSQL (`pg`) with automatic `schema.sql` initialization, and in-memory persistence fallback
- **Audio:** Web Audio API synthesizer + Google GenAI TTS (`gemini-3.8-flash-tts`)
- **AI Models:** `@google/genai` (Gemini 3.8 Flash, Gemini 3.5 Flash, Gemini 3.1 Pro, Gemini 3.1 Flash-Lite, Gemini 3 Pro Image)

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Node.js 18+ installed
- (Optional) PostgreSQL database instance

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your `.env` variables:
```env
GEMINI_API_KEY="your_gemini_api_key_here"
APP_URL="http://localhost:3000"

# Optional: PostgreSQL Database URL. If omitted, in-memory persistence is used.
DATABASE_URL="postgresql://username:password@localhost:5432/stratagem_chess"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run Core Game Logic Unit Tests
```bash
npm test
```
The test suite validates:
- Legal chess moves & turn alternation
- Kingside & queenside castling
- En passant captures
- Pawn promotion to Queen/Rook/Bishop/Knight
- Scholar's mate checkmate detection
- Stalemate and draw rule detection
- Elo rating formula calculations
- Chess clock decrements and move increments

### 6. Production Build
```bash
npm run build
npm start
```
