import { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { 
  collection, 
  doc,
  onSnapshot, 
  updateDoc, 
  serverTimestamp,
  query,
  orderBy,
  addDoc,
  where,
  getDoc,
  setDoc,
  getDocs,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import { EncryptionService } from '../services/EncryptionService';
import { NotificationService } from '../services/NotificationService';

interface Message {
  id: string;
  text: string;
  timestamp: any;
  senderId: string;
  senderName?: string;
  isMe: boolean;
  encrypted?: string;
  nonce?: string;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video' | 'audio' | 'document';
  fileName?: string;
  deletedFor?: { [key: string]: boolean };
  readBy?: string[];
  deliveredTo?: string[];
  readTimestamps?: { [key: string]: any };
}

interface ChatOptions {
  isBlocked: boolean;
  messageTimer: number;
  screenshotPrevention: boolean;
  recipientPublicKey?: string;
  unreadCount?: { [key: string]: number };
  isGroupChat?: boolean;
  groupName?: string;
  groupPhoto?: string;
  groupAdmins?: string[];
  groupCreator?: string;
  participants?: string[];
}

export function useChat(chatId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [options, setOptions] = useState<ChatOptions>({
    isBlocked: false,
    messageTimer: 0,
    screenshotPrevention: false,
    unreadCount: {},
    isGroupChat: false,
    participants: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipientStatus, setRecipientStatus] = useState<{
    status: 'online' | 'offline';
    lastSeen?: Date;
  }>({ status: 'offline' });
  const { currentUser } = useAuth();

  const encryptionService = EncryptionService.getInstance();
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    if (!currentUser || !chatId) return;

    const initializeChat = async () => {
      try {
        const chatRef = doc(db, 'chats', chatId);
        const chatDoc = await getDoc(chatRef);

        if (!chatDoc.exists()) {
          await setDoc(chatRef, {
            participants: [currentUser.uid],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastMessage: '',
            lastMessageTime: serverTimestamp(),
            isBlocked: false,
            messageTimer: 0,
            screenshotPrevention: false,
            unreadCount: {
              [currentUser.uid]: 0
            },
            isVisible: false,
            isGroupChat: false
          });
        }

        // Listen for chat options
        const unsubscribeOptions = onSnapshot(chatRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            setOptions({
              isBlocked: data.isBlocked || false,
              messageTimer: data.messageTimer || 0,
              screenshotPrevention: data.screenshotPrevention || false,
              recipientPublicKey: data.recipientPublicKey,
              unreadCount: data.unreadCount || {},
              isGroupChat: data.isGroupChat || false,
              groupName: data.groupName,
              groupPhoto: data.groupPhoto,
              groupAdmins: data.groupAdmins || [],
              groupCreator: data.groupCreator,
              participants: data.participants || []
            });

            // Only set recipient status for individual chats
            if (!data.isGroupChat) {
              const recipientId = data.participants.find((id: string) => id !== currentUser.uid);
              if (recipientId) {
                const recipientRef = doc(db, 'users', recipientId);
                onSnapshot(recipientRef, (userDoc) => {
                  if (userDoc.exists()) {
                    setRecipientStatus({
                      status: userDoc.data()?.status || 'offline',
                      lastSeen: userDoc.data()?.lastSeen?.toDate()
                    });
                  }
                });
              }
            }
          }
          setLoading(false);
        });

        // Listen for messages
        const messagesRef = collection(db, `chats/${chatId}/messages`);
        const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'));

        const unsubscribeMessages = onSnapshot(messagesQuery, async (snapshot) => {
          try {
            const batch = writeBatch(db);
            const decryptedMessages = await Promise.all(
              snapshot.docs.map(async (docSnapshot) => {
                const data = docSnapshot.data();
                let decryptedText = '';
                
                if (data.encrypted && data.nonce && data.senderPublicKey) {
                  try {
                    decryptedText = await encryptionService.decryptMessage(
                      data.encrypted,
                      data.nonce,
                      data.senderPublicKey
                    );
                  } catch (err) {
                    console.error('Error decrypting message:', err);
                    decryptedText = '[Messaggio criptato]';
                  }
                }

                // Show notification for new messages
                const isNewMessage = docSnapshot.metadata.hasPendingWrites;
                if (isNewMessage && data.senderId !== currentUser.uid) {
                  notificationService.showMessageNotification(
                    chatId,
                    data.senderName || 'Nuovo messaggio',
                    decryptedText || data.text
                  );

                  // Update unread count
                  const chatDoc = await getDoc(doc(db, 'chats', chatId));
                  if (chatDoc.exists()) {
                    const unreadCount = chatDoc.data()?.unreadCount || {};
                    batch.update(doc(db, 'chats', chatId), {
                      [`unreadCount.${currentUser.uid}`]: (unreadCount[currentUser.uid] || 0) + 1
                    });
                  }
                }

                // Don't show messages that are deleted for the current user
                if (data.deletedFor?.[currentUser.uid]) {
                  return null;
                }

                // Mark message as delivered for current user if not already delivered
                if (!data.deliveredTo?.includes(currentUser.uid)) {
                  batch.update(docSnapshot.ref, {
                    deliveredTo: [...(data.deliveredTo || []), currentUser.uid]
                  });
                }

                // Handle message timer if message is read
                if (options.messageTimer > 0 && data.readBy?.includes(currentUser.uid)) {
                  const readTimestamp = data.readTimestamps?.[currentUser.uid];
                  if (readTimestamp) {
                    const deleteTime = readTimestamp.toDate().getTime() + (options.messageTimer * 1000);
                    if (Date.now() >= deleteTime) {
                      batch.delete(docSnapshot.ref);
                      return null;
                    }
                  }
                }

                return {
                  id: docSnapshot.id,
                  text: decryptedText || data.text,
                  timestamp: data.timestamp,
                  senderId: data.senderId,
                  senderName: data.senderName,
                  isMe: data.senderId === currentUser.uid,
                  mediaUrl: data.mediaUrl,
                  mediaType: data.mediaType,
                  fileName: data.fileName,
                  deletedFor: data.deletedFor,
                  readBy: data.readBy || [],
                  deliveredTo: data.deliveredTo || [],
                  readTimestamps: data.readTimestamps || {}
                } as Message;
              })
            );

            await batch.commit();
            setMessages(decryptedMessages.filter(Boolean).reverse());
            setError(null);
          } catch (err) {
            console.error('Error processing messages:', err);
            setError('Errore nel processamento dei messaggi');
          }
        });

        return () => {
          unsubscribeOptions();
          unsubscribeMessages();
        };
      } catch (err) {
        console.error('Error initializing chat:', err);
        setError('Errore nell\'inizializzazione della chat');
        setLoading(false);
      }
    };

    initializeChat();
  }, [chatId, currentUser]);

  const sendMessage = async (text: string, file?: File) => {
    if (!currentUser || !text.trim() || options.isBlocked) return;

    try {
      const chatRef = doc(db, 'chats', chatId);
      const messageData: any = {
        text: text.trim(),
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        timestamp: serverTimestamp(),
        readBy: [],
        deliveredTo: [currentUser.uid],
        readTimestamps: {}
      };

      if (file) {
        const fileRef = ref(storage, `chats/${chatId}/${Date.now()}_${file.name}`);
        const metadata = {
          customMetadata: {
            userId: currentUser.uid,
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

      if (options.recipientPublicKey) {
        const { encrypted, nonce } = await encryptionService.encryptMessage(
          text.trim(),
          options.recipientPublicKey
        );
        messageData.encrypted = encrypted;
        messageData.nonce = nonce;
        messageData.senderPublicKey = encryptionService.getPublicKey();
      }

      const batch = writeBatch(db);

      // Add message to subcollection
      const messageRef = doc(collection(db, `chats/${chatId}/messages`));
      batch.set(messageRef, messageData);

      // Update chat metadata
      batch.update(chatRef, {
        lastMessage: text.trim(),
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
        [`unreadCount.${chatId}`]: (options.unreadCount?.[chatId] || 0) + 1,
        isVisible: true
      });

      await batch.commit();
      setError(null);
      return messageRef;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Errore nell\'invio del messaggio');
      throw err;
    }
  };

  const markAsRead = async () => {
    if (!currentUser) return;
    
    try {
      const batch = writeBatch(db);
      const messagesRef = collection(db, `chats/${chatId}/messages`);
      const unreadQuery = query(
        messagesRef,
        where('readBy', 'array-contains', currentUser.uid)
      );
      
      const unreadMessages = await getDocs(unreadQuery);
      const now = serverTimestamp();

      unreadMessages.docs.forEach(doc => {
        batch.update(doc.ref, {
          readBy: [...(doc.data().readBy || []), currentUser.uid],
          readTimestamps: {
            ...(doc.data().readTimestamps || {}),
            [currentUser.uid]: now
          }
        });
      });

      // Reset unread count
      batch.update(doc(db, 'chats', chatId), {
        [`unreadCount.${currentUser.uid}`]: 0
      });

      await batch.commit();
      setError(null);
    } catch (err) {
      console.error('Error marking as read:', err);
      setError('Errore durante la lettura dei messaggi');
    }
  };

  const deleteMessage = async (messageId: string, deleteForEveryone: boolean) => {
    if (!currentUser) return;

    try {
      const messageRef = doc(db, `chats/${chatId}/messages`, messageId);
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) {
        throw new Error('Messaggio non trovato');
      }

      const messageData = messageDoc.data();

      // Check permissions for group chats
      if (options.isGroupChat && deleteForEveryone) {
        const isAdmin = options.groupAdmins?.includes(currentUser.uid);
        const isCreator = options.groupCreator === currentUser.uid;
        const isSender = messageData.senderId === currentUser.uid;

        if (!isAdmin && !isCreator && !isSender) {
          throw new Error('Non hai i permessi per eliminare questo messaggio');
        }
      }

      // Check permissions for individual chats
      if (!options.isGroupChat && deleteForEveryone && messageData.senderId !== currentUser.uid) {
        throw new Error('Non hai i permessi per eliminare questo messaggio');
      }

      const batch = writeBatch(db);

      // Delete media file if exists
      if (messageData.mediaUrl) {
        try {
          const fileRef = ref(storage, messageData.mediaUrl);
          await deleteObject(fileRef);
        } catch (error) {
          console.error('Error deleting media file:', error);
        }
      }

      if (deleteForEveryone) {
        // Delete message for everyone
        batch.delete(messageRef);
      } else {
        // Mark message as deleted for current user
        batch.update(messageRef, {
          [`deletedFor.${currentUser.uid}`]: true
        });
      }

      await batch.commit();
      setError(null);
    } catch (err) {
      console.error('Error deleting message:', err);
      setError('Errore durante l\'eliminazione del messaggio');
      throw err;
    }
  };

  const blockUser = async () => {
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        isBlocked: true,
        updatedAt: serverTimestamp()
      });
      setError(null);
    } catch (err) {
      console.error('Error blocking user:', err);
      setError('Errore durante il blocco dell\'utente');
    }
  };

  const unblockUser = async () => {
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        isBlocked: false,
        updatedAt: serverTimestamp()
      });
      setError(null);
    } catch (err) {
      console.error('Error unblocking user:', err);
      setError('Errore durante lo sblocco dell\'utente');
    }
  };

  const setMessageTimer = async (seconds: number) => {
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        messageTimer: seconds,
        updatedAt: serverTimestamp()
      });
      setError(null);
    } catch (err) {
      console.error('Error setting message timer:', err);
      setError('Errore durante l\'impostazione del timer');
    }
  };

  const toggleScreenshotPrevention = async () => {
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        screenshotPrevention: !options.screenshotPrevention,
        updatedAt: serverTimestamp()
      });
      setError(null);
    } catch (err) {
      console.error('Error toggling screenshot prevention:', err);
      setError('Errore durante la modifica delle impostazioni screenshot');
    }
  };

  return {
    messages,
    options,
    loading,
    error,
    recipientStatus,
    blockUser,
    unblockUser,
    setMessageTimer,
    toggleScreenshotPrevention,
    sendMessage,
    markAsRead,
    deleteMessage
  };
}

export default useChat;