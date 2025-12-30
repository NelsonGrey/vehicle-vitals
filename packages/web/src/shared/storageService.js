import { storage, auth } from './firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';

// Upload file to Firebase Storage
export const uploadFile = async (file, path) => {
  try {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

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
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
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
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
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
      const user = auth.currentUser;
      if (user) {
        resolve(user.uid);
      } else {
        // Wait for auth state change
        const unsub = onAuthStateChanged(auth, (u) => {
          unsub();
          resolve(u?.uid || 'anonymous');
        });
      }
    });
  };

  const userId = await getCurrentUserId();
  const timestamp = Date.now();
  const extension = fileName.split('.').pop();
  return `users/${userId}/vehicles/${vin}/maintenance/${maintenanceId}/${timestamp}.${extension}`;
};