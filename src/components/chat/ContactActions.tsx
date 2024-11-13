import React, { useRef, useEffect } from 'react';
import { Edit, Trash2, Shield, ShieldOff, Share2 } from 'lucide-react';
import type { Contact } from '../../services/ContactsService';

interface ContactActionsProps {
  contact: Contact;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
  onToggleBlock: (contactId: string) => void;
  onShare: (contact: Contact) => void;
}

export default function ContactActions({
  contact,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleBlock,
  onShare
}: ContactActionsProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-1 w-48 rounded-lg shadow-xl theme-bg-primary overflow-hidden z-50"
    >
      <div className="py-1">
        <button
          onClick={() => {
            onEdit(contact);
            onClose();
          }}
          className="flex items-center w-full px-4 py-3 text-sm theme-text hover:theme-bg-secondary transition-colors"
        >
          <Edit className="w-4 h-4 mr-3" />
          Modifica
        </button>
        <button
          onClick={() => {
            onToggleBlock(contact.id);
            onClose();
          }}
          className="flex items-center w-full px-4 py-3 text-sm theme-text hover:theme-bg-secondary transition-colors"
        >
          {contact.isBlocked ? (
            <>
              <ShieldOff className="w-4 h-4 mr-3" />
              Sblocca
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-3" />
              Blocca
            </>
          )}
        </button>
        {!contact.isRegistered && (
          <button
            onClick={() => {
              onShare(contact);
              onClose();
            }}
            className="flex items-center w-full px-4 py-3 text-sm theme-text hover:theme-bg-secondary transition-colors"
          >
            <Share2 className="w-4 h-4 mr-3" />
            Invita su CriptX
          </button>
        )}
        <button
          onClick={() => {
            onDelete(contact.id);
            onClose();
          }}
          className="flex items-center w-full px-4 py-3 text-sm text-red-500 hover:theme-bg-secondary transition-colors"
        >
          <Trash2 className="w-4 h-4 mr-3" />
          Elimina
        </button>
      </div>
    </div>
  );
}