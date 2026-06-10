import {
  onMessage as firebaseOnMessage,
  getMessaging,
  getToken,
  Messaging,
} from 'firebase/messaging';
import { app } from './firebaseConfig';
import type { FirebaseApp } from 'firebase/app';
import type { MessagePayload } from 'firebase/messaging';

// Notification service for Firebase Cloud Messaging

// Initialize Firebase messaging
const initializeMessaging = async (): Promise<Messaging | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator))
    return null;

  try {
    const messaging: Messaging = getMessaging(app);

    // Register service worker for background messages
    navigator.serviceWorker
      .register('/firebase-messaging-sw.js')
      .catch((error: Error) => {
        console.error('Service Worker registration failed:', error);
      });

    return messaging;
  } catch (error) {
    console.warn('Firebase messaging not available:', (error as Error).message);
    return null;
  }
};

export const buildReminderNotificationPath = (payloadData: Record<string, unknown> = {}): string => {
  const params = new URLSearchParams({ source: 'push' });
  const vin =
    typeof payloadData?.vin === 'string'
      ? payloadData.vin.trim().toUpperCase()
      : '';

  if (vin) {
    params.set('vin', vin);
  }

  return `/app/upcoming?${params.toString()}`;
};

// Request notification permission and get token
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const messaging = await initializeMessaging();
      if (messaging) {
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });
        return token;
      }
    }
    return null;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

export const subscribeToForegroundMessages = async (
  onMessage: (payload: MessagePayload) => void
): Promise<() => void> => {
  try {
    const messaging = await initializeMessaging();
    if (!messaging) {
      return () => {};
    }

    return firebaseOnMessage(messaging, (payload: MessagePayload) => {
      onMessage(payload);
    });
  } catch (error) {
    console.error('Error setting up message listener:', error);
    return () => {};
  }
};

// Listen for foreground messages
export const onMessageListener = async (): Promise<MessagePayload | null> => {
  try {
    const messaging = await initializeMessaging();
    if (!messaging) {
      return null;
    }

    return await new Promise(resolve => {
      const unsubscribe = firebaseOnMessage(messaging, (payload: MessagePayload) => {
        unsubscribe();
        resolve(payload);
      });
    });
  } catch (error) {
    console.error('Error setting up message listener:', error);
    return null;
  }
};
