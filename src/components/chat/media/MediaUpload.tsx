import React, { useRef, useState } from 'react';
import { Image, FileText, Film, Mic, X, Loader2, Send } from 'lucide-react';

interface MediaUploadProps {
  onFileSelect: (file: File, type: 'photo' | 'video' | 'audio' | 'document') => Promise<void>;
  onClose: () => void;
  isUploading?: boolean;
}

interface FilePreview {
  file: File;
  type: 'photo' | 'video' | 'audio' | 'document';
  preview?: string;
}

export default function MediaUpload({ onFileSelect, onClose, isUploading }: MediaUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FilePreview | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    const type = file.type.startsWith('image/')
      ? 'photo'
      : file.type.startsWith('video/')
      ? 'video'
      : file.type.startsWith('audio/')
      ? 'audio'
      : 'document';

    let preview: string | undefined;
    if (type === 'photo') {
      preview = URL.createObjectURL(file);
    }

    setSelectedFile({ file, type, preview });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;
    handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      await onFileSelect(selectedFile.file, selectedFile.type);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const uploadTypes = [
    { icon: Image, label: 'Foto', accept: 'image/*' },
    { icon: Film, label: 'Video', accept: 'video/*' },
    { icon: Mic, label: 'Audio', accept: 'audio/*' },
    { icon: FileText, label: 'Documento', accept: '.pdf,.doc,.docx,.txt,.xls,.xlsx' }
  ];

  const renderPreview = () => {
    if (!selectedFile) return null;

    switch (selectedFile.type) {
      case 'photo':
        return (
          <img
            src={selectedFile.preview}
            alt="Anteprima"
            className="max-h-[200px] rounded-lg object-contain mx-auto"
          />
        );
      case 'video':
        return (
          <video
            src={URL.createObjectURL(selectedFile.file)}
            controls
            className="max-h-[200px] rounded-lg mx-auto"
          />
        );
      case 'audio':
        return (
          <audio
            src={URL.createObjectURL(selectedFile.file)}
            controls
            className="w-full"
          />
        );
      case 'document':
        return (
          <div className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg">
            <FileText className="w-8 h-8 text-blue-400" />
            <div className="flex-1 truncate">
              <p className="font-medium text-white truncate">{selectedFile.file.name}</p>
              <p className="text-sm text-gray-400">
                {(selectedFile.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="relative w-full max-w-md bg-gray-800 rounded-lg p-6">
        <button
          onClick={onClose}
          disabled={isUploading}
          className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-medium text-white mb-4">
          {selectedFile ? 'Anteprima file' : 'Carica file'}
        </h3>

        {selectedFile ? (
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-4">
              {renderPreview()}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedFile(null)}
                disabled={isUploading}
                className="flex-1 py-2 px-4 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cambia file
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 py-2 px-4 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Invio...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Invia</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-8 text-center mb-4 transition-colors ${
                dragOver
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
              />
              <div className="space-y-2">
                <p className="text-gray-400">
                  Trascina qui i tuoi file o
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-500 hover:text-blue-400 ml-1"
                  >
                    sfoglia
                  </button>
                </p>
                <p className="text-gray-500 text-sm">
                  Supporta immagini, video, audio e documenti
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {uploadTypes.map(({ icon: Icon, label, accept }) => (
                <button
                  key={label}
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = accept;
                      fileInputRef.current.click();
                    }
                  }}
                  disabled={isUploading}
                  className="flex items-center justify-center gap-2 p-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}