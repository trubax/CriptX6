import React from 'react';
import ChatList from './ChatList';
import ChatFilters from './ChatFilters';
import { ChatPreview } from './types';

interface ChatContainerProps {
  chats: ChatPreview[];
  loading: boolean;
  error: string | null;
  activeFilter: 'all' | 'direct' | 'groups';
  onFilterChange: (filter: 'all' | 'direct' | 'groups') => void;
  onSelectChat: (chat: ChatPreview) => void;
  onDeleteChat: (chatId: string) => void;
  onStartCall: (chatId: string, isVideo: boolean) => void;
}

export default function ChatContainer({
  chats,
  loading,
  error,
  activeFilter,
  onFilterChange,
  onSelectChat,
  onDeleteChat,
  onStartCall
}: ChatContainerProps) {
  const filteredChats = chats.filter(chat => {
    switch (activeFilter) {
      case 'direct':
        return !chat.isGroup;
      case 'groups':
        return chat.isGroup;
      default:
        return true;
    }
  });

  const chatCounts = {
    all: chats.length,
    direct: chats.filter(chat => !chat.isGroup).length,
    groups: chats.filter(chat => chat.isGroup).length
  };

  return (
    <div className="pt-16">
      <ChatFilters
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
        counts={chatCounts}
      />

      <div className="overflow-y-auto" style={{ height: 'calc(100vh - 128px)' }}>
        {error && (
          <div className="p-4 text-red-500 text-center">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span className="theme-text">Caricamento chat...</span>
          </div>
        ) : filteredChats.length > 0 ? (
          <ChatList 
            chats={filteredChats}
            onSelectChat={onSelectChat}
            onDeleteChat={onDeleteChat}
            onStartCall={onStartCall}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <span className="theme-text text-lg mb-2">
              {activeFilter === 'groups' 
                ? 'Nessun gruppo attivo'
                : activeFilter === 'direct'
                ? 'Nessuna chat diretta'
                : 'Nessuna chat attiva'}
            </span>
            <span className="theme-text opacity-70 text-center">
              {activeFilter === 'groups'
                ? 'Crea un nuovo gruppo dalla sezione Gruppi'
                : 'Seleziona un contatto dalla rubrica per iniziare una nuova conversazione'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}