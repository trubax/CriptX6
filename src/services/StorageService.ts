import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

export class StorageService {
  private static instance: StorageService;

  private constructor() {}

  static getInstance() {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async uploadChatMedia(file: File, chatId: string, userId: string): Promise<string> {
    try {
      const extension = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${extension}`;
      const filePath = `chats/${chatId}/${fileName}`;
      const storageRef = ref(storage, filePath);

      // Add metadata
      const metadata = {
        contentType: file.type,
        customMetadata: {
          userId,
          originalName: file.name,
          timestamp: new Date().toISOString()
        }
      };

      await uploadBytes(storageRef, file, metadata);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading chat media:', error);
      throw new Error('Errore durante il caricamento del file');
    }
  }

  async uploadProfilePicture(file: File, userId: string): Promise<string> {
    try {
      const extension = file.name.split('.').pop();
      const fileName = `profile.${extension}`;
      const filePath = `users/${userId}/profile/${fileName}`;
      const storageRef = ref(storage, filePath);

      const metadata = {
        contentType: file.type,
        customMetadata: {
          userId,
          timestamp: new Date().toISOString()
        }
      };

      await uploadBytes(storageRef, file, metadata);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw new Error('Errore durante il caricamento dell\'immagine del profilo');
    }
  }

  async deleteFile(url: string): Promise<void> {
    try {
      const fileRef = ref(storage, url);
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Errore durante l\'eliminazione del file');
    }
  }

  async uploadTempFile(file: File, userId: string): Promise<string> {
    try {
      const fileName = `${uuidv4()}-${file.name}`;
      const filePath = `temp/${userId}/${fileName}`;
      const storageRef = ref(storage, filePath);

      const metadata = {
        contentType: file.type,
        customMetadata: {
          userId,
          originalName: file.name,
          timestamp: new Date().toISOString()
        }
      };

      await uploadBytes(storageRef, file, metadata);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading temporary file:', error);
      throw new Error('Errore durante il caricamento temporaneo del file');
    }
  }
}