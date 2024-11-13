import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import { useCreateChat } from '../../hooks/useCreateChat';
import { useNavigate } from 'react-router-dom';

interface StartChatModalProps {
  recipientId: string;
  recipientName: string;
  isGroup?: boolean;
  participants?: string[];
  onClose: () => void;
}

export default function StartChatModal({ 
  recipientId, 
  recipientName,
  isGroup,
  participants = [],
  onClose 
}: StartChatModalProps) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { createChatWithMessage, createGroupWithMessage, loading } = useCreateChat();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    try {
      setError(null);
      let chatPreview;

      if (isGroup) {
        chatPreview = await createGroupWithMessage(recipientName, participants, message);
      } else {
        chatPreview = await createChatWithMessage(recipientId, message);
      }

      navigate('/chat', { state: { selectedChat: chatPreview, openChat: true } });
      onClose();
    } catch (err: any) {
      console.error('Error starting chat:', err);
      setError(err.message || 'Errore durante l\'avvio della chat');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md theme-bg-primary rounded-lg shadow-xl">
        <div className="p-4 border-b theme-divide flex justify-between items-center">
          <h3 className="text-lg font-medium theme-text">
            {isGroup ? 'Crea gruppo' : 'Nuova chat'} con {recipientName}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:theme-bg-secondary"
          >
            <X className="w-5 h-5 theme-text" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium theme-text opacity-70 mb-2">
              Scrivi il primo messaggio per iniziare
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 theme-bg-secondary theme-text rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              rows={4}
              placeholder="Scrivi un messaggio..."
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg theme-bg-secondary theme-text hover:opacity-90"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={!message.trim() || loading}
              className="px-4 py-2 rounded-lg theme-bg-accent theme-text hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Invio...' : 'Invia e inizia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}