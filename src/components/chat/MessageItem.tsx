import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { FileText, Play, Pause, Download, Copy, Share, Trash2, X, Loader2, ExternalLink, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface MessageItemProps {
  id: string;
  text: string;
  timestamp: any;
  senderId: string;
  isMe: boolean;
  senderPhoto: string;
  senderName: string;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video' | 'audio' | 'document';
  fileName?: string;
  onDelete?: (messageId: string, deleteForEveryone: boolean) => Promise<void>;
  isGroupChat?: boolean;
  isAdmin?: boolean;
  isGroupCreator?: boolean;
  readBy?: string[];
  deliveredTo?: string[];
}

export default function MessageItem({
  id,
  text,
  timestamp,
  senderId,
  isMe,
  senderPhoto,
  senderName,
  mediaUrl,
  mediaType,
  fileName,
  onDelete,
  isGroupChat,
  isAdmin,
  isGroupCreator,
  readBy = [],
  deliveredTo = []
}: MessageItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [showFullImage, setShowFullImage] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { currentUser } = useAuth();
  const [menuPosition, setMenuPosition] = useState<'bottom' | 'top'>('bottom');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu || showDeleteOptions) {
        const isClickOutsideMessage = messageRef.current && !messageRef.current.contains(event.target as Node);
        const isClickOutsideMenu = menuRef.current && !menuRef.current.contains(event.target as Node);
        
        if (isClickOutsideMessage && isClickOutsideMenu) {
          setShowMenu(false);
          setShowDeleteOptions(false);
        }
      }
    };

    if (showMenu || showDeleteOptions) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showMenu, showDeleteOptions]);

  const calculateMenuPosition = () => {
    if (!messageRef.current) return;
    
    const messageRect = messageRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const spaceBelow = windowHeight - messageRect.bottom;
    
    setMenuPosition(spaceBelow < 200 ? 'top' : 'bottom');
  };

  const handleMessageClick = () => {
    if (!showDeleteOptions) {
      calculateMenuPosition();
      setShowMenu(!showMenu);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setShowMenu(false);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          text: text,
          title: 'Messaggio da ' + senderName,
          ...(mediaUrl && { url: mediaUrl })
        });
      } else {
        await navigator.clipboard.writeText(text);
        alert('Messaggio copiato negli appunti!');
      }
      setShowMenu(false);
    } catch (error) {
      console.error('Errore durante la condivisione:', error);
    }
  };

  const handleDelete = async (deleteForEveryone: boolean) => {
    if (!onDelete) return;
    
    try {
      setIsDeleting(true);
      await onDelete(id, deleteForEveryone);
      setShowDeleteOptions(false);
      setShowMenu(false);
    } catch (error: any) {
      console.error('Error deleting message:', error);
      alert(error.message || 'Errore durante l\'eliminazione del messaggio');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const canDeleteForEveryone = isMe || isAdmin || isGroupCreator;

  const renderDeliveryStatus = () => {
    if (!isMe) return null;

    if (readBy.length > 0) {
      return <Check className="w-4 h-4 text-blue-500" />;
    }

    if (deliveredTo.length > 0) {
      return <Check className="w-4 h-4 text-gray-500" />;
    }

    return <Check className="w-4 h-4 text-gray-400 opacity-50" />;
  };

  const renderMedia = () => {
    if (!mediaUrl) return null;

    const handleMediaLoad = () => setIsMediaLoading(false);

    switch (mediaType) {
      case 'photo':
        return (
          <div className="relative group">
            <div className={`relative ${isMediaLoading ? 'min-h-[200px] bg-gray-700 animate-pulse rounded-lg' : ''}`}>
              <img
                src={mediaUrl}
                alt={fileName || 'Immagine'}
                className={`rounded-lg max-w-full max-h-[300px] object-contain ${isMediaLoading ? 'invisible' : ''}`}
                onLoad={handleMediaLoad}
              />
              {isMediaLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFullImage(true);
              }}
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
            >
              <ExternalLink className="w-6 h-6 text-white" />
            </button>
          </div>
        );

      case 'video':
        return (
          <div className={`relative ${isMediaLoading ? 'min-h-[200px] bg-gray-700 animate-pulse rounded-lg' : ''}`}>
            <video
              src={mediaUrl}
              controls
              className={`rounded-lg max-w-full max-h-[300px] ${isMediaLoading ? 'invisible' : ''}`}
              onLoadedData={handleMediaLoad}
            />
            {isMediaLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="flex items-center gap-3 bg-gray-700/30 p-3 rounded-lg">
            <button
              onClick={toggleAudio}
              className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <audio
              ref={audioRef}
              src={mediaUrl}
              onEnded={() => setIsPlaying(false)}
              onLoadedData={handleMediaLoad}
              className="hidden"
            />
            <div className="flex-1">
              <span className="text-sm opacity-70">Messaggio vocale</span>
              {isMediaLoading && (
                <div className="h-1 bg-gray-600 rounded-full mt-1">
                  <div className="h-full w-1/3 bg-blue-500 rounded-full animate-pulse" />
                </div>
              )}
            </div>
          </div>
        );

      case 'document':
        return (
          <div className="flex items-center gap-3 bg-gray-700/30 p-3 rounded-lg">
            <FileText className="w-5 h-5 text-blue-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fileName}</p>
              <p className="text-xs opacity-70">Documento</p>
            </div>
            <a
              href={mediaUrl}
              download={fileName}
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-full hover:bg-gray-600/50 transition-colors"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
        );
    }
  };

  return (
    <div
      ref={messageRef}
      className={`relative flex items-end space-x-2 mb-6 ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}
    >
      <img
        src={senderPhoto}
        alt={senderName}
        className="w-8 h-8 rounded-full flex-shrink-0"
      />
      <div className="relative max-w-[70%]">
        {isGroupChat && !isMe && (
          <span className="text-xs theme-text opacity-70 mb-1 block">
            {senderName}
          </span>
        )}
        <div
          onClick={handleMessageClick}
          className={`rounded-lg p-3 cursor-pointer transition-all duration-200
            ${isMe ? 'theme-bg-accent theme-text' : 'theme-bg-secondary theme-text'}
            ${(showMenu || showDeleteOptions) ? 'ring-2 ring-blue-500 shadow-lg scale-[1.02]' : ''}
            hover:shadow-md hover:scale-[1.01]`}
        >
          {renderMedia()}
          {text && <p className={mediaUrl ? 'mt-2' : ''}>{text}</p>}
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs theme-text opacity-70">
              {timestamp?.toDate ? format(timestamp.toDate(), 'HH:mm') : ''}
            </span>
            {renderDeliveryStatus()}
          </div>
        </div>

        {showMenu && !showDeleteOptions && (text || mediaUrl) && (
          <div 
            ref={menuRef}
            className={`absolute ${isMe ? 'right-0' : 'left-0'} 
              ${menuPosition === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'} 
              w-48 rounded-lg shadow-xl theme-bg-primary overflow-hidden z-[60] 
              animate-in fade-in slide-in`}
          >
            <div className="p-1">
              {text && (
                <>
                  <button
                    onClick={handleCopy}
                    className="flex items-center w-full px-3 py-2 rounded-md text-sm theme-text hover:theme-bg-secondary"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copia
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center w-full px-3 py-2 rounded-md text-sm theme-text hover:theme-bg-secondary"
                  >
                    <Share className="w-4 h-4 mr-2" />
                    Condividi
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setShowDeleteOptions(true);
                  setShowMenu(false);
                }}
                className="flex items-center w-full px-3 py-2 rounded-md text-sm text-red-500 hover:theme-bg-secondary"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Elimina
              </button>
            </div>
          </div>
        )}

        {showDeleteOptions && (
          <div className={`absolute ${isMe ? 'right-0' : 'left-0'} 
            ${menuPosition === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'} 
            w-56 rounded-lg shadow-xl theme-bg-primary overflow-hidden z-[60]
            animate-menu-slide`}
          >
            <div className="p-1">
              <button
                onClick={() => handleDelete(false)}
                disabled={isDeleting}
                className="flex items-center w-full px-3 py-2 rounded-md text-sm text-red-500 hover:theme-bg-secondary disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? 'Eliminazione...' : 'Elimina per me'}
              </button>
              {canDeleteForEveryone && (
                <button
                  onClick={() => handleDelete(true)}
                  disabled={isDeleting}
                  className="flex items-center w-full px-3 py-2 rounded-md text-sm text-red-600 hover:theme-bg-secondary disabled:opacity-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  {isDeleting ? 'Eliminazione...' : 'Elimina per tutti'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showFullImage && mediaType === 'photo' && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setShowFullImage(false)}
        >
          <img
            src={mediaUrl}
            alt={fileName || 'Immagine'}
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={() => setShowFullImage(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-800/50 text-white hover:bg-gray-700/50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}