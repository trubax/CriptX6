import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, doc, getDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  photoURL?: string;
  status: 'online' | 'offline' | 'unregistered';
  lastSeen?: Date;
  isBlocked: boolean;
  userId: string;
  isRegistered: boolean;
}

export interface ContactData {
  name: string;
  phoneNumber: string;
  email?: string;
  photoURL?: string;
  userId: string;
  isRegistered: boolean;
  status?: 'online' | 'offline';
  lastSeen?: Date;
}

class ContactsService {
  private static instance: ContactsService | null = null;
  private statusListeners: Map<string, () => void> = new Map();
  private userStatusListeners: Map<string, () => void> = new Map();

  private constructor() {}

  static getInstance(): ContactsService {
    if (!ContactsService.instance) {
      ContactsService.instance = new ContactsService();
    }
    return ContactsService.instance;
  }

  private validateContactData(data: ContactData): string | null {
    if (!data.name || data.name.trim().length < 2) {
      return 'Il nome deve contenere almeno 2 caratteri';
    }
    if (!data.phoneNumber && !data.email) {
      return 'È necessario fornire almeno un numero di telefono o un\'email';
    }
    if (data.phoneNumber && !/^\+?[\d\s-]{8,}$/.test(data.phoneNumber.trim())) {
      return 'Numero di telefono non valido';
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      return 'Indirizzo email non valido';
    }
    return null;
  }

  private async checkRegistrationStatus(phoneNumber?: string, email?: string): Promise<{ isRegistered: boolean; userId?: string; userData?: any }> {
    const usersRef = collection(db, 'users');
    let userQuery;

    if (phoneNumber) {
      userQuery = query(usersRef, where('phoneNumber', '==', phoneNumber));
      const snapshot = await getDocs(userQuery);
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        return { 
          isRegistered: true, 
          userId: snapshot.docs[0].id,
          userData 
        };
      }
    }

    if (email) {
      userQuery = query(usersRef, where('email', '==', email));
      const snapshot = await getDocs(userQuery);
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        return { 
          isRegistered: true, 
          userId: snapshot.docs[0].id,
          userData 
        };
      }
    }

    return { isRegistered: false };
  }

  private setupUserStatusListener(userId: string, contactId: string, currentUser: User) {
    this.removeUserStatusListener(userId);

    const userRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userRef, async (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.data();
        const contactRef = doc(db, `users/${currentUser.uid}/contacts`, contactId);
        
        await updateDoc(contactRef, {
          status: userData.status || 'offline',
          lastSeen: userData.lastSeen || null,
          photoURL: userData.photoURL || null,
          updatedAt: serverTimestamp()
        });
      }
    });

    this.userStatusListeners.set(userId, unsubscribe);
  }

  private removeUserStatusListener(userId: string) {
    const unsubscribe = this.userStatusListeners.get(userId);
    if (unsubscribe) {
      unsubscribe();
      this.userStatusListeners.delete(userId);
    }
  }

  async getContacts(currentUser: User | null): Promise<Contact[]> {
    if (!currentUser) return [];

    try {
      const contactsRef = collection(db, `users/${currentUser.uid}/contacts`);
      const snapshot = await getDocs(contactsRef);
      
      const contacts = await Promise.all(snapshot.docs.map(async doc => {
        const data = doc.data();
        
        // Verifica lo stato di registrazione
        const { isRegistered, userId, userData } = await this.checkRegistrationStatus(
          data.phoneNumber,
          data.email
        );
        
        if (isRegistered && userId) {
          // Setup real-time status listener per utenti registrati
          this.setupUserStatusListener(userId, doc.id, currentUser);
        }

        return {
          id: doc.id,
          ...data,
          status: userData?.status || 'unregistered',
          lastSeen: userData?.lastSeen?.toDate(),
          photoURL: userData?.photoURL || data.photoURL,
          isBlocked: data.isBlocked || false,
          isRegistered,
          userId: userId || ''
        } as Contact;
      }));

      return contacts;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw new Error('Errore nel caricamento dei contatti');
    }
  }

  async addContact(currentUser: User | null, contactData: ContactData): Promise<Contact | null> {
    if (!currentUser) {
      throw new Error('Devi effettuare l\'accesso per aggiungere contatti');
    }

    try {
      const validationError = this.validateContactData(contactData);
      if (validationError) {
        throw new Error(validationError);
      }

      // Verifica se il contatto esiste già
      const existingContact = await this.findContactByPhoneOrEmail(
        currentUser,
        contactData.phoneNumber,
        contactData.email || ''
      );

      if (existingContact) {
        throw new Error('Questo contatto esiste già nella tua rubrica');
      }

      // Verifica lo stato di registrazione
      const { isRegistered, userId, userData } = await this.checkRegistrationStatus(
        contactData.phoneNumber,
        contactData.email
      );

      // Prepara i dati del contatto, rimuovendo i valori undefined
      const contactDataToSave = {
        name: contactData.name.trim(),
        phoneNumber: contactData.phoneNumber?.trim() || null,
        email: contactData.email?.trim() || null,
        photoURL: userData?.photoURL || contactData.photoURL || null, // Usa null invece di undefined
        userId: userId || '',
        isRegistered,
        isBlocked: false,
        status: userData?.status || 'unregistered',
        lastSeen: userData?.lastSeen || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Rimuovi tutti i campi con valore undefined o null
      Object.keys(contactDataToSave).forEach(key => {
        if (contactDataToSave[key] === undefined || contactDataToSave[key] === null) {
          delete contactDataToSave[key];
        }
      });

      // Crea il contatto
      const contactsRef = collection(db, `users/${currentUser.uid}/contacts`);
      const docRef = await addDoc(contactsRef, contactDataToSave);

      // Setup status listener per utenti registrati
      if (isRegistered && userId) {
        this.setupUserStatusListener(userId, docRef.id, currentUser);
      }

      const newContact = {
        id: docRef.id,
        ...contactDataToSave,
        lastSeen: userData?.lastSeen?.toDate(),
      } as Contact;

      return newContact;
    } catch (error: any) {
      console.error('Error adding contact:', error);
      throw error;
    }
  }

  async findContactByPhoneOrEmail(currentUser: User | null, phoneNumber: string, email: string): Promise<Contact | null> {
    if (!currentUser) return null;

    try {
      const contactsRef = collection(db, `users/${currentUser.uid}/contacts`);
      const phoneQuery = phoneNumber ? query(contactsRef, where('phoneNumber', '==', phoneNumber)) : null;
      const emailQuery = email ? query(contactsRef, where('email', '==', email)) : null;

      const [phoneResults, emailResults] = await Promise.all([
        phoneQuery ? getDocs(phoneQuery) : null,
        emailQuery ? getDocs(emailQuery) : null
      ]);

      const phoneContact = phoneResults?.docs[0];
      const emailContact = emailResults?.docs[0];
      const existingContact = phoneContact || emailContact;

      if (existingContact) {
        return {
          id: existingContact.id,
          ...existingContact.data()
        } as Contact;
      }

      return null;
    } catch (error) {
      console.error('Error finding contact:', error);
      return null;
    }
  }

  async updateContact(currentUser: User | null, contactId: string, updates: Partial<Contact>): Promise<void> {
    if (!currentUser) {
      throw new Error('Devi effettuare l\'accesso per modificare i contatti');
    }

    try {
      if (updates.phoneNumber || updates.email) {
        const validationError = this.validateContactData({
          name: updates.name || '',
          phoneNumber: updates.phoneNumber || '',
          email: updates.email,
          userId: updates.userId || '',
          isRegistered: updates.isRegistered || false
        });
        if (validationError) {
          throw new Error(validationError);
        }
      }

      const contactRef = doc(db, `users/${currentUser.uid}/contacts`, contactId);
      await updateDoc(contactRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      // Aggiorna lo status listener se necessario
      const contact = await this.getContactById(currentUser, contactId);
      if (contact?.isRegistered && contact?.userId) {
        this.setupUserStatusListener(contact.userId, contactId, currentUser);
      }
    } catch (error: any) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }

  async deleteContact(currentUser: User | null, contactId: string): Promise<void> {
    if (!currentUser) {
      throw new Error('Devi effettuare l\'accesso per eliminare i contatti');
    }

    try {
      const contact = await this.getContactById(currentUser, contactId);
      const contactRef = doc(db, `users/${currentUser.uid}/contacts`, contactId);
      
      if (contact?.userId) {
        this.removeUserStatusListener(contact.userId);
      }

      await deleteDoc(contactRef);
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw new Error('Errore durante l\'eliminazione del contatto');
    }
  }

  async blockContact(currentUser: User | null, contactId: string): Promise<void> {
    if (!currentUser) {
      throw new Error('Devi effettuare l\'accesso per bloccare i contatti');
    }

    try {
      const contactRef = doc(db, `users/${currentUser.uid}/contacts`, contactId);
      await updateDoc(contactRef, {
        isBlocked: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error blocking contact:', error);
      throw new Error('Errore durante il blocco del contatto');
    }
  }

  async unblockContact(currentUser: User | null, contactId: string): Promise<void> {
    if (!currentUser) {
      throw new Error('Devi effettuare l\'accesso per sbloccare i contatti');
    }

    try {
      const contactRef = doc(db, `users/${currentUser.uid}/contacts`, contactId);
      await updateDoc(contactRef, {
        isBlocked: false,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error unblocking contact:', error);
      throw new Error('Errore durante lo sblocco del contatto');
    }
  }

  async searchContacts(currentUser: User | null, query: string): Promise<Contact[]> {
    try {
      const contacts = await this.getContacts(currentUser);
      const searchTerm = query.toLowerCase();
      
      return contacts.filter(contact => 
        contact.name.toLowerCase().includes(searchTerm) ||
        contact.phoneNumber.includes(searchTerm) ||
        (contact.email && contact.email.toLowerCase().includes(searchTerm))
      );
    } catch (error) {
      console.error('Error searching contacts:', error);
      throw new Error('Errore durante la ricerca dei contatti');
    }
  }

  async getContactById(currentUser: User | null, contactId: string): Promise<Contact | null> {
    if (!currentUser) {
      throw new Error('Devi effettuare l\'accesso per visualizzare i contatti');
    }

    try {
      const contactRef = doc(db, `users/${currentUser.uid}/contacts`, contactId);
      const contactSnap = await getDoc(contactRef);

      if (!contactSnap.exists()) {
        return null;
      }

      const contactData = contactSnap.data();
      
      // Verifica lo stato di registrazione
      const { isRegistered, userId, userData } = await this.checkRegistrationStatus(
        contactData.phoneNumber,
        contactData.email
      );

      return {
        id: contactSnap.id,
        ...contactData,
        status: userData?.status || 'unregistered',
        lastSeen: userData?.lastSeen?.toDate(),
        photoURL: userData?.photoURL || contactData.photoURL,
        isBlocked: contactData.isBlocked || false,
        isRegistered,
        userId: userId || ''
      } as Contact;

    } catch (error) {
      console.error('Error getting contact:', error);
      throw new Error('Errore nel recupero del contatto');
    }
  }

  cleanup() {
    this.statusListeners.forEach(unsubscribe => unsubscribe());
    this.statusListeners.clear();
    this.userStatusListeners.forEach(unsubscribe => unsubscribe());
    this.userStatusListeners.clear();
  }
}

export const contactsService = ContactsService.getInstance();
export default ContactsService;