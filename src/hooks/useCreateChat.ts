import { useState } from 'react';
import { collection, addDoc, serverTimestamp, getDoc, doc, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { ChatPreview } from '../components/chat/types';

export function useCreateChat() {
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const createChatWithMessage = async (recipientId: string, message: string): Promise<ChatPreview> => {
    if (!currentUser) throw new Error('Devi effettuare l\'accesso per creare una chat');
    if (!message.trim()) throw new Error('Inserisci un messaggio per iniziare la chat');
    
    try {
      setLoading(true);
      const batch = writeBatch(db);

      // Check for existing chat
      const existingChat = await findExistingChat(currentUser.uid, recipientId);
      if (existingChat) {
        const chatRef = doc(db, 'chats', existingChat.id);
        const messagesRef = collection(chatRef, 'messages');
        
        // Add first message
        const messageRef = doc(collection(db, `chats/${existingChat.id}/messages`));
        batch.set(messageRef, {
          text: message.trim(),
          senderId: currentUser.uid,
          senderName: currentUser.displayName,
          timestamp: serverTimestamp(),
          readBy: [],
          deliveredTo: [currentUser.uid],
          readTimestamps: {}
        });

        // Update chat metadata
        batch.update(chatRef, {
          lastMessage: message.trim(),
          lastMessageTime: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isVisible: true,
          [`unreadCount.${recipientId}`]: 1
        });

        await batch.commit();
        return existingChat;
      }

      // Get recipient details
      const recipientRef = doc(db, 'users', recipientId);
      const recipientDoc = await getDoc(recipientRef);
      
      if (!recipientDoc.exists()) {
        throw new Error('Utente non trovato');
      }

      const recipientData = recipientDoc.data();

      // Create new chat with first message
      const chatRef = doc(collection(db, 'chats'));
      batch.set(chatRef, {
        type: 'individual',
        participants: [currentUser.uid, recipientId],
        participantsData: {
          [currentUser.uid]: {
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            isAnonymous: currentUser.isAnonymous
          },
          [recipientId]: {
            displayName: recipientData.displayName,
            photoURL: recipientData.photoURL,
            isAnonymous: recipientData.isAnonymous
          }
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: message.trim(),
        lastMessageTime: serverTimestamp(),
        unreadCount: {
          [currentUser.uid]: 0,
          [recipientId]: 1
        },
        isVisible: true,
        isGroup: false
      });

      // Add first message
      const messageRef = doc(collection(db, `chats/${chatRef.id}/messages`));
      batch.set(messageRef, {
        text: message.trim(),
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        timestamp: serverTimestamp(),
        readBy: [],
        deliveredTo: [currentUser.uid],
        readTimestamps: {}
      });

      await batch.commit();

      return {
        id: chatRef.id,
        name: recipientData.displayName,
        photoURL: recipientData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(recipientData.displayName)}&background=random`,
        lastMessage: message.trim(),
        timestamp: 'Nuovo',
        unread: 0,
        status: recipientData.status || 'offline',
        lastSeen: recipientData.lastSeen?.toDate(),
        isAnonymous: recipientData.isAnonymous || false,
        isGroup: false
      };
    } catch (error: any) {
      console.error('Error creating chat:', error);
      throw new Error(error.message || 'Errore nella creazione della chat');
    } finally {
      setLoading(false);
    }
  };

  const createGroupWithMessage = async (name: string, participants: string[], message: string): Promise<ChatPreview> => {
    if (!currentUser) throw new Error('Devi effettuare l\'accesso per creare un gruppo');
    if (!message.trim()) throw new Error('Inserisci un messaggio per creare il gruppo');
    if (participants.length < 2) throw new Error('Seleziona almeno 2 partecipanti');
    
    try {
      setLoading(true);
      const batch = writeBatch(db);

      // Create group chat with first message
      const chatRef = doc(collection(db, 'chats'));
      const allParticipants = [currentUser.uid, ...participants];

      batch.set(chatRef, {
        type: 'group',
        name,
        participants: allParticipants,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: message.trim(),
        lastMessageTime: serverTimestamp(),
        unreadCount: Object.fromEntries(
          allParticipants.map(id => [id, id === currentUser.uid ? 0 : 1])
        ),
        isVisible: true,
        isGroup: true,
        groupAdmins: [currentUser.uid]
      });

      // Add first message
      const messageRef = doc(collection(db, `chats/${chatRef.id}/messages`));
      batch.set(messageRef, {
        text: message.trim(),
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        timestamp: serverTimestamp(),
        readBy: [],
        deliveredTo: [currentUser.uid],
        readTimestamps: {}
      });

      await batch.commit();

      return {
        id: chatRef.id,
        name,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        lastMessage: message.trim(),
        timestamp: 'Nuovo',
        unread: 0,
        isGroup: true,
        participants: allParticipants
      };
    } catch (error: any) {
      console.error('Error creating group:', error);
      throw new Error(error.message || 'Errore nella creazione del gruppo');
    } finally {
      setLoading(false);
    }
  };

  const findExistingChat = async (userId: string, recipientId: string) => {
    try {
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('type', '==', 'individual'),
        where('participants', 'array-contains', userId)
      );
      
      const snapshot = await getDocs(q);
      const chat = snapshot.docs.find(doc => {
        const data = doc.data();
        return data.participants.includes(recipientId);
      });

      if (!chat) return null;

      const recipientData = await getDoc(doc(db, 'users', recipientId));
      const userData = recipientData.data();

      return {
        id: chat.id,
        name: userData?.displayName || 'Utente',
        photoURL: userData?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.displayName || 'U')}&background=random`,
        lastMessage: chat.data().lastMessage || '',
        timestamp: chat.data().lastMessageTime?.toDate() || 'Nuovo',
        unread: chat.data().unreadCount?.[userId] || 0,
        status: userData?.status || 'offline',
        lastSeen: userData?.lastSeen?.toDate(),
        isAnonymous: userData?.isAnonymous || false,
        isGroup: false
      };
    } catch (error) {
      console.error('Error finding existing chat:', error);
      return null;
    }
  };

  return { createChatWithMessage, createGroupWithMessage, loading };
}