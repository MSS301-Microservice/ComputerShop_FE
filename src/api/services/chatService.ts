import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { apiClient } from '../client';
import { API_BASE_URL } from '../config';
import type { Conversation, ChatMessage, ChatMessageRequest } from '../types/chat';

const TOKEN_KEY = 'authToken';

class ChatService {
  private stompClient: Client | null = null;
  private subscriptions: Map<string, { unsubscribe: () => void }> = new Map();

  // ── REST ──────────────────────────────────────────────

  async getConversations(): Promise<Conversation[]> {
    const res = await apiClient.get<Conversation[]>('/api/v1/chat/conversations', true);
    return (res.result as any) ?? [];
  }

  async getChatHistory(otherUserId: number): Promise<ChatMessage[]> {
    const res = await apiClient.get<ChatMessage[]>(`/api/v1/chat/history/${otherUserId}`, true);
    return (res.result as any) ?? [];
  }

  async markAsRead(otherUserId: number): Promise<void> {
    await fetch(`${API_BASE_URL}/api/v1/chat/read/${otherUserId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async getStaffList(): Promise<{ userId: number; username: string }[]> {
    const res = await apiClient.get<{ userId: number; username: string }[]>('/api/v1/chat/staff-list', true);
    return (res.result as any) ?? [];
  }

  // ── WebSocket ─────────────────────────────────────────

  connect(onConnected: () => void, onError?: (err: any) => void): void {
    if (this.stompClient?.connected) {
      onConnected();
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    // In dev, API_BASE_URL is '' so we use window.location.origin
    // The BE context-path is /api/v1, so WS endpoint is /api/v1/ws
    const baseUrl = API_BASE_URL || window.location.origin;
    const wsUrl = import.meta.env.DEV
      ? `${window.location.origin}/api/v1/ws`
      : `${baseUrl}/api/v1/ws`;

    const client = new Client({
      webSocketFactory: () => new (SockJS as any)(wsUrl),
      reconnectDelay: 5000,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      onConnect: () => {
        console.log('[Chat WS] Connected');
        onConnected();
      },
      onDisconnect: () => console.log('[Chat WS] Disconnected'),
      onStompError: (frame) => {
        console.error('[Chat WS] STOMP error:', frame.headers['message']);
        if (onError) onError(frame);
      },
    });

    client.activate();
    this.stompClient = client;
  }

  sendMessage(request: ChatMessageRequest): void {
    if (!this.stompClient?.connected) {
      console.warn('[Chat WS] Not connected');
      return;
    }
    this.stompClient.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(request),
    });
  }

  subscribeToConversation(myId: number, otherUserId: number, onMessage: (msg: ChatMessage) => void): void {
    if (!this.stompClient) return;
    const roomKey = `${Math.min(myId, otherUserId)}_${Math.max(myId, otherUserId)}`;
    const topic = `/topic/chat.${roomKey}`;
    if (this.subscriptions.has(topic)) return;

    const sub = this.stompClient.subscribe(topic, (msg) => {
      try {
        onMessage(JSON.parse(msg.body) as ChatMessage);
      } catch (e) {
        console.error('[Chat WS] Parse error:', e);
      }
    });
    this.subscriptions.set(topic, sub);
  }

  unsubscribeFromConversation(myId: number, otherUserId: number): void {
    const roomKey = `${Math.min(myId, otherUserId)}_${Math.max(myId, otherUserId)}`;
    const topic = `/topic/chat.${roomKey}`;
    const sub = this.subscriptions.get(topic);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(topic);
    }
  }

  disconnect(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions.clear();
    this.stompClient?.deactivate();
    this.stompClient = null;
  }

  get isConnected(): boolean {
    return !!this.stompClient?.connected;
  }
}

export const chatService = new ChatService();
