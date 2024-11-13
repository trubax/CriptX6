import React, { useState } from 'react';
import { Search, MessageCircle, Phone, Video, AlertCircle, UserCircle2, UserPlus, Users, User } from 'lucide-react';
import Header from './chat/Header';
import { useOnlineUsers, OnlineUser } from '../hooks/useOnlineUsers';
import { useNavigate } from 'react-router-dom';
import { contactsService } from '../services/ContactsService';
import { useAuth } from '../contexts/AuthContext';
import StartChatModal from './chat/StartChatModal';

type UserFilter = 'all' | 'registered' | 'anonymous';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="theme-bg-primary rounded-lg max-w-md w-full p-6 space-y-4">
        <h3 className="text-lg font-semibold theme-text">{title}</h3>
        <p className="theme-text opacity-80">{message}</p>
        <div className="flex space-x-3">
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-lg theme-bg-accent theme-text hover:opacity-90 transition-colors"
          >
            Aggiorna
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg theme-bg-secondary theme-text hover:opacity-90 transition-colors"
          >
            Mantieni esistente
          </button>
        </div>
      </div>
    </div>
  );
}

// Aggiungiamo un'interfaccia per i conteggi
interface FilterCounts {
  all: number;
  registered: number;
  anonymous: number;
}

export default function RegularUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { onlineUsers: regularUsers, loading: loadingRegular } = useOnlineUsers(false);
  const { onlineUsers: anonymousUsers, loading: loadingAnonymous } = useOnlineUsers(true);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [userFilter, setUserFilter] = useState<UserFilter>('all');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    user?: OnlineUser;
    existingContact?: any;
  }>({ isOpen: false });
  const [selectedUser, setSelectedUser] = useState<OnlineUser | null>(null);

  const allUsers = [...regularUsers, ...anonymousUsers].sort((a, b) => {
    if (a.status === 'online' && b.status !== 'online') return -1;
    if (a.status !== 'online' && b.status === 'online') return 1;
    if (!a.isAnonymous && b.isAnonymous) return -1;
    if (a.isAnonymous && !b.isAnonymous) return 1;
    return a.displayName.localeCompare(b.displayName);
  });

  const filteredUsers = allUsers
    .filter(user => {
      if (userFilter === 'registered') return !user.isAnonymous;
      if (userFilter === 'anonymous') return user.isAnonymous;
      return true;
    })
    .filter(user =>
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleStartChat = async (user: OnlineUser) => {
    try {
      setError(null);
      setSuccessMessage(null);
      setSelectedUser(user);
    } catch (error: any) {
      console.error('Error starting chat:', error);
      setError(error.message || 'Errore nell\'avvio della chat. Verifica la tua connessione e riprova.');
    }
  };

  const handleCall = async (userId: string, isVideo: boolean) => {
    try {
      setError(null);
      setSuccessMessage(null);
      // Call handling logic here
    } catch (error: any) {
      console.error('Error starting call:', error);
      setError(error.message || 'Errore nell\'avvio della chiamata. Verifica la tua connessione e riprova.');
    }
  };

  const handleAddContact = async (user: OnlineUser) => {
    try {
      setError(null);
      setSuccessMessage(null);

      if (!user.phoneNumber && !user.email) {
        setError('Impossibile aggiungere il contatto: informazioni di contatto mancanti');
        return;
      }

      const contactData = {
        name: user.displayName,
        phoneNumber: user.phoneNumber || '',
        email: user.email || '',
        photoURL: user.photoURL,
        userId: user.uid,
        isRegistered: !user.isAnonymous,
        status: user.status,
        lastSeen: user.lastSeen
      };

      const existingContact = await contactsService.findContactByPhoneOrEmail(
        currentUser,
        user.phoneNumber || '',
        user.email || ''
      );

      if (existingContact) {
        setConfirmDialog({
          isOpen: true,
          user,
          existingContact
        });
        return;
      }

      await contactsService.addContact(currentUser, contactData);
      setSuccessMessage(`${user.displayName} aggiunto alla rubrica`);

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error adding contact:', error);
      setError(error.message || 'Errore durante l\'aggiunta del contatto');
    }
  };

  const handleUpdateContact = async () => {
    if (!confirmDialog.user) return;

    try {
      const contactData = {
        name: confirmDialog.user.displayName,
        phoneNumber: confirmDialog.user.phoneNumber || '',
        email: confirmDialog.user.email || '',
        photoURL: confirmDialog.user.photoURL,
        userId: confirmDialog.user.uid,
        isRegistered: !confirmDialog.user.isAnonymous,
        status: confirmDialog.user.status,
        lastSeen: confirmDialog.user.lastSeen
      };

      await contactsService.updateContact(
        currentUser,
        confirmDialog.existingContact.id,
        contactData
      );

      setSuccessMessage(`${confirmDialog.user.displayName} aggiornato nella rubrica`);
      setConfirmDialog({ isOpen: false });

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error updating contact:', error);
      setError(error.message || 'Errore durante l\'aggiornamento del contatto');
      setConfirmDialog({ isOpen: false });
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  // Calcoliamo i conteggi per ogni filtro
  const counts: FilterCounts = {
    all: allUsers.length,
    registered: allUsers.filter(user => !user.isAnonymous).length,
    anonymous: allUsers.filter(user => user.isAnonymous).length
  };

  return (
    <div className="min-h-screen theme-bg">
      <Header />
      
      <div className="pt-16 px-2 sm:px-4 pb-20">
        <div className="sticky top-16 z-10 py-2 theme-bg space-y-2">
          <div className="relative px-2 sm:px-0">
            <Search className="absolute left-5 sm:left-3 top-2.5 h-5 w-5 theme-text opacity-70" />
            <input
              type="text"
              placeholder="Cerca utenti..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg theme-bg-secondary theme-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="flex gap-1 sm:gap-2 px-2 sm:px-0 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => {
                setUserFilter('all');
                clearMessages();
              }}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap flex-1 
                ${userFilter === 'all'
                  ? 'theme-bg-accent theme-text'
                  : 'theme-bg-secondary theme-text opacity-70 hover:opacity-100'
                }`}
            >
              <Users className="w-4 h-4 flex-shrink-0" />
              <span>Tutti</span>
              <span className="text-xs opacity-70 ml-1">({counts.all})</span>
            </button>

            <button
              onClick={() => {
                setUserFilter('registered');
                clearMessages();
              }}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap flex-1
                ${userFilter === 'registered'
                  ? 'theme-bg-accent theme-text'
                  : 'theme-bg-secondary theme-text opacity-70 hover:opacity-100'
                }`}
            >
              <User className="w-4 h-4 flex-shrink-0" />
              <span>Registrati</span>
              <span className="text-xs opacity-70 ml-1">({counts.registered})</span>
            </button>

            <button
              onClick={() => {
                setUserFilter('anonymous');
                clearMessages();
              }}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap flex-1
                ${userFilter === 'anonymous'
                  ? 'theme-bg-accent theme-text'
                  : 'theme-bg-secondary theme-text opacity-70 hover:opacity-100'
                }`}
            >
              <UserCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Anonimi</span>
              <span className="text-xs opacity-70 ml-1">({counts.anonymous})</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-500">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2 text-green-500">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{successMessage}</p>
          </div>
        )}

        <div className="mt-4 space-y-2">
          {(loadingRegular || loadingAnonymous) ? (
            <div className="text-center py-4 theme-text">
              Caricamento...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-4 theme-text opacity-70">
              Nessun utente trovato
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.uid}
                className="flex items-center justify-between p-4 rounded-lg theme-bg-primary hover:theme-bg-secondary transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-12 h-12 rounded-full"
                    />
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 theme-bg-primary ${
                      user.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium theme-text">
                        {user.displayName}
                      </h3>
                      {user.isAnonymous ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          Guest
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                          Registrato
                        </span>
                      )}
                    </div>
                    <p className="text-sm theme-text opacity-70">
                      {user.status === 'online' ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!user.isAnonymous && (
                    <button
                      onClick={() => handleAddContact(user)}
                      className="p-2 rounded-full hover:theme-bg-secondary text-green-500"
                      title="Aggiungi ai contatti"
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleCall(user.uid, false)}
                    disabled={user.status !== 'online'}
                    className="p-2 rounded-full hover:theme-bg-secondary text-green-500 disabled:opacity-50"
                    title="Chiama"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleCall(user.uid, true)}
                    disabled={user.status !== 'online'}
                    className="p-2 rounded-full hover:theme-bg-secondary text-blue-500 disabled:opacity-50"
                    title="Videochiama"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleStartChat(user)}
                    className="p-2 rounded-full hover:theme-bg-secondary theme-accent"
                    title="Messaggia"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Contatto esistente"
        message={`${confirmDialog.user?.displayName} è già presente nella tua rubrica. Vuoi aggiornare le informazioni del contatto?`}
        onConfirm={handleUpdateContact}
        onCancel={() => setConfirmDialog({ isOpen: false })}
      />

      {selectedUser && (
        <StartChatModal
          recipientId={selectedUser.uid}
          recipientName={selectedUser.displayName}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}