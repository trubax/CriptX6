import React, { useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import Header from '../components/chat/Header';
import ContactItem from '../components/chat/ContactItem';
import AddContactForm from '../components/chat/AddContactForm';
import EditContactModal from '../components/chat/EditContactModal';
import { useContacts } from '../hooks/useContacts';
import { useAuth } from '../contexts/AuthContext';
import { Contact } from '../services/ContactsService';

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const {
    contacts,
    loading,
    error: contactsError,
    addContact,
    updateContact,
    deleteContact,
    blockContact,
    unblockContact,
    searchContacts,
    refreshContacts
  } = useContacts();

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    try {
      if (query.trim()) {
        await searchContacts(query);
      } else {
        await refreshContacts();
      }
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Errore durante la ricerca');
    }
  };

  const handleAddContact = async (data: { name: string; phoneNumber: string; email?: string }) => {
    try {
      setError(null);
      await addContact(data);
      setIsAddingContact(false);
      setSuccessMessage('Contatto aggiunto con successo');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Errore durante l\'aggiunta del contatto');
    }
  };

  const handleEditContact = async (updates: Partial<Contact>) => {
    if (!editingContact) return;

    try {
      setError(null);
      await updateContact(editingContact.id, updates);
      setEditingContact(null);
      setSuccessMessage('Contatto aggiornato con successo');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Errore durante la modifica del contatto');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo contatto?')) return;

    try {
      setError(null);
      await deleteContact(contactId);
      setSuccessMessage('Contatto eliminato con successo');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Errore durante l\'eliminazione del contatto');
    }
  };

  const handleShare = async (contact: Contact) => {
    try {
      const shareData = {
        title: 'Unisciti a CriptX',
        text: `Ciao! Unisciti a me su CriptX, un'app di messaggistica sicura.`,
        url: `https://criptx.app/invite?ref=${currentUser?.uid}`
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        const shareUrl = `whatsapp://send?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`;
        window.open(shareUrl);
      }
      setError(null);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setError('Errore durante la condivisione');
      }
    }
  };

  const handleBlock = async (contactId: string) => {
    try {
      setError(null);
      await blockContact(contactId);
      setSuccessMessage('Contatto bloccato');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Errore durante il blocco del contatto');
    }
  };

  const handleUnblock = async (contactId: string) => {
    try {
      setError(null);
      await unblockContact(contactId);
      setSuccessMessage('Contatto sbloccato');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Errore durante lo sblocco del contatto');
    }
  };

  const filteredContacts = contacts
    .filter(contact =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phoneNumber.includes(searchQuery) ||
      (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      // Prima i contatti online
      if (a.status === 'online' && b.status !== 'online') return -1;
      if (a.status !== 'online' && b.status === 'online') return 1;
      // Poi i contatti registrati
      if (a.isRegistered && !b.isRegistered) return -1;
      if (!a.isRegistered && b.isRegistered) return 1;
      // Infine ordine alfabetico
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="min-h-screen theme-bg">
      <Header />
      
      <div className="pt-16 px-4 pb-20">
        <div className="sticky top-16 z-10 py-2 theme-bg space-y-2">
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

          <button
            onClick={() => setIsAddingContact(true)}
            className="w-full py-2 rounded-lg theme-bg-accent theme-text hover:opacity-90 transition-colors"
          >
            Aggiungi Contatto
          </button>
        </div>

        {(error || contactsError) && (
          <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-500">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error || contactsError}</p>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2 text-green-500">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{successMessage}</p>
          </div>
        )}

        {isAddingContact && (
          <AddContactForm
            onSubmit={handleAddContact}
            onCancel={() => setIsAddingContact(false)}
          />
        )}

        <EditContactModal
          contact={editingContact}
          isOpen={!!editingContact}
          onClose={() => setEditingContact(null)}
          onSave={handleEditContact}
        />

        <div className="mt-4 divide-y theme-divide">
          {loading ? (
            <div className="flex items-center justify-center h-32 theme-text">
              Caricamento contatti...
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 theme-text opacity-70">
              <p>{searchQuery ? 'Nessun contatto trovato' : 'Nessun contatto'}</p>
              <p className="text-sm mt-1">
                {searchQuery ? 'Prova con una ricerca diversa' : 'Aggiungi nuovi contatti per iniziare'}
              </p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <ContactItem
                key={contact.id}
                contact={contact}
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
    </div>
  );
}