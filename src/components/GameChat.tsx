import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types/chess';
import { Send, MessageSquare } from 'lucide-react';

interface GameChatProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (text: string) => void;
}

const QUICK_CHATS = ['Good game! 🤝', 'Well played! 👏', 'Brilliant move! 🌟', 'Thanks for the game!', 'Rematch? ⚔️'];

export const GameChat: React.FC<GameChatProps> = ({
  messages,
  currentUserId,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-[#262421] border border-[#36322d] rounded-xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center space-x-2 px-3.5 py-2.5 bg-[#211f1c] border-b border-[#36322d] shrink-0">
        <MessageSquare className="w-4 h-4 text-[#81b64c]" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">
          Game Chat
        </h3>
      </div>

      {/* Message List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[140px] max-h-[180px]">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#989795] text-xs italic">
            Say hi to your opponent! ♟️
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-[#989795] font-semibold mb-0.5 px-1">
                  {isMe ? 'You' : msg.senderName}
                </span>
                <div
                  className={`px-3 py-1.5 rounded-lg text-xs max-w-[85%] break-words ${
                    isMe
                      ? 'bg-[#81b64c] text-white font-medium rounded-tr-none'
                      : 'bg-[#312e2b] text-[#c3c2c1] rounded-tl-none border border-[#3d3a34]'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick reaction chips */}
      <div className="px-2 py-1.5 flex items-center space-x-1.5 overflow-x-auto no-scrollbar border-t border-[#36322d] bg-[#211f1c]">
        {QUICK_CHATS.map((qc) => (
          <button
            key={qc}
            onClick={() => onSendMessage(qc)}
            className="text-[10px] whitespace-nowrap px-2.5 py-1 bg-[#312e2b] hover:bg-[#3d3a34] text-[#c3c2c1] rounded-md transition shrink-0"
          >
            {qc}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <form onSubmit={handleSend} className="p-2 bg-[#211f1c] border-t border-[#36322d] flex items-center space-x-2 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Send a message..."
          maxLength={200}
          className="flex-1 bg-[#262421] border border-[#3d3a34] text-white placeholder-[#5c5955] text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#81b64c]"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 bg-[#81b64c] hover:bg-[#a3d160] disabled:opacity-40 text-white rounded-lg transition font-bold"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
