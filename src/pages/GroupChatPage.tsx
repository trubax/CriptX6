import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Check, X } from 'lucide-react';
import Header from '../components/chat/Header';
import { useContacts } from '../hooks/useContacts';
import { useOnlineUsers } from '../hooks/useOnlineUsers';
import { useCreateGroupChat } from '../hooks/useCreateGroupChat';
import { Contact } from '../services/ContactsService';
import { OnlineUser } from '../hooks/useOnlineUsers';

export default function GroupChatPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<(Contact | OnlineUser)[]>([]);
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { contacts, loading: loadingContacts } = useContacts();
  const { onlineUsers, loading: loadingUsers } = useOnlineUsers(false);
  const { createGroupChat } = useCreateGroupChat();
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    setSearchQuery(query.toLowerCase());
  };

  const toggleParticipant = (participant: Contact | OnlineUser) => {
    setSelectedParticipants(prev => {
      const isSelected = prev.some(p => 
        'uid' in p ? p.uid === participant.uid : p.id === participant.id
      );
      
      if (isSelected) {
        return prev.filter(p => 
          'uid' in p ? p.uid !== participant.uid : p.id !== participant.id
        );
      } else {
        return [...prev, participant];
      }
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Inserisci un nome per il gruppo');
      return;
    }

    if (selectedParticipants.length < 2) {
      setError('Seleziona almeno 2 partecipanti');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      
      const participantIds = selectedParticipants.map(p => 
        'uid' in p ? p.uid : p.userId
      );

      const chatPreview = await createGroupChat(groupName.trim(), participantIds);
      navigate('/chat', { state: { selectedChat: chatPreview, openChat: true } });
    } catch (error: any) {
      console.error('Error creating group:', error);
      setError(error.message || 'Errore durante la creazione del gruppo');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery) ||
    contact.phoneNumber.includes(searchQuery)
  );

  const filteredUsers = onlineUsers.filter(user =>
    user.displayName.toLowerCase().includes(searchQuery)
  );

  return (
    <div className="min-h-screen theme-bg">
      <Header />
      
      <div className="pt-16 px-4 pb-20">
        <div className="sticky top-16 z-10 py-2 theme-bg space-y-4">
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 theme-text" />
            <h2 className="text-xl font-semibold theme-text">
              Crea gruppo
            </h2>
          </div>

          <input
            type="text"
            placeholder="Nome del gruppo"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg theme-bg-secondary theme-text focus:outline-none focus:ring-2 focus:ring-accent"
          />

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 theme-text opacity-70" />
            <input
              type="text"
              placeholder="Cerca contatti..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg theme-bg-secondary theme-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {selectedParticipants.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedParticipants.map((participant) => (
                <div
                  key={'uid' in participant ? participant.uid : participant.id}
                  className="flex items-center gap-2 px-3 py-1 rounded-full theme-bg-accent theme-text text-sm"
                >
                  <span>{'displayName' in participant ? participant.displayName : participant.name}</span>
                  <button
                    onClick={() => toggleParticipant(participant)}
                    className="p-0.5 hover:bg-black/20 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-sm font-medium theme-text opacity-70 mb-2">Contatti</h3>
            <div className="space-y-2">
              {loadingContacts ? (
                <div className="text-center py-4 theme-text opacity-70">
                  Caricamento contatti...
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-4 theme-text opacity-70">
                  Nessun contatto trovato
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => toggleParticipant(contact)}
                    className="flex items-center justify-between p-4 rounded-lg theme-bg-primary hover:theme-bg-secondary cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={contact.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=random`}
                          alt={contact.name}
                          className="w-10 h-10 rounded-full"
                        />
                        {contact.status === 'online' && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 theme-bg-primary bg-green-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium theme-text">{contact.name}</h4>
                        <p className="text-sm theme-text opacity-70">{contact.phoneNumber}</p>
                      </div>
                    </div>
                    {selectedParticipants.some(p => 'id' in p && p.id === contact.id) && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium theme-text opacity-70 mb-2">Utenti online</h3>
            <div className="space-y-2">
              {loadingUsers ? (
                <div className="text-center py-4 theme-text opacity-70">
                  Caricamento utenti...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-4 theme-text opacity-70">
                  Nessun utente trovato
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.uid}
                    onClick={() => toggleParticipant(user)}
                    className="flex items-center justify-between p-4 rounded-lg theme-bg-primary hover:theme-bg-secondary cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={user.photoURL}
                          alt={user.displayName}
                          className="w-10 h-10 rounded-full"
                        />
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 theme-bg-primary bg-green-500" />
                      </div>
                      <div>
                        <h4 className="font-medium theme-text">{user.displayName}</h4>
                        <p className="text-sm theme-text opacity-70">Online</p>
                      </div>
                    </div>
                    {selectedParticipants.some(p => 'uid' in p && p.uid === user.uid) && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="fixed bottom-20 left-4 right-4">
          <button
            onClick={handleCreateGroup}
            disabled={isCreating || selectedParticipants.length < 2 || !groupName.trim()}
            className="w-full py-3 rounded-lg theme-bg-accent theme-text font-medium disabled:opacity-50 transition-opacity"
          >
            {isCreating ? 'Creazione gruppo...' : 'Crea gruppo'}
          </button>
        </div>
      </div>
    </div>
  );
}