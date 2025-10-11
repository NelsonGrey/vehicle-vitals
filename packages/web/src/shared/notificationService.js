import { firebaseConfig } from './firebaseConfig';

// Notification service for Firebase Cloud Messaging
let messaging = null;

// Initialize Firebase messaging
const initializeMessaging = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;

  // Wait for Firebase to be available globally
  const checkFirebase = () => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max

      const check = () => {
        attempts++;
        if (window.firebase && window.firebase.messaging && window.firebase.messaging.getMessaging) {
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
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Service Worker registered for FCM');
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    return { messaging: msg, messagingFunctions: firebase.messaging };
  } catch (error) {
    console.warn('Firebase messaging not available:', error.message);
    return null;
  }
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
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
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

// Listen for foreground messages
export const onMessageListener = async () => {
  try {
    const firebaseServices = await initializeMessaging();
    if (firebaseServices) {
      const { messaging, messagingFunctions } = firebaseServices;
      return new Promise((resolve) => {
        messagingFunctions.onMessage(messaging, (payload) => {
          resolve(payload);
        });
      });
    }
    return null;
  } catch (error) {
    console.error('Error setting up message listener:', error);
    return null;
  }
};