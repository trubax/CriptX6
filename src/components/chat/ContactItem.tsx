import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Video, MessageCircle, Share2, MoreVertical } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { it } from 'date-fns/locale';
import { Contact } from '../../services/ContactsService';
import { useCreateChat } from '../../hooks/useCreateChat';
import { useAuth } from '../../contexts/AuthContext';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../../firebase';
import ContactActions from './ContactActions';

interface ContactItemProps {
  contact: Contact;
  onStartChat: (contactId: string) => void;
  onStartCall: (contactId: string, isVideo: boolean) => void;
  onShare: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
  onBlock: (contactId: string) => void;
  onUnblock: (contactId: string) => void;
}

export default function ContactItem({
  contact,
  onStartChat,
  onStartCall,
  onShare,
  onEdit,
  onDelete,
  onBlock,
  onUnblock
}: ContactItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { createChat } = useCreateChat();

  const formatLastSeen = (date: Date | undefined) => {
    if (!date || !isValid(date)) return 'Mai';
    return format(date, 'dd/MM/yyyy HH:mm', { locale: it });
  };

  const findExistingChat = async (userId: string) => {
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', currentUser?.uid)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.find(doc => 
      doc.data().participants.includes(userId)
    );
  };

  const handleStartChat = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!contact.isRegistered) {
      onShare(contact);
      return;
    }

    if (contact.isBlocked) {
      setError('Impossibile avviare una chat con un contatto bloccato');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      // Se il contatto ha già un userId (salvato dalla lista utenti online)
      if (contact.userId) {
        const existingChat = await findExistingChat(contact.userId);
        
        if (existingChat) {
          const chatData = existingChat.data();
          navigate('/chat', {
            state: {
              selectedChat: {
                id: existingChat.id,
                name: contact.name,
                photoURL: contact.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=random`,
                lastMessage: chatData.lastMessage || '',
                timestamp: chatData.lastMessageTime?.toDate() || 'Nuovo',
                unread: chatData.unreadCount?.[currentUser?.uid] || 0,
                status: contact.status,
                lastSeen: contact.lastSeen,
                isAnonymous: false
              },
              openChat: true
            }
          });
        } else {
          const chatPreview = await createChat(contact.userId);
          if (chatPreview) {
            navigate('/chat', { 
              state: { 
                selectedChat: chatPreview, 
                openChat: true 
              }
            });
          }
        }
      } else {
        // Cerca l'utente tramite telefono o email
        const usersRef = collection(db, 'users');
        let userQuery;
        
        if (contact.phoneNumber) {
          userQuery = query(usersRef, where('phoneNumber', '==', contact.phoneNumber));
        } else if (contact.email) {
          userQuery = query(usersRef, where('email', '==', contact.email));
        } else {
          throw new Error('Informazioni di contatto mancanti');
        }

        const userSnapshot = await getDocs(userQuery);
        
        if (userSnapshot.empty) {
          throw new Error('Utente non trovato su CriptX');
        }

        const userData = userSnapshot.docs[0];
        const userId = userData.id;

        // Aggiorna il contatto con le informazioni dell'utente
        const contactRef = doc(db, `users/${currentUser?.uid}/contacts/${contact.id}`);
        await updateDoc(contactRef, {
          userId,
          isRegistered: true,
          status: userData.data().status || 'offline',
          lastSeen: userData.data().lastSeen || null,
          photoURL: userData.data().photoURL || contact.photoURL
        });

        const chatPreview = await createChat(userId);
        if (chatPreview) {
          navigate('/chat', { 
            state: { 
              selectedChat: chatPreview, 
              openChat: true 
            }
          });
        }
      }
    } catch (error: any) {
      console.error('Error starting chat:', error);
      setError(error.message || 'Errore nell\'avvio della chat');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCall = (e: React.MouseEvent, isVideo: boolean) => {
    e.stopPropagation();
    if (!contact.isRegistered) {
      setError('Impossibile chiamare un contatto non registrato');
      return;
    }
    onStartCall(contact.id, isVideo);
  };

  const handleToggleActions = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(!showActions);
  };

  return (
    <div className="relative flex items-center p-4 hover:theme-bg-secondary cursor-pointer transition-colors">
      <div className="relative flex-shrink-0">
        {contact.photoURL ? (
          <img
            src={contact.photoURL}
            alt={contact.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full flex items-center justify-center theme-bg-secondary flex-shrink-0">
            <span className="text-xl font-medium theme-text">
              {contact.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {contact.isRegistered && (
          <span 
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 theme-bg-primary ${
              contact.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
            }`} 
          />
        )}
      </div>

      <div className="ml-4 flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="font-medium theme-text truncate">
              {contact.name}
              {contact.isBlocked && (
                <span className="ml-2 text-sm text-red-500">(Bloccato)</span>
              )}
            </h3>
            <div className="flex items-center space-x-2">
              <p className="text-sm theme-text opacity-70 truncate">
                {contact.phoneNumber}
                {contact.email && ` • ${contact.email}`}
              </p>
              {contact.isRegistered ? (
                <span className="hidden md:inline-flex text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                  {contact.status === 'online' ? 'Online' : `Ultimo accesso: ${formatLastSeen(contact.lastSeen)}`}
                </span>
              ) : (
                <span className="hidden md:inline-flex text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
                  Non registrato
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {contact.isRegistered && (
              <>
                <button
                  onClick={(e) => handleStartCall(e, false)}
                  className="p-2 rounded-full hover:theme-bg-secondary text-green-500 transition-colors"
                  disabled={contact.status !== 'online' || contact.isBlocked}
                >
                  <Phone className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => handleStartCall(e, true)}
                  className="p-2 rounded-full hover:theme-bg-secondary text-blue-500 transition-colors"
                  disabled={contact.status !== 'online' || contact.isBlocked}
                >
                  <Video className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              onClick={handleStartChat}
              className="p-2 rounded-full hover:theme-bg-secondary theme-accent transition-colors"
              disabled={contact.isBlocked}
            >
              {contact.isRegistered ? (
                <MessageCircle className="w-5 h-5" />
              ) : (
                <Share2 className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={handleToggleActions}
              className="p-2 rounded-full hover:theme-bg-secondary theme-text transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}
      </div>

      <ContactActions
        contact={contact}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleBlock={contact.isBlocked ? onUnblock : onBlock}
        isOpen={showActions}
        onClose={() => setShowActions(false)}
        onShare={onShare}
      />
    </div>
  );
}