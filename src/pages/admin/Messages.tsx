import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { chatService } from '../../api/services/chatService';
import AdminLayout from '../../components/layout/AdminLayout';
import ChatSidebar from '../../components/chat/ChatSidebar';
import ChatWindow from '../../components/chat/ChatWindow';
import { useCurrentUserId } from '../../hooks/useCurrentUserId';
import type { Conversation } from '../../api/types/chat';

const StaffMessages: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = useCurrentUserId();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadConversations = useCallback(async () => {
    try {
      const convs = await chatService.getConversations();
      // Zero out unread for the currently selected conversation
      setConversations((prev) => {
        const selectedId = prev.find((c) => c.otherUserId === selected?.otherUserId)?.otherUserId;
        return convs.map((c) =>
          c.otherUserId === selectedId ? { ...c, unreadCount: 0 } : c
        );
      });
    } catch (e) {
      console.error('[StaffMessages] load error:', e);
    }
  }, [selected?.otherUserId]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      await loadConversations();
      setLoading(false);
    })();
    // Poll every 5s to catch new conversations and update sidebar
    const pollId = setInterval(loadConversations, 5000);
    return () => clearInterval(pollId);
  }, [user, loadConversations]);

  const handleSelect = (conv: Conversation) => {
    setSelected(conv);
    setConversations((prev) =>
      prev.map((c) => c.otherUserId === conv.otherUserId ? { ...c, unreadCount: 0 } : c)
    );
  };

  const totalUnread = conversations.reduce((s, c) => {
    if (c.otherUserId === selected?.otherUserId) return s;
    return s + c.unreadCount;
  }, 0);

  return (
    <AdminLayout
      title="Tin nhắn"
      subtitle="Quản lý tin nhắn hỗ trợ khách hàng"
      actions={totalUnread > 0 ? (
        <span className="bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold">
          {totalUnread} tin nhắn mới
        </span>
      ) : undefined}
    >
      <div className="flex h-[calc(100vh-180px)] rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
        <div className="w-80 border-r border-gray-100 flex-shrink-0">
          <ChatSidebar
            conversations={conversations}
            loading={loading}
            selectedId={selected?.otherUserId ?? null}
            onSelect={handleSelect}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        <div className="flex-1 overflow-hidden">
          {selected && currentUserId ? (
            <ChatWindow
              conversation={selected}
              currentUserId={currentUserId}
              onBack={() => setSelected(null)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <span className="material-symbols-outlined text-6xl text-gray-200">chat</span>
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Chọn một cuộc trò chuyện</p>
              <p className="text-xs text-gray-300">để bắt đầu nhắn tin với khách hàng</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default StaffMessages;
