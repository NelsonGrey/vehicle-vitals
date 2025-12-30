// Firebase Messaging Service Worker
/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging.js');

// Initialize Firebase in service worker
firebase.initializeApp({
  apiKey: "AIzaSyB8Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z",
  authDomain: "vehicle-vitals.firebaseapp.com",
  projectId: "vehicle-vitals",
  storageBucket: "vehicle-vitals.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Vehicle Vitals';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/firebase-logo.png',
    badge: '/firebase-logo.png',
    tag: payload.data?.tag || 'vehicle-vitals-notification'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
/* eslint-enable no-undef */