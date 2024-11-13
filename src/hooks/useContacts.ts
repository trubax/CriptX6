import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { contactsService, Contact } from '../services/ContactsService';

export function useContacts() {
  const { currentUser } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContacts();
    return () => {
      contactsService.cleanup();
    };
  }, [currentUser]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedContacts = await contactsService.getContacts(currentUser);
      setContacts(fetchedContacts);
    } catch (error: any) {
      console.error('Error loading contacts:', error);
      setError(error.message || 'Errore nel caricamento dei contatti');
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (data: { name: string; phoneNumber: string; email?: string }) => {
    try {
      setError(null);
      const added = await contactsService.addContact(currentUser, {
        ...data,
        userId: '',
        isRegistered: false
      });
      if (added) {
        setContacts(prev => [...prev, added]);
        return added;
      }
    } catch (error: any) {
      throw error;
    }
  };

  const updateContact = async (contactId: string, updates: Partial<Contact>) => {
    try {
      setError(null);
      await contactsService.updateContact(currentUser, contactId, updates);
      await loadContacts();
    } catch (error: any) {
      throw error;
    }
  };

  const deleteContact = async (contactId: string) => {
    try {
      setError(null);
      await contactsService.deleteContact(currentUser, contactId);
      setContacts(prev => prev.filter(c => c.id !== contactId));
    } catch (error: any) {
      throw error;
    }
  };

  const blockContact = async (contactId: string) => {
    try {
      setError(null);
      await contactsService.blockContact(currentUser, contactId);
      await loadContacts();
    } catch (error: any) {
      throw error;
    }
  };

  const unblockContact = async (contactId: string) => {
    try {
      setError(null);
      await contactsService.unblockContact(currentUser, contactId);
      await loadContacts();
    } catch (error: any) {
      throw error;
    }
  };

  const searchContacts = async (query: string) => {
    try {
      setError(null);
      const results = await contactsService.searchContacts(currentUser, query);
      setContacts(results);
    } catch (error: any) {
      throw error;
    }
  };

  return {
    contacts,
    loading,
    error,
    addContact,
    updateContact,
    deleteContact,
    blockContact,
    unblockContact,
    searchContacts,
    refreshContacts: loadContacts
  };
}