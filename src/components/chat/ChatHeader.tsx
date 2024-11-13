import React from 'react';
import { ArrowLeft, MoreVertical, Phone, Video, Timer } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface ChatHeaderProps {
  chat: {
    name: string;
    photoURL: string;
    status?: string;
    lastSeen?: Date | string;
    isGroup?: boolean;
  };
  onClose: () => void;
  onStartCall: (isVideo: boolean) => void;
  onShowOptions: () => void;
  isCallActive: boolean;
  options: {
    isBlocked: boolean;
    messageTimer: number;
  };
  onSetMessageTimer?: (seconds: number) => Promise<void>;
}

export default function ChatHeader({
  chat,
  onClose,
  onStartCall,
  onShowOptions,
  isCallActive,
  options,
  onSetMessageTimer
}: ChatHeaderProps) {
  const [showTimerMenu, setShowTimerMenu] = React.useState(false);

  const timerOptions = [
    { label: 'Disattiva', value: 0 },
    { label: '10 secondi', value: 10 },
    { label: '30 secondi', value: 30 },
    { label: '60 secondi', value: 60 }
  ];

  const getStatusText = () => {
    if (chat.isGroup) return 'Gruppo';
    if (options.isBlocked) return 'Bloccato';
    return chat.status === 'online' ? 'Online' : chat.lastSeen ? `Ultimo accesso ${formatLastSeen(chat.lastSeen)}` : 'Offline';
  };

  const formatLastSeen = (lastSeen?: Date | string) => {
    if (!lastSeen) return '';
    if (typeof lastSeen === 'string') return lastSeen;
    return format(lastSeen, 'dd/MM/yyyy HH:mm', { locale: it });
  };

  return (
    <div className="theme-bg-primary p-4 flex items-center space-x-4 shadow-md">
      <button
        onClick={onClose}
        className="p-2 hover:theme-bg-secondary rounded-full transition-colors theme-text"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="flex-1 flex items-center">
        <img
          src={chat.photoURL}
          alt={chat.name}
          className="w-10 h-10 rounded-full"
        />
        <div className="ml-3">
          <h2 className="font-semibold theme-text">
            {chat.name}
          </h2>
          <p className="text-sm theme-text opacity-70">
            {getStatusText()}
          </p>
        </div>
      </div>

      {!chat.isGroup && onSetMessageTimer && (
        <div className="relative">
          <button
            onClick={() => setShowTimerMenu(!showTimerMenu)}
            className={`p-2 rounded-full transition-colors ${
              options.messageTimer > 0
                ? 'theme-bg-accent theme-text'
                : 'hover:theme-bg-secondary theme-text opacity-70 hover:opacity-100'
            }`}
            title={options.messageTimer > 0 ? `Timer: ${options.messageTimer}s` : 'Imposta timer autodistruzione'}
          >
            <Timer className="w-5 h-5" />
          </button>

          {showTimerMenu && (
            <div className="absolute top-full right-0 mt-1 w-40 theme-bg-primary rounded-lg shadow-lg overflow-hidden z-50">
              {timerOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSetMessageTimer(option.value);
                    setShowTimerMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    options.messageTimer === option.value
                      ? 'theme-bg-accent theme-text'
                      : 'theme-text hover:theme-bg-secondary'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!chat.isGroup && (
        <>
          <button
            onClick={() => onStartCall(false)}
            disabled={isCallActive || options.isBlocked || chat.status !== 'online'}
            className={`p-2 rounded-full transition-colors hover:theme-bg-secondary
            ${isCallActive ? 'text-red-500' : 'text-green-500'} 
            disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            onClick={() => onStartCall(true)}
            disabled={isCallActive || options.isBlocked || chat.status !== 'online'}
            className={`p-2 rounded-full transition-colors hover:theme-bg-secondary
            ${isCallActive ? 'text-red-500' : 'text-blue-500'}
            disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Video className="w-5 h-5" />
          </button>
        </>
      )}

      <button 
        onClick={onShowOptions}
        className="p-2 hover:theme-bg-secondary rounded-full transition-colors theme-text"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
    </div>
  );
}