import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Contact } from '../../services/ContactsService';

interface EditContactModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Contact>) => void;
}

export default function EditContactModal({
  contact,
  isOpen,
  onClose,
  onSave
}: EditContactModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: ''
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        phoneNumber: contact.phoneNumber,
        email: contact.email || ''
      });
    }
  }, [contact]);

  if (!isOpen || !contact) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Partial<Contact> = {};
    
    if (formData.name !== contact.name) updates.name = formData.name;
    if (formData.phoneNumber !== contact.phoneNumber) updates.phoneNumber = formData.phoneNumber;
    if (formData.email !== contact.email) updates.email = formData.email || null;

    if (Object.keys(updates).length > 0) {
      onSave(updates);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="w-full max-w-md mx-4 p-6 rounded-lg theme-bg-primary">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium theme-text">Modifica Contatto</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:theme-bg-secondary"
          >
            <X className="w-5 h-5 theme-text" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium theme-text mb-1">
              Nome *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-md theme-bg-secondary theme-text focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium theme-text mb-1">
              Numero di telefono *
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full px-3 py-2 rounded-md theme-bg-secondary theme-text focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium theme-text mb-1">
              Email (opzionale)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 rounded-md theme-bg-secondary theme-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 py-2 rounded-md theme-bg-accent theme-text hover:opacity-90 transition-colors"
            >
              Salva
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-md theme-bg-secondary theme-text hover:opacity-90 transition-colors"
            >
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}