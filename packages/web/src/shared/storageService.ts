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
import { resolveGarageContext } from './firestoreService';

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  type: string;
  name: string;
}

export interface GarageStorageContext {
  userId: string;
  orgId?: string | null;
  garageStorageMode?: string | null;
}

export const buildVehicleStorageBasePath = (
  context: GarageStorageContext,
  vin: string
): string => {
  const normalizedVin = String(vin || '').trim();
  const isPreferencesVehicle = normalizedVin.toLowerCase() === 'preferences';
  const useOrgScope =
    !isPreferencesVehicle &&
    Boolean(context.orgId) &&
    (context.garageStorageMode === 'org_scoped' ||
      context.garageStorageMode === 'dual_write');

  if (useOrgScope) {
    return `orgs/${context.orgId}/vehicles/${normalizedVin}`;
  }

  return `users/${context.userId}/vehicles/${normalizedVin}`;
};

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

const getVehicleStorageBasePathOrThrow = async (vin: string): Promise<string> => {
  const userId = await getCurrentUserIdOrThrow();
  const garageContext = await resolveGarageContext().catch(() => null);

  return buildVehicleStorageBasePath(
    {
      userId,
      orgId: garageContext?.orgId ?? null,
      garageStorageMode: garageContext?.garageStorageMode ?? 'user_scoped',
    },
    vin
  );
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
  const basePath = await getVehicleStorageBasePathOrThrow(vin);
  const timestamp = Date.now();
  const extension = fileName.split('.').pop();
  return `${basePath}/maintenance/${maintenanceId}/${timestamp}.${extension}`;
};

// Generate storage path for vehicle record attachments
export const generateVehicleRecordAttachmentPath = async (
  vin: string,
  recordId: string,
  fileName: string
): Promise<string> => {
  const basePath = await getVehicleStorageBasePathOrThrow(vin);
  const timestamp = Date.now();
  const extension = fileName.includes('.') ? fileName.split('.').pop() : 'bin';
  return `${basePath}/records/${recordId}/${timestamp}.${extension}`;
};

export const generateVehiclePhotoPath = async (
  vin: string,
  fileName: string
): Promise<string> => {
  const basePath = await getVehicleStorageBasePathOrThrow(vin);
  const timestamp = Date.now();
  const extension = fileName.includes('.') ? fileName.split('.').pop() : 'jpg';
  return `${basePath}/photo/${timestamp}.${extension}`;
};
