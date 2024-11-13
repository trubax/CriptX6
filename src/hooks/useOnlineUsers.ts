import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export interface OnlineUser {
  uid: string;
  displayName: string;
  photoURL: string;
  status: 'online' | 'offline';
  lastSeen: Date;
  isAnonymous: boolean;
  email?: string;
  phoneNumber?: string;
}

export function useOnlineUsers(isAnonymous: boolean = false) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    // Riferimento al documento dell'utente corrente
    const userRef = doc(db, 'users', currentUser.uid);

    // Aggiorna lo stato a online e imposta lastSeen
    const setOnlineStatus = async () => {
      await updateDoc(userRef, {
        status: 'online',
        lastSeen: serverTimestamp()
      });
    };

    // Aggiorna lo stato a offline quando l'utente si disconnette
    const setOfflineStatus = async () => {
      await updateDoc(userRef, {
        status: 'offline',
        lastSeen: serverTimestamp()
      });
    };

    // Gestione dello stato online/offline
    const handleOnlineStatus = () => {
      if (navigator.onLine) {
        setOnlineStatus();
      } else {
        setOfflineStatus();
      }
    };

    // Imposta lo stato iniziale
    setOnlineStatus();

    // Ascolta i cambiamenti di connettività
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    // Imposta offline quando l'utente chiude la pagina
    window.addEventListener('beforeunload', () => setOfflineStatus());

    // Query per gli utenti online/offline
    const usersQuery = query(
      collection(db, 'users'),
      where('isAnonymous', '==', isAnonymous)
    );

    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const users = snapshot.docs
        .map(doc => ({
          uid: doc.id,
          ...doc.data(),
          lastSeen: doc.data().lastSeen?.toDate() || new Date()
        }))
        .filter(user => user.uid !== currentUser.uid) as OnlineUser[];

      setOnlineUsers(users);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      setOfflineStatus();
    };
  }, [currentUser, isAnonymous]);

  return { onlineUsers, loading };
}