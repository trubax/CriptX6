import { useState } from 'react';
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { ChatPreview } from '../components/chat/types';
import { v4 as uuidv4 } from 'uuid';

export function useCreateGroupChat() {
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const createGroupChat = async (name: string, participantIds: string[]): Promise<ChatPreview> => {
    if (!currentUser) throw new Error('Devi effettuare l\'accesso per creare un gruppo');
    if (participantIds.length < 2) throw new Error('Seleziona almeno 2 partecipanti');
    
    try {
      setLoading(true);

      // Generate a unique group ID with a prefix
      const groupId = `group_${uuidv4()}`;

      // Add current user to participants if not already included
      const allParticipants = [currentUser.uid, ...participantIds.filter(id => id !== currentUser.uid)];

      // Get participant details
      const participantDetails = await Promise.all(
        allParticipants.map(async (id) => {
          const userDoc = await getDoc(doc(db, 'users', id));
          return {
            id,
            ...userDoc.data()
          };
        })
      );

      // Create chat document with the custom group ID
      await addDoc(collection(db, 'chats'), {
        id: groupId, // Store the custom group ID
        name,
        isGroup: true,
        participants: allParticipants,
        participantsData: Object.fromEntries(
          participantDetails.map(p => [
            p.id,
            {
              displayName: p.displayName,
              photoURL: p.photoURL,
              isAnonymous: p.isAnonymous
            }
          ])
        ),
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: '',
        lastMessageTime: null,
        unreadCount: Object.fromEntries(
          allParticipants.map(id => [id, 0])
        ),
        isVisible: true
      });

      return {
        id: groupId,
        name,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        lastMessage: '',
        timestamp: 'Nuovo',
        unread: 0,
        isGroup: true,
        participants: allParticipants
      };
    } catch (error: any) {
      console.error('Error creating group chat:', error);
      throw new Error(error.message || 'Errore durante la creazione del gruppo');
    } finally {
      setLoading(false);
    }
  };

  return { createGroupChat, loading };
}