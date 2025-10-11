import { firebaseConfig } from './firebaseConfig';

// Initialize Firebase storage
const initializeStorage = async () => {
  if (typeof window === 'undefined') return null;

  // Wait for Firebase to be available globally
  const checkFirebase = () => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max

      const check = () => {
        attempts++;
        if (window.firebase && window.firebase.storage && window.firebase.storage.getStorage) {
          resolve(window.firebase);
        } else if (attempts >= maxAttempts) {
          reject(new Error('Firebase storage SDK failed to load'));
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

    const strg = firebase.storage.getStorage(app);

    return { storage: strg, storageFunctions: firebase.storage };
  } catch (error) {
    console.warn('Firebase storage not available:', error.message);
    return null;
  }
};

// Upload file to Firebase Storage
export const uploadFile = async (file, path) => {
  try {
    const firebaseServices = await initializeStorage();
    if (!firebaseServices) throw new Error('Firebase storage not available');

    const { storage, storageFunctions } = firebaseServices;
    const storageRef = storageFunctions.ref(storage, path);
    const uploadTask = storageFunctions.uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Progress monitoring (optional)
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload progress:', progress);
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await storageFunctions.getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              url: downloadURL,
              path: path,
              size: file.size,
              type: file.type,
              name: file.name
            });
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Delete file from Firebase Storage
export const deleteFile = async (path) => {
  try {
    const firebaseServices = await initializeStorage();
    if (!firebaseServices) throw new Error('Firebase storage not available');

    const { storage, storageFunctions } = firebaseServices;
    const storageRef = storageFunctions.ref(storage, path);
    await storageFunctions.deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Generate storage path for maintenance attachments
export const generateMaintenanceAttachmentPath = async (vin, maintenanceId, fileName) => {
  // Get current user ID
  const getCurrentUserId = () => {
    return new Promise((resolve) => {
      const checkAuth = () => {
        if (window.firebase && window.firebase.auth) {
          const auth = window.firebase.auth.getAuth();
          const user = auth.currentUser;
          if (user) {
            resolve(user.uid);
          } else {
            // Wait for auth state change
            const unsub = window.firebase.auth.onAuthStateChanged(auth, (u) => {
              unsub();
              resolve(u?.uid || 'anonymous');
            });
          }
        } else {
          setTimeout(checkAuth, 100);
        }
      };
      checkAuth();
    });
  };

  const userId = await getCurrentUserId();
  const timestamp = Date.now();
  const extension = fileName.split('.').pop();
  return `users/${userId}/vehicles/${vin}/maintenance/${maintenanceId}/${timestamp}.${extension}`;
};