import { firebaseConfig } from './firebaseConfig';

// Notification service for Firebase Cloud Messaging
let messaging = null; // eslint-disable-line @typescript-eslint/no-unused-vars

// Initialize Firebase messaging
const initializeMessaging = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator))
    return null;

  // Wait for Firebase to be available globally
  const checkFirebase = () => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max

      const check = () => {
        attempts++;
        if (
          window.firebase &&
          window.firebase.messaging &&
          window.firebase.messaging.getMessaging
        ) {
          resolve(window.firebase);
        } else if (attempts >= maxAttempts) {
          reject(new Error('Firebase messaging SDK failed to load'));
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  };

  try {
    const firebase = await checkFirebase();

    // Import config module for the config object
    // const { firebaseConfig } = await import('./firebaseConfig');

    // Initialize Firebase app if not already initialized
    let app;
    try {
      app = firebase.app.getApp();
    } catch {
      app = firebase.app.initializeApp(firebaseConfig);
    }

    const msg = firebase.messaging.getMessaging(app);

    // Register service worker for background messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then(registration => {
          // eslint-disable-line @typescript-eslint/no-unused-vars
          console.log('Service Worker registered for FCM');
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }

    return { messaging: msg, messagingFunctions: firebase.messaging };
  } catch (error) {
    console.warn('Firebase messaging not available:', error.message);
    return null;
  }
};

export const buildReminderNotificationPath = (payloadData = {}) => {
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
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const firebaseServices = await initializeMessaging();
      if (firebaseServices) {
        const { messaging, messagingFunctions } = firebaseServices;
        const token = await messagingFunctions.getToken(messaging, {
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

export const subscribeToForegroundMessages = async onMessage => {
  try {
    const firebaseServices = await initializeMessaging();
    if (!firebaseServices) {
      return () => {};
    }

    const { messaging, messagingFunctions } = firebaseServices;
    return messagingFunctions.onMessage(messaging, payload => {
      onMessage(payload);
    });
  } catch (error) {
    console.error('Error setting up message listener:', error);
    return () => {};
  }
};

// Listen for foreground messages
export const onMessageListener = async () => {
  try {
    const firebaseServices = await initializeMessaging();
    if (!firebaseServices) {
      return null;
    }

    const { messaging, messagingFunctions } = firebaseServices;
    return await new Promise(resolve => {
      const unsubscribe = messagingFunctions.onMessage(messaging, payload => {
        unsubscribe();
        resolve(payload);
      });
    });
  } catch (error) {
    console.error('Error setting up message listener:', error);
    return null;
  }
};
