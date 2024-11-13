import { db, storage } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  DocumentReference 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { ChatType, Message } from '../types/chat';
import { User } from 'firebase/auth';

export class ChatService {
  private static instance: ChatService;

  private constructor() {}

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  async createIndividualChat(currentUser: User, recipientId: string): Promise<string> {
    try {
      // Verifica chat esistente
      const existingChat = await this.findExistingIndividualChat(currentUser.uid, recipientId);
      if (existingChat) {
        return existingChat.id;
      }

      // Crea nuova chat
      const chatRef = await addDoc(collection(db, 'chats'), {
        type: 'individual',
        participants: [currentUser.uid, recipientId],
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: '',
        lastMessageTime: null,
        unreadCount: {
          [currentUser.uid]: 0,
          [recipientId]: 0
        },
        isVisible: false
      });

      return chatRef.id;
    } catch (error) {
      console.error('Error creating individual chat:', error);
      throw new Error('Errore nella creazione della chat');
    }
  }

  async createGroupChat(
    currentUser: User, 
    name: string, 
    participants: string[], 
    photoURL?: string,
    description?: string
  ): Promise<string> {
    try {
      const chatRef = await addDoc(collection(db, 'chats'), {
        type: 'group',
        name,
        participants: [currentUser.uid, ...participants],
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: '',
        lastMessageTime: null,
        unreadCount: Object.fromEntries(
          [currentUser.uid, ...participants].map(id => [id, 0])
        ),
        isVisible: true,
        photoURL,
        description
      });

      // Messaggio di sistema per la creazione del gruppo
      await addDoc(collection(db, `chats/${chatRef.id}/messages`), {
        text: `${currentUser.displayName} ha creato il gruppo`,
        senderId: 'system',
        senderName: 'Sistema',
        timestamp: serverTimestamp()
      });

      return chatRef.id;
    } catch (error) {
      console.error('Error creating group chat:', error);
      throw new Error('Errore nella creazione del gruppo');
    }
  }

  private async findExistingIndividualChat(userId: string, recipientId: string): Promise<ChatType | null> {
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

      return chat ? { id: chat.id, ...chat.data() as ChatType } : null;
    } catch (error) {
      console.error('Error finding existing chat:', error);
      return null;
    }
  }

  async sendMessage(
    chatId: string,
    senderId: string,
    senderName: string,
    text: string,
    file?: File
  ): Promise<DocumentReference> {
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);

      if (!chatDoc.exists()) {
        throw new Error('Chat non trovata');
      }

      const messageData: Partial<Message> = {
        text: text.trim(),
        senderId,
        senderName,
        timestamp: serverTimestamp()
      };

      if (file) {
        const fileRef = ref(storage, `chats/${chatId}/${Date.now()}_${file.name}`);
        const metadata = {
          customMetadata: {
            userId: senderId,
            chatId: chatId
          }
        };

        await uploadBytes(fileRef, file, metadata);
        const downloadUrl = await getDownloadURL(fileRef);

        messageData.mediaUrl = downloadUrl;
        messageData.fileName = file.name;
        messageData.mediaType = file.type.startsWith('image/')
          ? 'photo'
          : file.type.startsWith('video/')
          ? 'video'
          : file.type.startsWith('audio/')
          ? 'audio'
          : 'document';
      }

      const messageRef = await addDoc(collection(db, `chats/${chatId}/messages`), messageData);

      // Aggiorna metadata della chat
      const chatData = chatDoc.data() as ChatType;
      const unreadCount = { ...chatData.unreadCount };
      chatData.participants.forEach(participantId => {
        if (participantId !== senderId) {
          unreadCount[participantId] = (unreadCount[participantId] || 0) + 1;
        }
      });

      await updateDoc(chatRef, {
        lastMessage: text.trim(),
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
        unreadCount,
        isVisible: true
      });

      return messageRef;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Errore nell\'invio del messaggio');
    }
  }

  async deleteMessage(chatId: string, messageId: string, userId: string, deleteForEveryone: boolean): Promise<void> {
    try {
      const messageRef = doc(db, `chats/${chatId}/messages`, messageId);
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) {
        throw new Error('Messaggio non trovato');
      }

      const messageData = messageDoc.data() as Message;

      if (deleteForEveryone && messageData.senderId !== userId) {
        throw new Error('Non hai i permessi per eliminare questo messaggio');
      }

      if (messageData.mediaUrl) {
        try {
          const fileRef = ref(storage, messageData.mediaUrl);
          await deleteObject(fileRef);
        } catch (error) {
          console.error('Error deleting media file:', error);
        }
      }

      if (deleteForEveryone) {
        await deleteDoc(messageRef);
      } else {
        const deletedFor = messageData.deletedFor || {};
        deletedFor[userId] = true;
        await updateDoc(messageRef, { deletedFor });
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      throw new Error('Errore durante l\'eliminazione del messaggio');
    }
  }

  async markAsRead(chatId: string, userId: string): Promise<void> {
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (chatDoc.exists()) {
        const unreadCount = chatDoc.data().unreadCount || {};
        unreadCount[userId] = 0;
        
        await updateDoc(chatRef, { unreadCount });
      }
    } catch (error) {
      console.error('Error marking as read:', error);
      throw new Error('Errore durante la lettura dei messaggi');
    }
  }
}

export const chatService = ChatService.getInstance();