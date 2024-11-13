import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { ChatPreview } from '../components/chat/types';
import { User } from 'firebase/auth';

export function useChatList(currentUser: User | null) {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    try {
      const chatsQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', currentUser.uid),
        where('isVisible', '==', true)
      );

      const unsubscribe = onSnapshot(chatsQuery, {
        next: async (snapshot) => {
          try {
            const chatsList: ChatPreview[] = [];
            
            for (const chatDoc of snapshot.docs) {
              const data = chatDoc.data();
              
              if (data.isGroup) {
                chatsList.push({
                  id: chatDoc.id,
                  name: data.name,
                  lastMessage: data.lastMessage || '',
                  timestamp: data.lastMessageTime?.toDate() || 'Nuovo',
                  unread: data.unreadCount?.[currentUser.uid] || 0,
                  photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`,
                  isGroup: true,
                  participants: data.participants
                });
              } else {
                const otherParticipantId = data.participants.find((id: string) => id !== currentUser.uid);
                
                if (otherParticipantId) {
                  const userRef = doc(db, 'users', otherParticipantId);
                  const userSnap = await getDoc(userRef);
                  const userData = userSnap.data();
                  
                  if (userData) {
                    chatsList.push({
                      id: chatDoc.id,
                      name: userData.displayName || 'Utente',
                      lastMessage: data.lastMessage || '',
                      timestamp: data.lastMessageTime?.toDate() || 'Nuovo',
                      unread: data.unreadCount?.[currentUser.uid] || 0,
                      photoURL: userData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName || 'U')}&background=random`,
                      status: userData.status || 'offline',
                      lastSeen: userData.lastSeen?.toDate(),
                      isAnonymous: userData.isAnonymous || false,
                      isGroup: false
                    });
                  }
                }
              }
            }

            chatsList.sort((a, b) => {
              if (a.timestamp === 'Nuovo') return -1;
              if (b.timestamp === 'Nuovo') return 1;
              if (typeof a.timestamp === 'string' || typeof b.timestamp === 'string') return 0;
              return b.timestamp.getTime() - a.timestamp.getTime();
            });

            setChats(chatsList);
            setError(null);
          } catch (err) {
            console.error('Error processing chats:', err);
            setError('Errore nel caricamento delle chat');
          } finally {
            setLoading(false);
          }
        },
        error: (err) => {
          console.error('Error in chat subscription:', err);
          setError('Errore nella sincronizzazione delle chat');
          setLoading(false);
        }
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up chat listener:', err);
      setError('Errore nel caricamento delle chat');
      setLoading(false);
    }
  }, [currentUser]);

  return { chats, loading, error };
}