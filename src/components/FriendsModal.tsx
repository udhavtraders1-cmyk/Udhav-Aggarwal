import React, { useState } from 'react';
import { X, Users, UserPlus, Swords } from 'lucide-react';
import { Friend } from '../types/chess';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: Friend[];
  onAddFriend: (username: string) => void;
  onChallengeFriend: (friend: Friend) => void;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  friends,
  onAddFriend,
  onChallengeFriend,
}) => {
  const [friendName, setFriendName] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendName.trim()) return;
    onAddFriend(friendName.trim());
    setFriendName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Friends & Challenges</h3>
            <p className="text-xs text-slate-400">Challenge friends directly to a match</p>
          </div>
        </div>

        {/* Add Friend Form */}
        <form onSubmit={handleAdd} className="flex items-center space-x-2 mb-5">
          <input
            type="text"
            value={friendName}
            onChange={(e) => setFriendName(e.target.value)}
            placeholder="Add player by username..."
            className="flex-1 bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={!friendName.trim()}
            className="px-3 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl transition flex items-center space-x-1"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>

        {/* Friends List */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {friends.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No friends added yet. Add a username above to play with friends anytime!
            </div>
          ) : (
            friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      className="w-9 h-9 rounded-xl object-cover bg-slate-800"
                    />
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                        friend.online ? 'bg-emerald-500' : 'bg-slate-600'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-200 truncate">{friend.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {friend.rating} ELO • {friend.online ? 'Online' : 'Offline'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onChallengeFriend(friend)}
                  className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[11px] rounded-lg transition flex items-center space-x-1 shrink-0"
                >
                  <Swords className="w-3.5 h-3.5" />
                  <span>Play</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
