import { onAuthStateChanged } from 'firebase/auth';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import { auth, storage } from './firebaseConfig';

const getCurrentUserIdOrThrow = async () => {
  const current = auth.currentUser;
  if (current?.uid) {
    return current.uid;
  }

  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, user => {
      unsub();
      if (user?.uid) {
        resolve(user.uid);
      } else {
        reject(new Error('No authenticated user available for upload path.'));
      }
    });
  });
};

// Upload file to Firebase Storage
export const uploadFile = async (file, path) => {
  try {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        snapshot => {
          // Progress monitoring (optional)
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload progress:', progress);
        },
        error => {
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
              name: file.name,
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
export const deleteFile = async path => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Generate storage path for maintenance attachments
export const generateMaintenanceAttachmentPath = async (
  vin,
  maintenanceId,
  fileName
) => {
  const userId = await getCurrentUserIdOrThrow();
  const timestamp = Date.now();
  const extension = fileName.split('.').pop();
  return `users/${userId}/vehicles/${vin}/maintenance/${maintenanceId}/${timestamp}.${extension}`;
};

// Generate storage path for vehicle record attachments
export const generateVehicleRecordAttachmentPath = async (
  vin,
  recordId,
  fileName
) => {
  const userId = await getCurrentUserIdOrThrow();
  const timestamp = Date.now();
  const extension = fileName.includes('.') ? fileName.split('.').pop() : 'bin';
  return `users/${userId}/vehicles/${vin}/records/${recordId}/${timestamp}.${extension}`;
};

export const generateVehiclePhotoPath = async (vin, fileName) => {
  const userId = await getCurrentUserIdOrThrow();
  const timestamp = Date.now();
  const extension = fileName.includes('.') ? fileName.split('.').pop() : 'jpg';
  return `users/${userId}/vehicles/${vin}/photo/${timestamp}.${extension}`;
};
