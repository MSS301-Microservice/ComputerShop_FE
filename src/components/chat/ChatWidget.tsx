import React, { useState, useEffect, useCallback, useRef } from 'react';
import { chatService } from '../../api/services/chatService';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import type { Conversation } from '../../api/types/chat';

const STAFF_ROLE = 'STAFF';

interface Props {
  currentUserId: number;
  openToUserId?: number;
  openToUserName?: string;
}

const ChatWidget: React.FC<Props> = ({ currentUserId, openToUserId, openToUserName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [staffList, setStaffList] = useState<{ userId: number; username: string }[]>([]);
  const selectedRef = useRef<Conversation | null>(null);
  selectedRef.current = selected;

  const loadConversations = useCallback(async () => {
    try {
      const convs = await chatService.getConversations();
      // Zero out unread for the currently open conversation
      const activeId = selectedRef.current?.otherUserId;
      const adjusted = convs.map((c) =>
        c.otherUserId === activeId ? { ...c, unreadCount: 0 } : c
      );
      setConversations(adjusted);
    } catch (e) {
      console.error('[ChatWidget] load error:', e);
    }
  }, []);

  // Unread total — exclude the currently selected conversation
  const unreadTotal = conversations.reduce((s, c) => {
    if (c.otherUserId === selected?.otherUserId) return s;
    return s + (c.unreadCount || 0);
  }, 0);

  // Poll unread every 15s — only when widget is closed (no need when open, loadConversations handles it)
  useEffect(() => {
    if (isOpen) return;
    const poll = async () => {
      try {
        const convs = await chatService.getConversations();
        // Don't update full list here, just recalc badge
        const total = convs.reduce((s, c) => s + (c.unreadCount || 0), 0);
        // Update conversations silently for badge
        setConversations(convs);
      } catch {}
    };
    poll();
    const id = setInterval(poll, 15000);
    return () => clearInterval(id);
  }, [isOpen]);

  // When widget opens: load conversations + staff list + start refresh interval
  useEffect(() => {
    if (!isOpen) return;
    setLoadingConvs(true);
    loadConversations().finally(() => setLoadingConvs(false));
    chatService.getStaffList().then(setStaffList).catch(() => {});
    const id = setInterval(loadConversations, 30000);
    return () => clearInterval(id);
  }, [isOpen, loadConversations]);

  // When a conversation is selected, mark it as read immediately
  useEffect(() => {
    if (!selected) return;
    // Zero unread in local state right away
    setConversations((prev) =>
      prev.map((c) => c.otherUserId === selected.otherUserId ? { ...c, unreadCount: 0 } : c)
    );
  }, [selected?.otherUserId]); // eslint-disable-line

  // Handle external open-chat event (e.g. from Shop "Liên hệ ngay")
  useEffect(() => {
    const handler = async (e: CustomEvent) => {
      const { userId, userName } = (e.detail || {}) as { userId?: number; userName?: string };
      setIsOpen(true);

      // If userId provided directly, use it; otherwise fetch first staff
      let targetId = userId;
      let targetName = userName ?? 'Nhân viên hỗ trợ';

      if (!targetId) {
        try {
          const list = await chatService.getStaffList();
          if (list.length > 0) {
            targetId = list[0].userId;
            targetName = list[0].username;
          }
        } catch {}
      }

      if (!targetId) return;

      setConversations((prev) => {
        const existing = prev.find((c) => c.otherUserId === targetId);
        setSelected(existing ?? {
          id: 0, roomKey: '', otherUserId: targetId!,
          otherUserName: targetName, otherUserRole: STAFF_ROLE,
          lastMessage: '', lastMessageAt: new Date().toISOString(), unreadCount: 0,
        });
        return prev;
      });
    };
    window.addEventListener('open-chat-with-staff', handler as EventListener);
    return () => window.removeEventListener('open-chat-with-staff', handler as EventListener);
  }, []);

  // openToUserId prop
  useEffect(() => {
    if (!openToUserId) return;
    setIsOpen(true);
    const existing = conversations.find((c) => c.otherUserId === openToUserId);
    setSelected(existing ?? {
      id: 0, roomKey: '', otherUserId: openToUserId,
      otherUserName: openToUserName || 'Nhân viên hỗ trợ',
      otherUserRole: STAFF_ROLE,
      lastMessage: '', lastMessageAt: new Date().toISOString(), unreadCount: 0,
    });
  }, [openToUserId]); // eslint-disable-line

  const handleSelect = (conv: Conversation) => {
    setSelected(conv);
  };

  const handleStartChatWithStaff = () => {
    if (staffList.length === 0) return;
    const staff = staffList[0];
    const existing = conversations.find((c) => c.otherUserId === staff.userId);
    setSelected(existing ?? {
      id: 0, roomKey: '', otherUserId: staff.userId,
      otherUserName: staff.username, otherUserRole: STAFF_ROLE,
      lastMessage: '', lastMessageAt: new Date().toISOString(), unreadCount: 0,
    });
  };

  return (
    <>
      {/* Floating button — badge excludes active conversation */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[999] size-14 bg-black hover:bg-gray-800 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          aria-label="Mở chat"
        >
          <span className="material-symbols-outlined text-2xl">chat</span>
          {unreadTotal > 0 && (
            <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
              {unreadTotal > 9 ? '9+' : unreadTotal}
            </span>
          )}
        </button>
      )}

      {/* Widget window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[999] w-full max-w-[400px] h-[540px] bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden border border-gray-200">
          {!selected ? (
            <>
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-9 bg-black rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-lg">chat</span>
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Tin nhắn</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{conversations.length} cuộc trò chuyện</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="size-8 hover:bg-red-50 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 transition">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {staffList.length > 0 && (
                <div className="px-4 pt-3 pb-1">
                  <button
                    onClick={handleStartChatWithStaff}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition"
                  >
                    <span className="material-symbols-outlined text-lg">support_agent</span>
                    Chat với nhân viên hỗ trợ
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-hidden">
                <ChatSidebar
                  conversations={conversations}
                  loading={loadingConvs}
                  selectedId={null}
                  onSelect={handleSelect}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              </div>
            </>
          ) : (
            <ChatWindow
              conversation={selected}
              currentUserId={currentUserId}
              onBack={() => setSelected(null)}
              onClose={() => setIsOpen(false)}
            />
          )}
        </div>
      )}
    </>
  );
};

export default ChatWidget;
