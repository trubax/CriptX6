import React, { useState } from 'react';
import { X } from 'lucide-react';

interface AddContactFormProps {
  onSubmit: (data: { name: string; phoneNumber: string; email?: string }) => void;
  onCancel: () => void;
}

export default function AddContactForm({ onSubmit, onCancel }: AddContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.phoneNumber) {
      onSubmit({
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        email: formData.email || undefined
      });
    }
  };

  return (
    <div className="mx-4 mb-4 p-4 rounded-lg theme-bg-primary">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium theme-text">Nuovo Contatto</h3>
        <button
          onClick={onCancel}
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
            onClick={onCancel}
            className="flex-1 py-2 rounded-md theme-bg-secondary theme-text hover:opacity-90 transition-colors"
          >
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
}