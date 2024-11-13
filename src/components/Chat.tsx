import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from './chat/Header';
import ChatView from './ChatView';
import { useNotifications } from '../hooks/useNotifications';
import { doc, writeBatch, getDocs, getDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import type { ChatPreview } from './chat/types';
import { CallService } from '../services/CallService';
import { useChatList } from '../hooks/useChatList';
import ChatContainer from './chat/ChatContainer';

type ChatFilter = 'all' | 'direct' | 'groups';

export default function Chat() {
  const [activeFilter, setActiveFilter] = useState<ChatFilter>('all');
  const [selectedChat, setSelectedChat] = useState<ChatPreview | null>(null);
  const { currentUser } = useAuth();
  const callService = new CallService();
  const location = useLocation();
  const { chats, loading, error } = useChatList(currentUser);
  useNotifications();

  useEffect(() => {
    const state = location.state as { selectedChat?: ChatPreview; openChat?: boolean };
    if (state?.selectedChat && state?.openChat) {
      setSelectedChat(state.selectedChat);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleDeleteChat = async (chatId: string) => {
    if (!currentUser) return;

    try {
      const batch = writeBatch(db);

      // Delete messages
      const messagesRef = collection(db, `chats/${chatId}/messages`);
      const messagesSnapshot = await getDocs(messagesRef);
      messagesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete chat document
      const chatRef = doc(db, 'chats', chatId);
      batch.delete(chatRef);

      // Delete chat metadata from participants
      const chatDoc = await getDoc(chatRef);
      if (chatDoc.exists()) {
        const participants = chatDoc.data().participants;
        participants.forEach((participantId: string) => {
          const metadataRef = doc(db, 'users', participantId, 'chats', chatId);
          batch.delete(metadataRef);
        });
      }
      
      await batch.commit();

      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
      throw new Error('Errore durante l\'eliminazione della chat');
    }
  };

  const handleStartCall = (chatId: string, isVideo: boolean) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat?.status === 'online') {
      callService.startCall(chatId, isVideo).catch(err => {
        console.error('Error starting call:', err);
      });
    }
  };

  if (selectedChat) {
    return (
      <ChatView
        chat={selectedChat}
        onClose={() => setSelectedChat(null)}
      />
    );
  }

  return (
    <div className="min-h-screen theme-bg">
      <Header />
      <ChatContainer
        chats={chats}
        loading={loading}
        error={error}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onSelectChat={setSelectedChat}
        onDeleteChat={handleDeleteChat}
        onStartCall={handleStartCall}
      />
    </div>
  );
}