import React, { useState } from 'react';
import { Pin, MoreVertical, Trash2, Phone, Video, UserCircle2, Users } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChatPreview } from './types';

interface ChatListProps {
  chats: ChatPreview[];
  onSelectChat: (chat: ChatPreview) => void;
  onDeleteChat: (chatId: string) => void;
  onStartCall: (chatId: string, isVideo: boolean) => void;
}

export default function ChatList({ chats, onSelectChat, onDeleteChat, onStartCall }: ChatListProps) {
  const pinnedChats = chats.filter(chat => chat.pinned);
  const unpinnedChats = chats.filter(chat => !chat.pinned);

  const formatTimestamp = (timestamp: Date | string) => {
    if (!timestamp) return '';
    
    if (typeof timestamp === 'string') {
      return timestamp;
    }

    const now = new Date();
    const messageDate = new Date(timestamp);

    if (messageDate.toDateString() === now.toDateString()) {
      return format(messageDate, 'HH:mm');
    }

    if (now.getTime() - messageDate.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return formatDistanceToNow(messageDate, { addSuffix: true, locale: it });
    }

    return format(messageDate, 'dd/MM/yyyy');
  };

  return (
    <div className="divide-y theme-divide">
      {pinnedChats.map(chat => (
        <ChatItem 
          key={`pinned-${chat.id}`}
          chat={chat} 
          onSelect={onSelectChat} 
          onDelete={onDeleteChat}
          onStartCall={onStartCall}
          formatTimestamp={formatTimestamp}
        />
      ))}
      {unpinnedChats.map(chat => (
        <ChatItem 
          key={`chat-${chat.id}`}
          chat={chat} 
          onSelect={onSelectChat} 
          onDelete={onDeleteChat}
          onStartCall={onStartCall}
          formatTimestamp={formatTimestamp}
        />
      ))}
    </div>
  );
}

interface ChatItemProps {
  chat: ChatPreview;
  onSelect: (chat: ChatPreview) => void;
  onDelete: (chatId: string) => void;
  onStartCall: (chatId: string, isVideo: boolean) => void;
  formatTimestamp: (timestamp: Date | string) => string;
}

function ChatItem({ 
  chat, 
  onSelect, 
  onDelete,
  onStartCall,
  formatTimestamp
}: ChatItemProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Sei sicuro di voler eliminare questa chat?')) {
      try {
        await onDelete(chat.id);
        setShowMenu(false);
      } catch (error) {
        console.error('Error deleting chat:', error);
        alert('Errore durante l\'eliminazione della chat. Riprova più tardi.');
      }
    }
  };

  const handleCall = (e: React.MouseEvent, isVideo: boolean) => {
    e.stopPropagation();
    onStartCall(chat.id, isVideo);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  return (
    <div
      onClick={() => onSelect(chat)}
      className="flex items-center p-4 cursor-pointer relative hover:theme-bg-secondary transition-colors"
    >
      <div className="relative">
        <img 
          src={chat.photoURL} 
          alt={chat.name} 
          className="w-12 h-12 rounded-full"
        />
        {chat.status === 'online' && (
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 theme-bg-primary bg-green-500" />
        )}
      </div>
      <div className="ml-4 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium theme-text">
              {chat.name}
            </h3>
            {chat.isGroup && (
              <Users className="w-4 h-4 theme-text opacity-70" />
            )}
            {chat.isAnonymous && (
              <UserCircle2 className="w-4 h-4 theme-text opacity-70" />
            )}
            {chat.pinned && (
              <Pin className="w-4 h-4 theme-accent" />
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm theme-text opacity-70">
              {formatTimestamp(chat.timestamp)}
            </span>
            <div className="flex items-center space-x-1">
              <button
                onClick={(e) => handleCall(e, false)}
                className="p-2 rounded-full hover:theme-bg-secondary text-green-500"
                disabled={chat.status !== 'online'}
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => handleCall(e, true)}
                className="p-2 rounded-full hover:theme-bg-secondary text-blue-500"
                disabled={chat.status !== 'online'}
              >
                <Video className="w-4 h-4" />
              </button>
              <button
                onClick={toggleMenu}
                className="p-1 rounded-full hover:theme-bg-secondary"
              >
                <MoreVertical className="w-4 h-4 theme-text" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center mt-1">
          <p className="text-sm truncate theme-text opacity-70 max-w-[70%]">
            {chat.lastMessage}
          </p>
          {chat.unread > 0 && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-green-500 text-white text-xs font-medium">
              {chat.unread}
            </span>
          )}
        </div>
      </div>

      {showMenu && (
        <div className="absolute right-4 top-16 z-50 rounded-lg shadow-lg theme-bg-primary">
          <button
            onClick={handleDelete}
            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-500 hover:theme-bg-secondary"
          >
            <Trash2 className="w-4 h-4" />
            <span>Elimina chat</span>
          </button>
        </div>
      )}
    </div>
  );
}