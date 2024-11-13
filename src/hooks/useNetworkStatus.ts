import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { enableNetwork, disableNetwork } from 'firebase/firestore';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFirestoreAvailable, setIsFirestoreAvailable] = useState(true);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      try {
        await enableNetwork(db);
        setIsFirestoreAvailable(true);
      } catch (error) {
        console.error('Error enabling Firestore:', error);
        setIsFirestoreAvailable(false);
      }
    };

    const handleOffline = async () => {
      setIsOnline(false);
      try {
        await disableNetwork(db);
        setIsFirestoreAvailable(false);
      } catch (error) {
        console.error('Error disabling Firestore:', error);
      }
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, isFirestoreAvailable };
}