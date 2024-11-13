import React, { useState, useRef } from 'react';
import { Camera, Image, File, Mic, Video, X } from 'lucide-react';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import AudioRecorder from './AudioRecorder';
import CameraModal from './CameraModal';
import MediaUpload from './MediaUpload';

interface AttachmentMenuProps {
  onFileSelect: (file: File, type: 'photo' | 'video' | 'audio' | 'document') => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
  isUploading?: boolean;
}

export default function AttachmentMenu({ onFileSelect, onClose, isOpen, isUploading }: AttachmentMenuProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [showCamera, setShowCamera] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [uploadType, setUploadType] = useState<'photo' | 'video' | 'document' | null>(null);

  const handleMediaCapture = async (file: File, type: 'photo' | 'video') => {
    await onFileSelect(file, type);
    setShowCamera(false);
    onClose();
  };

  const handleUploadClick = (type: 'photo' | 'video' | 'document') => {
    setUploadType(type);
    setShowMediaUpload(true);
  };

  if (!isOpen) return null;

  if (showCamera) {
    return (
      <CameraModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleMediaCapture}
      />
    );
  }

  if (showMediaUpload) {
    return (
      <MediaUpload
        onFileSelect={onFileSelect}
        onClose={() => {
          setShowMediaUpload(false);
          setUploadType(null);
        }}
        isUploading={isUploading}
      />
    );
  }

  return (
    <>
      {isMobile ? (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-x-0 bottom-0 animate-in slide-in-from-bottom duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-t-xl shadow-xl">
              <div className="p-4 border-b dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold theme-text">Allega file</h3>
                  <button 
                    onClick={onClose}
                    className="p-2 rounded-full hover:theme-bg-secondary"
                  >
                    <X className="w-6 h-6 theme-text" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4 p-4">
                <button
                  onClick={() => setShowCamera(true)}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="p-4 rounded-full bg-blue-500 text-white">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-sm theme-text">Fotocamera</span>
                </button>

                <button
                  onClick={() => handleUploadClick('photo')}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="p-4 rounded-full bg-green-500 text-white">
                    <Image className="w-6 h-6" />
                  </div>
                  <span className="text-sm theme-text">Galleria</span>
                </button>

                <button
                  onClick={() => handleUploadClick('document')}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="p-4 rounded-full bg-purple-500 text-white">
                    <File className="w-6 h-6" />
                  </div>
                  <span className="text-sm theme-text">File</span>
                </button>

                <button
                  onClick={() => handleUploadClick('video')}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="p-4 rounded-full bg-red-500 text-white">
                    <Video className="w-6 h-6" />
                  </div>
                  <span className="text-sm theme-text">Video</span>
                </button>
              </div>

              <div className="p-4 border-t dark:border-gray-700">
                <AudioRecorder onRecordingComplete={(file) => onFileSelect(file, 'audio')} />
              </div>
            </div>
          </div>
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
        </div>
      ) : (
        <div className="absolute bottom-full mb-2 left-4 bg-white dark:bg-gray-800 
          rounded-lg shadow-xl overflow-hidden animate-in slide-in-from-bottom duration-200">
          <div className="p-2 grid grid-cols-1 gap-1 w-48">
            <button
              onClick={() => setShowCamera(true)}
              className="flex items-center gap-3 p-2 hover:theme-bg-secondary rounded-lg transition-colors"
            >
              <Camera className="w-5 h-5 theme-text" />
              <span className="text-sm theme-text">Fotocamera</span>
            </button>

            <button
              onClick={() => handleUploadClick('photo')}
              className="flex items-center gap-3 p-2 hover:theme-bg-secondary rounded-lg transition-colors"
            >
              <Image className="w-5 h-5 theme-text" />
              <span className="text-sm theme-text">Galleria</span>
            </button>

            <button
              onClick={() => handleUploadClick('document')}
              className="flex items-center gap-3 p-2 hover:theme-bg-secondary rounded-lg transition-colors"
            >
              <File className="w-5 h-5 theme-text" />
              <span className="text-sm theme-text">File</span>
            </button>

            <button
              onClick={() => handleUploadClick('video')}
              className="flex items-center gap-3 p-2 hover:theme-bg-secondary rounded-lg transition-colors"
            >
              <Video className="w-5 h-5 theme-text" />
              <span className="text-sm theme-text">Video</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
} 