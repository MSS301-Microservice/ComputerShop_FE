import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { chatService } from '../../api/services/chatService';
import type { ChatMessage, Conversation } from '../../api/types/chat';

interface Props {
  conversation: Conversation;
  currentUserId: number;
  onBack?: () => void;
  onClose?: () => void;
}

const fmt = (iso: string) => {
  try { return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
};

const dateLabel = (iso: string) => {
  try {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Hôm nay';
    if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua';
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return ''; }
};

const groupByDate = (msgs: ChatMessage[]) => {
  const groups: { label: string; msgs: ChatMessage[] }[] = [];
  msgs.forEach((m) => {
    const label = dateLabel(m.sentAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.msgs.push(m);
    else groups.push({ label, msgs: [m] });
  });
  return groups;
};

const initial = (name: string) => (name || '?').charAt(0).toUpperCase();

const ChatWindow: React.FC<Props> = ({ conversation, currentUserId, onBack, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom — dùng scrollTop trực tiếp thay vì scrollIntoView để tránh vấn đề với container
  const scrollToBottom = (smooth = false) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
  };

  // Scroll ngay sau khi messages render xong và loading = false
  useLayoutEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom(false);
    }
  }, [loading]); // khi loading chuyển false → messages đã render

  useLayoutEffect(() => {
    if (!loading) {
      scrollToBottom(true); // tin nhắn mới → smooth
    }
  }, [messages.length]); // eslint-disable-line

  // Load history
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const history = await chatService.getChatHistory(conversation.otherUserId);
        if (!cancelled) setMessages(history);
        await chatService.markAsRead(conversation.otherUserId);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [conversation.otherUserId]);

  useEffect(() => {
    chatService.connect(() => {
      setWsConnected(true);
      chatService.subscribeToConversation(currentUserId, conversation.otherUserId, (newMsg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id && m.id !== 0)) return prev;
          return [...prev.filter((m) => m.id !== 0), newMsg];
        });
      });
    });
    return () => { chatService.unsubscribeFromConversation(currentUserId, conversation.otherUserId); };
  }, [conversation.otherUserId, currentUserId]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    const optimistic: ChatMessage = {
      id: 0, conversationId: conversation.id, senderId: currentUserId,
      senderName: 'Bạn', content: text, sentAt: new Date().toISOString(), isRead: false,
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput('');
    try { chatService.sendMessage({ receiverId: conversation.otherUserId, content: text }); }
    catch (e) { console.error('[Chat] Send error:', e); }
    finally { setSending(false); inputRef.current?.focus(); }
  }, [input, sending, conversation, currentUserId]);

  const groups = groupByDate(messages);

  return (
    <div className="flex flex-col h-full bg-gray-50 font-['Jost']">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
        {onBack && (
          <button onClick={onBack} className="size-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
        )}
        <div className="size-9 bg-black/10 rounded-xl flex items-center justify-center font-black text-sm text-black">
          {initial(conversation.otherUserName)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-gray-900 truncate">{conversation.otherUserName}</p>
          <div className="flex items-center gap-1.5">
            <div className={`size-1.5 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {wsConnected ? 'Trực tuyến' : 'Đang kết nối...'}
            </p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="size-8 hover:bg-red-50 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 transition">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <span className="material-symbols-outlined text-5xl text-gray-200">chat</span>
            <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Chưa có tin nhắn</p>
            <p className="text-xs text-gray-300">Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label}>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 py-1 bg-gray-100 rounded-full">{group.label}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              {group.msgs.map((msg, idx) => {
                const isMe = msg.senderId === currentUserId;
                const isOptimistic = msg.id === 0;
                const prevMsg = group.msgs[idx - 1];
                const showAvatar = !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId);
                return (
                  <div key={`${msg.id}-${idx}`} className={`flex items-end gap-2 mb-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <div className="size-7 shrink-0 mb-1">
                        {showAvatar && (
                          <div className="size-7 bg-black/10 rounded-xl flex items-center justify-center font-black text-[10px] text-black">
                            {initial(conversation.otherUserName)}
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`flex flex-col gap-1 max-w-[72%] ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm transition-opacity ${
                        isMe
                          ? `bg-black text-white rounded-br-sm ${isOptimistic ? 'opacity-60' : ''}`
                          : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-[9px] font-bold text-gray-300 px-1">
                        {fmt(msg.sentAt)}{isMe && isOptimistic && ' · Đang gửi...'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3 bg-gray-50 rounded-2xl border border-gray-200 px-4 py-2 focus-within:border-black/30 focus-within:ring-2 focus-within:ring-black/5 transition-all">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Nhập tin nhắn..."
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-300 outline-none border-none focus:outline-none focus:ring-0 font-medium"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="size-9 bg-black rounded-xl flex items-center justify-center text-white disabled:opacity-40 hover:bg-gray-800 active:scale-95 transition-all"
          >
            {sending
              ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              : <span className="material-symbols-outlined text-lg">send</span>
            }
          </button>
        </div>
        <p className="text-[10px] text-gray-300 font-bold text-center mt-1.5">Enter để gửi</p>
      </div>
    </div>
  );
};

export default ChatWindow;
