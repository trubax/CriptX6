export interface ChatData {
  id: string;
  type: 'individual' | 'group';
  participants: string[];
  participantsData: {
    [key: string]: {
      displayName: string;
      photoURL: string;
      isAnonymous: boolean;
    };
  };
  createdAt: any;
  updatedAt: any;
  lastMessage: string;
  lastMessageTime: any;
  isBlocked: boolean;
  messageTimer: number;
  screenshotPrevention: boolean;
  unreadCount: {
    [key: string]: number;
  };
  isVisible: boolean;
  recipientPublicKey?: string;
}

export interface Message {
  id: string;
  text: string;
  timestamp: any;
  senderId: string;
  senderName: string;
  isMe: boolean;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video' | 'audio' | 'document';
  fileName?: string;
}

export interface ChatOptions {
  isBlocked: boolean;
  messageTimer: number;
  screenshotPrevention: boolean;
  unreadCount: {
    [key: string]: number;
  };
}