import React, { useState } from 'react';
import { Search, MessageCircle } from 'lucide-react';
import Header from './chat/Header';
import { useOnlineUsers } from '../hooks/useOnlineUsers';
import { useCreateChat } from '../hooks/useCreateChat';
import { useNavigate } from 'react-router-dom';

export default function AnonymousContacts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { onlineUsers, loading } = useOnlineUsers(true);
  const { createChat, loading: creatingChat } = useCreateChat();
  const navigate = useNavigate();

  const filteredUsers = onlineUsers.filter(user =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartChat = async (userId: string) => {
    try {
      setError(null);
      const chatPreview = await createChat(userId);
      if (chatPreview) {
        navigate('/chat', { state: { selectedChat: chatPreview, openChat: true } });
      }
    } catch (error: any) {
      console.error('Error starting chat:', error);
      setError(error.message || 'Errore nell\'avvio della chat. Verifica la tua connessione e riprova.');
    }
  };

  return (
    <div className="min-h-screen theme-bg">
      <Header />
      
      <div className="pt-16 px-4">
        <div className="sticky top-16 z-10 py-2 theme-bg">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 theme-text opacity-70" />
            <input
              type="text"
              placeholder="Cerca utenti anonimi online..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg theme-bg-secondary theme-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-500">
            <p>{error}</p>
          </div>
        )}

        <div className="mt-4 space-y-2">
          {loading || creatingChat ? (
            <div className="text-center py-4 theme-text">
              {creatingChat ? 'Creazione chat...' : 'Caricamento...'}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-4 theme-text opacity-70">
              Nessun utente anonimo online trovato
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.uid}
                className="flex items-center justify-between p-4 rounded-lg theme-bg-primary cursor-pointer hover:theme-bg-secondary transition-colors"
                onClick={() => handleStartChat(user.uid)}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-12 h-12 rounded-full"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 theme-bg-primary bg-green-500" />
                  </div>
                  <div>
                    <h3 className="font-medium theme-text">
                      {user.displayName}
                    </h3>
                    <p className="text-sm theme-text opacity-70">
                      Guest Online
                    </p>
                  </div>
                </div>
                <MessageCircle className="w-5 h-5 theme-accent" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}