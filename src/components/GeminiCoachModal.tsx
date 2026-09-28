import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Volume2, Bot, X, RefreshCw, Compass } from 'lucide-react';
import { sounds } from '../services/soundService';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface GeminiCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFen: string;
  currentPgn: string;
}

type CoachRole = 'general' | 'grandmaster' | 'blitz';

export const GeminiCoachModal: React.FC<GeminiCoachModalProps> = ({
  isOpen,
  onClose,
  currentFen,
  currentPgn,
}) => {
  const [role, setRole] = useState<CoachRole>('general');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Greetings! I am your Grandmaster Chess Coach. I can analyze your positions, suggest plans, explain tactical blunders, and evaluate candidates. What would you like to review?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isLoading]);

  if (!isOpen) return null;

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/coach-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          roleType: role,
          currentFen,
          currentPgn,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Could not connect to coach analysis right now. Please try again.' },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error contacting Grandmaster coach. Check network connection.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = async (text: string, idx: number) => {
    try {
      setSpeakingIdx(idx);
      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.slice(0, 300), // Speak the core advice
          voice: role === 'grandmaster' ? 'Fenrir' : role === 'blitz' ? 'Puck' : 'Zephyr',
        }),
      });
      const data = await res.json();
      if (data.audio) {
        await sounds.playBase64Audio(data.audio, data.mimeType || 'audio/pcm;rate=24000');
      }
    } catch (err) {
      console.warn('TTS playback error:', err);
    } finally {
      setSpeakingIdx(null);
    }
  };

  const analyzeCurrentPosition = () => {
    sendMessage(
      `Please evaluate the current board position. What are the key threats, candidate moves, and positional imbalances for both sides?`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-xl w-full h-[620px] flex flex-col shadow-2xl relative animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#36322d] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#81b64c]/20 border border-[#81b64c]/40 flex items-center justify-center text-[#81b64c]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">ChessKiDuniya Game Review & Coach</h3>
                <span className="text-[10px] bg-[#81b64c]/20 text-[#a3d160] border border-[#81b64c]/30 px-2 py-0.5 rounded-full font-bold">
                  AI Review
                </span>
              </div>
              <p className="text-xs text-[#989795]">Accuracy evaluation, blunder check and tactical coaching</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#989795] hover:text-white rounded-full bg-[#312e2b] hover:bg-[#3d3a34] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Coach Persona Selector */}
        <div className="grid grid-cols-3 gap-2 py-3 border-b border-slate-800/80 shrink-0 text-xs">
          <button
            onClick={() => setRole('general')}
            className={`py-1.5 px-2 rounded-xl font-bold border transition ${
              role === 'general'
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            Mikhail (General)
          </button>
          <button
            onClick={() => setRole('grandmaster')}
            className={`py-1.5 px-2 rounded-xl font-bold border transition ${
              role === 'grandmaster'
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            Kasparov (Deep Pro)
          </button>
          <button
            onClick={() => setRole('blitz')}
            className={`py-1.5 px-2 rounded-xl font-bold border transition ${
              role === 'blitz'
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            Gary (Speed Blitz)
          </button>
        </div>

        {/* Quick Action: Analyze Current Position */}
        <div className="py-2 flex items-center justify-between shrink-0">
          <button
            onClick={analyzeCurrentPosition}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Analyze Current Position</span>
          </button>

          <span className="text-[11px] text-slate-500 font-mono">
            {role === 'grandmaster' ? 'gemini-3.1-pro-preview' : role === 'blitz' ? 'gemini-3.1-flash-lite' : 'gemini-3.5-flash'}
          </span>
        </div>

        {/* Message Thread */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-950/60 rounded-2xl border border-slate-800 my-2">
          {messages.map((m, idx) => {
            const isMe = m.role === 'user';
            return (
              <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center space-x-1.5 mb-1 px-1">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {isMe ? 'You' : 'Coach'}
                  </span>
                  {!isMe && (
                    <button
                      onClick={() => handleSpeak(m.content, idx)}
                      title="Speak with Gemini TTS"
                      disabled={speakingIdx === idx}
                      className="p-1 text-slate-400 hover:text-amber-400 rounded-md transition"
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${speakingIdx === idx ? 'text-amber-400 animate-spin' : ''}`} />
                    </button>
                  )}
                </div>

                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[90%] whitespace-pre-wrap ${
                    isMe
                      ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                      : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center space-x-2 text-xs text-amber-400 bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span>Grandmaster is calculating variations...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex items-center space-x-2 pt-2 shrink-0"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything (e.g. 'What is the Sicilian defense idea?')"
            className="flex-1 bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
