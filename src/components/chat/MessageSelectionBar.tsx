import React from 'react';
import { X, Trash2 } from 'lucide-react';

interface MessageSelectionBarProps {
  selectedCount: number;
  onCancelSelection: () => void;
  onDeleteSelected: (deleteForEveryone: boolean) => Promise<void>;
  canDeleteForEveryone: boolean;
  isDeleting: boolean;
}

export default function MessageSelectionBar({
  selectedCount,
  onCancelSelection,
  onDeleteSelected,
  canDeleteForEveryone,
  isDeleting
}: MessageSelectionBarProps) {
  return (
    <div className="fixed top-16 left-0 right-0 theme-bg-primary border-b theme-divide z-50 animate-slide-down">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancelSelection}
            className="p-2 rounded-full hover:theme-bg-secondary"
          >
            <X className="w-5 h-5 theme-text" />
          </button>
          <span className="theme-text font-medium">
            {selectedCount} {selectedCount === 1 ? 'messaggio' : 'messaggi'} selezionato{selectedCount === 1 ? '' : 'i'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDeleteSelected(false)}
            disabled={isDeleting}
            className="px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Elimina per me</span>
          </button>
          {canDeleteForEveryone && (
            <button
              onClick={() => onDeleteSelected(true)}
              disabled={isDeleting}
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              <span>Elimina per tutti</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}