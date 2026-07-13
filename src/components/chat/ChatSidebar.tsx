import React from 'react';
import type { Conversation } from '../../api/types/chat';

interface Props {
  conversations: Conversation[];
  loading: boolean;
  selectedId: number | null;
  onSelect: (conv: Conversation) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const fmtTime = (iso: string) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diffMin < 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin}ph`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}g`;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  } catch { return ''; }
};

const initial = (name: string) => (name || '?').charAt(0).toUpperCase();

const ChatSidebar: React.FC<Props> = ({ conversations, loading, selectedId, onSelect, searchQuery, onSearchChange }) => {
  const filtered = conversations.filter((c) =>
    c.otherUserName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white font-['Jost']">
      <div className="p-4 border-b border-gray-100">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-lg">search</span>
          <input
            type="text"
            placeholder="Tìm cuộc trò chuyện..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-700 placeholder-gray-300 outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-300">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
            <p className="text-xs font-bold uppercase tracking-widest">Đang tải...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
            <span className="material-symbols-outlined text-5xl text-gray-200">chat</span>
            <p className="text-xs font-black text-gray-300 uppercase tracking-widest">
              {searchQuery ? 'Không tìm thấy' : 'Chưa có tin nhắn nào'}
            </p>
          </div>
        ) : (
          <div className="py-2">
            {filtered.map((conv) => {
              const isSelected = selectedId === conv.otherUserId;
              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv)}
                  className={`w-full flex items-center gap-4 px-5 py-4 transition-all text-left group relative border-r-4 ${
                    isSelected ? 'bg-black/5 border-black' : 'hover:bg-gray-50 border-transparent'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className={`size-11 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${
                      isSelected ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {initial(conv.otherUserName)}
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-sm font-black truncate ${isSelected ? 'text-black' : 'text-gray-900'}`}>
                        {conv.otherUserName}
                      </p>
                      <span className="text-[10px] font-bold text-gray-400 shrink-0 ml-2">{fmtTime(conv.lastMessageAt)}</span>
                    </div>
                    <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'font-bold text-gray-700' : 'text-gray-400 font-medium'}`}>
                      {conv.lastMessage || 'Bắt đầu cuộc trò chuyện'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
