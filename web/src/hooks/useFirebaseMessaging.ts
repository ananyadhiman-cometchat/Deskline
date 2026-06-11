import { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../lib/firebase';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { queryClient } from '../lib/queryClient';

export function useFirebaseMessaging() {
  const { user, isAuthenticated } = useAuthStore();
  const showToast = useUIStore((s) => s.showToast);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user || !messaging) return;

    const requestPermissionAndGetToken = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
          if (!vapidKey) {
            console.warn('VITE_FIREBASE_VAPID_KEY is missing. Cannot generate FCM token.');
            return;
          }

          const token = await getToken(messaging, { vapidKey });
          
          if (token) {
            setFcmToken(token);
            // Send token to backend
            await api.patch('/api/users/me/fcm-token', { fcmToken: token }).catch(console.error);
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        } else {
          console.log('Unable to get permission to notify.');
        }
      } catch (error) {
        console.error('An error occurred while retrieving token. ', error);
      }
    };

    requestPermissionAndGetToken();

    // Listen for foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      const title = payload.notification?.title || payload.data?.title || 'New Notification';
      const body = payload.notification?.body || payload.data?.body;
      
      showToast({
        type: 'info',
        title,
        message: body || '',
      });

      // Invalidate queries so the UI updates to reflect the new state
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, user?.id]); // Re-run if user logs in as someone else

  return { fcmToken };
}
