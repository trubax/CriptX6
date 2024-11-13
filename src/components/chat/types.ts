export interface ChatPreview {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: Date | string;
  unread: number;
  photoURL: string;
  status?: string;
  lastSeen?: Date | string;
  pinned?: boolean;
  isAnonymous?: boolean;
  isGroup?: boolean;
}

export interface Contact {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'unregistered';
  lastSeen?: string;
  photoURL?: string;
  phoneNumber?: string;
  isAnonymous?: boolean;
}