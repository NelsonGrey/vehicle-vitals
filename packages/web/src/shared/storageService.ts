import { onAuthStateChanged } from 'firebase/auth';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  UploadTask,
  StorageReference,
} from 'firebase/storage';
import { auth, storage } from './firebaseConfig';
import type { Auth, FirebaseStorage } from 'firebase/auth';

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  type: string;
  name: string;
}

const getCurrentUserIdOrThrow = async (): Promise<string> => {
  const current = auth.currentUser;
  if (current?.uid) {
    return current.uid;
  }

  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user: any) => {
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
export const uploadFile = async (
  file: File,
  path: string
): Promise<UploadResult> => {
  try {
    const storageRef: StorageReference = ref(storage, path);
    const uploadTask: UploadTask = uploadBytesResumable(storageRef, file);

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
export const deleteFile = async (path: string): Promise<void> => {
  try {
    const storageRef: StorageReference = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Generate storage path for maintenance attachments
export const generateMaintenanceAttachmentPath = async (
  vin: string,
  maintenanceId: string,
  fileName: string
): Promise<string> => {
  const userId = await getCurrentUserIdOrThrow();
  const timestamp = Date.now();
  const extension = fileName.split('.').pop();
  return `users/${userId}/vehicles/${vin}/maintenance/${maintenanceId}/${timestamp}.${extension}`;
};

// Generate storage path for vehicle record attachments
export const generateVehicleRecordAttachmentPath = async (
  vin: string,
  recordId: string,
  fileName: string
): Promise<string> => {
  const userId = await getCurrentUserIdOrThrow();
  const timestamp = Date.now();
  const extension = fileName.includes('.') ? fileName.split('.').pop() : 'bin';
  return `users/${userId}/vehicles/${vin}/records/${recordId}/${timestamp}.${extension}`;
};

export const generateVehiclePhotoPath = async (
  vin: string,
  fileName: string
): Promise<string> => {
  const userId = await getCurrentUserIdOrThrow();
  const timestamp = Date.now();
  const extension = fileName.includes('.') ? fileName.split('.').pop() : 'jpg';
  return `users/${userId}/vehicles/${vin}/photo/${timestamp}.${extension}`;
};
