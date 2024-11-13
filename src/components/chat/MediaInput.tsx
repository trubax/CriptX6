import React, { useRef } from 'react';
import { Camera, Paperclip, Loader2 } from 'lucide-react';

interface MediaInputProps {
  onMediaSelect: (file: File) => Promise<void>;
  disabled?: boolean;
  isUploading?: boolean;
}

export default function MediaInput({ onMediaSelect, disabled, isUploading }: MediaInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      await onMediaSelect(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error selecting file:', error);
    }
  };

  return (
    <div className="flex space-x-2">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
        className="hidden"
      />
      
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className="p-2 hover:theme-bg-secondary rounded-full transition-colors disabled:opacity-50 theme-text min-w-[40px]"
        title="Allega file"
      >
        {isUploading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Paperclip className="w-5 h-5" />
        )}
      </button>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className="p-2 hover:theme-bg-secondary rounded-full transition-colors disabled:opacity-50 theme-text min-w-[40px]"
        title="Scatta foto"
      >
        <Camera className="w-5 h-5" />
      </button>
    </div>
  );
}