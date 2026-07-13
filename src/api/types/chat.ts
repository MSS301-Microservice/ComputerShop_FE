export interface Conversation {
  id: number;
  roomKey: string;
  otherUserId: number;
  otherUserName: string;
  otherUserRole: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  sentAt: string;
  isRead: boolean;
}

export interface ChatMessageRequest {
  receiverId: number;
  content: string;
}
