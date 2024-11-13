import React, { useRef, useEffect } from 'react';
import { X, Shield, Clock, Camera, User, Users } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface ChatData {
  type: 'individual' | 'group';
  participants: string[];
  admins?: string[];
  createdAt: any;
  createdBy: string;
}

interface ChatOptions {
  isBlocked: boolean;
  messageTimer: number;
  screenshotPrevention: boolean;
}

interface ChatOptionsProps {
  isOpen: boolean;
  onClose: () => void;
  chatData?: ChatData | null;
  options: ChatOptions;
  onBlock?: () => Promise<void>;
  onUnblock?: () => Promise<void>;
  onSetTimer?: (seconds: number) => Promise<void>;
  onToggleScreenshotPrevention?: () => Promise<void>;
}

export default function ChatOptions({
  isOpen,
  onClose,
  chatData,
  options,
  onBlock,
  onUnblock,
  onSetTimer,
  onToggleScreenshotPrevention
}: ChatOptionsProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [showTimerOptions, setShowTimerOptions] = React.useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
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

  const timerOptions = [
    { label: 'Disattivato', value: 0 },
    { label: '5 secondi', value: 5 },
    { label: '10 secondi', value: 10 },
    { label: '30 secondi', value: 30 },
    { label: '1 minuto', value: 60 }
  ];

  const isGroup = chatData?.type === 'group';

  const formatCreatedAt = (date: any) => {
    if (!date || !date.toDate) return 'Data non disponibile';
    try {
      return format(date.toDate(), 'dd/MM/yyyy', { locale: it });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Data non disponibile';
    }
  };

  return (
    <div
      className={`fixed inset-y-0 right-0 w-80 theme-bg-primary shadow-xl transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } z-50`}
      ref={sidebarRef}
    >
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b theme-divide">
        <h3 className="font-semibold theme-text">
          {isGroup ? 'Impostazioni gruppo' : 'Impostazioni chat'}
        </h3>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:theme-bg-secondary"
        >
          <X className="w-5 h-5 theme-text" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Chat/Group Info */}
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            {isGroup ? (
              <Users className="w-5 h-5 text-blue-500" />
            ) : (
              <User className="w-5 h-5 text-blue-500" />
            )}
            <div>
              <span className="font-medium theme-text">
                {isGroup ? 'Gruppo' : 'Chat individuale'}
              </span>
              {chatData && (
                <p className="text-sm theme-text opacity-70">
                  Creato il {formatCreatedAt(chatData.createdAt)}
                </p>
              )}
            </div>
          </div>
          {isGroup && chatData && (
            <p className="text-sm theme-text opacity-70 ml-8">
              {chatData.participants.length} partecipanti
            </p>
          )}
        </div>

        {/* Block/Unblock (solo per chat individuali) */}
        {!isGroup && onBlock && onUnblock && (
          <div>
            <button
              onClick={options.isBlocked ? onUnblock : onBlock}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg ${
                options.isBlocked
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              } text-white transition-colors`}
            >
              <Shield className="w-5 h-5" />
              <span>{options.isBlocked ? 'Sblocca utente' : 'Blocca utente'}</span>
            </button>
          </div>
        )}

        {/* Message Timer */}
        {onSetTimer && !isGroup && (
          <div className="space-y-2">
            <button
              onClick={() => setShowTimerOptions(!showTimerOptions)}
              className="w-full flex items-center justify-between p-3 rounded-lg theme-bg-secondary hover:opacity-90 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="theme-text">Timer messaggi</span>
              </div>
              <span className="text-sm theme-text opacity-70">
                {options.messageTimer === 0 ? 'Disattivato' : `${options.messageTimer}s`}
              </span>
            </button>

            {showTimerOptions && (
              <div className="space-y-1 ml-8">
                {timerOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onSetTimer(option.value);
                      setShowTimerOptions(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded theme-text ${
                      options.messageTimer === option.value
                        ? 'bg-blue-600'
                        : 'hover:theme-bg-secondary'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Screenshot Prevention */}
        {onToggleScreenshotPrevention && !isGroup && (
          <div>
            <button
              onClick={onToggleScreenshotPrevention}
              className="w-full flex items-center justify-between p-3 rounded-lg theme-bg-secondary hover:opacity-90 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Camera className="w-5 h-5 text-blue-500" />
                <span className="theme-text">Previeni screenshot</span>
              </div>
              <span className="text-sm theme-text opacity-70">
                {options.screenshotPrevention ? 'Attivo' : 'Disattivo'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}