import { useState, useEffect } from 'react';
import { NotificationService } from '../services/NotificationService';
import { useAuth } from '../contexts/AuthContext';

export function useNotifications() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    const initializeNotifications = async () => {
      if (!currentUser || initialized) return;

      try {
        await notificationService.initialize();
        setInitialized(true);
        setError(null);
      } catch (error: any) {
        setError(error.message || 'Error initializing notifications');
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();
  }, [currentUser, initialized]);

  return {
    initialized,
    error,
    settings: notificationService.getSettings(),
    updateSettings: notificationService.saveSettings.bind(notificationService)
  };
}