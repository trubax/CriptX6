import React, { useState } from 'react';
import { Paperclip } from 'lucide-react';
import AttachmentMenu from './media/AttachmentMenu';

interface ChatInputProps {
  handleFileSelect: (file: File, type: 'photo' | 'video' | 'audio' | 'document') => Promise<void>;
  isUploading?: boolean;
}

export default function ChatInput({ handleFileSelect, isUploading }: ChatInputProps) {
  const [showAttachments, setShowAttachments] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowAttachments(true)}
        className="p-2 hover:theme-bg-secondary rounded-full transition-colors"
      >
        <Paperclip className="w-6 h-6 theme-text" />
      </button>

      <AttachmentMenu
        isOpen={showAttachments}
        onClose={() => setShowAttachments(false)}
        onFileSelect={handleFileSelect}
        isUploading={isUploading}
      />
    </>
  );
} 