import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { contactsService, Contact } from '../../services/ContactsService';
import { useAuth } from '../../contexts/AuthContext';
import { useCreateChat } from '../../hooks/useCreateChat';
import ContactItem from './ContactItem';
import AddContactForm from './AddContactForm';
import EditContactModal from './EditContactModal';

interface ContactListProps {
  onSelectContact: (contact: Contact) => void;
  onStartCall: (contactId: string, isVideo: boolean) => void;
}

export default function ContactList({ onSelectContact, onStartCall }: ContactListProps) {
  const { currentUser } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const { createChat, loading: creatingChat } = useCreateChat();
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
      const fetchedContacts = await contactsService.getContacts(currentUser);
      setContacts(fetchedContacts);
      setError(null);
    } catch (error) {
      console.error('Error loading contacts:', error);
      setError('Errore nel caricamento dei contatti');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = await contactsService.searchContacts(currentUser, query);
      setContacts(results);
    } else {
      loadContacts();
    }
  };

  const handleAddContact = async (data: { name: string; phoneNumber: string; email?: string }) => {
    try {
      const added = await contactsService.addContact(currentUser, data);
      if (added) {
        setContacts(prev => [...prev, added]);
        setIsAddingContact(false);
        setError(null);
      }
    } catch (error: any) {
      setError(error.message || 'Errore durante l\'aggiunta del contatto');
    }
  };

  const handleEditContact = async (updates: Partial<Contact>) => {
    if (!editingContact) return;

    try {
      await contactsService.updateContact(currentUser, editingContact.id, updates);
      setEditingContact(null);
      loadContacts();
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Errore durante la modifica del contatto');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo contatto?')) return;

    try {
      await contactsService.deleteContact(currentUser, contactId);
      setContacts(prev => prev.filter(c => c.id !== contactId));
      setError(null);
    } catch (error) {
      setError('Errore durante l\'eliminazione del contatto');
    }
  };

  const handleShare = async (contact: Contact) => {
    const shareData = {
      title: 'Unisciti a CriptX',
      text: `Ciao! Unisciti a me su CriptX, un'app di messaggistica sicura.`,
      url: `https://criptx.app/invite?ref=${currentUser?.uid}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        const shareUrl = `whatsapp://send?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`;
        window.open(shareUrl);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleStartChat = async (contactId: string) => {
    try {
      await createChat(contactId);
    } catch (error: any) {
      setError(error.message || 'Errore nell\'avvio della chat');
    }
  };

  const handleBlock = async (contactId: string) => {
    try {
      await contactsService.blockContact(currentUser, contactId);
      loadContacts();
      setError(null);
    } catch (error) {
      setError('Errore durante il blocco del contatto');
    }
  };

  const handleUnblock = async (contactId: string) => {
    try {
      await contactsService.unblockContact(currentUser, contactId);
      loadContacts();
      setError(null);
    } catch (error) {
      setError('Errore durante lo sblocco del contatto');
    }
  };

  const filteredContacts = contacts.filter(contact =>
    !searchQuery ||
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phoneNumber.includes(searchQuery)
  );

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar */}
      <div className="p-4 theme-bg-primary sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 theme-text opacity-70" />
          <input
            type="text"
            placeholder="Cerca contatti..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg theme-bg-secondary theme-text focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {/* Add Contact Button */}
      <button
        onClick={() => setIsAddingContact(true)}
        className="mx-4 my-2 flex items-center justify-center px-4 py-2 rounded-lg theme-bg-accent theme-text hover:opacity-90 transition-colors"
      >
        <Plus className="w-5 h-5 mr-2" />
        Aggiungi Contatto
      </button>

      {/* Error Message */}
      {error && (
        <div className="mx-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
          {error}
        </div>
      )}

      {/* Add Contact Form */}
      {isAddingContact && (
        <AddContactForm
          onSubmit={handleAddContact}
          onCancel={() => setIsAddingContact(false)}
        />
      )}

      {/* Edit Contact Modal */}
      <EditContactModal
        contact={editingContact}
        isOpen={!!editingContact}
        onClose={() => setEditingContact(null)}
        onSave={handleEditContact}
      />

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto divide-y theme-divide">
        {loading || creatingChat ? (
          <div className="flex items-center justify-center h-32 theme-text">
            {creatingChat ? 'Creazione chat...' : 'Caricamento contatti...'}
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex items-center justify-center h-32 theme-text opacity-70">
            {searchQuery ? 'Nessun contatto trovato' : 'Nessun contatto'}
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <ContactItem
              key={contact.id}
              contact={contact}
              onStartChat={handleStartChat}
              onStartCall={onStartCall}
              onShare={handleShare}
              onEdit={setEditingContact}
              onDelete={handleDeleteContact}
              onBlock={handleBlock}
              onUnblock={handleUnblock}
            />
          ))
        )}
      </div>
    </div>
  );
}