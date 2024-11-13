import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, MoreVertical, Phone, Video, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useTheme } from '../contexts/ThemeContext';
import ChatOptions from './chat/ChatOptions';
import MediaInput from './chat/MediaInput';
import MessageItem from './chat/MessageItem';
import { useChat } from '../hooks/useChat';
import { CallService } from '../services/CallService';
import { useAuth } from '../contexts/AuthContext';
import AudioRecorder from './chat/AudioRecorder';

interface ChatViewProps {
  chat: {
    id: string;
    name: string;
    photoURL: string;
    status?: string;
    lastSeen?: Date | string;
    isGroup?: boolean;
    participants?: string[];
    isTyping?: boolean;
  };
  onClose: () => void;
}

export default function ChatView({ chat, onClose }: ChatViewProps) {
  const { theme } = useTheme();
  const [message, setMessage] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  const callService = new CallService();

  const {
    messages,
    chatData,
    options,
    loading,
    error,
    sendMessage,
    deleteMessage,
    markAsRead,
    setMessageTimer
  } = useChat(chat.id);

  useEffect(() => {
    scrollToBottom();
    markAsRead();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || options.isBlocked || isUploading || isRecording) return;
    
    try {
      setSendError(null);
      const tempId = Date.now().toString();
      
      // Aggiungi un messaggio temporaneo con stato 'sending'
      const tempMessage = {
        id: tempId,
        text: message.trim(),
        timestamp: new Date(),
        isMe: true,
        status: 'sending' as const,
        senderPhoto: currentUser?.photoURL || '',
        senderName: currentUser?.displayName || ''
      };

      // Invia il messaggio
      await sendMessage(message.trim());
      setMessage('');
    } catch (err: any) {
      console.error('Error sending message:', err);
      setSendError(err.message || 'Errore nell\'invio del messaggio');
    }
  };

  const handleMediaSend = async (file: File) => {
    try {
      setIsUploading(true);
      setSendError(null);
      await sendMessage('', file);
    } catch (err: any) {
      console.error('Error sending media:', err);
      setSendError(err.message || 'Errore nell\'invio del file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAudioSend = async (audioFile: File) => {
    try {
      setSendError(null);
      await sendMessage('', audioFile);
    } catch (err: any) {
      console.error('Error sending audio:', err);
      setSendError(err.message || 'Errore nell\'invio del messaggio vocale');
    }
  };

  const handleStartCall = async (isVideo: boolean) => {
    if (!chatData) return;
    
    try {
      setIsCallActive(true);
      await callService.startCall(chat.id, isVideo);
    } catch (error: any) {
      console.error('Error starting call:', error);
      alert('Errore nell\'avvio della chiamata. Riprova.');
    }
  };

  const handleEndCall = async () => {
    try {
      await callService.endCall();
      setIsCallActive(false);
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  const getStatusText = () => {
    if (!chatData) return '';
    if (options.isBlocked) return 'Bloccato';
    if (chatData.type === 'group') return `${chatData.participants.length} partecipanti`;
    if (chat.isTyping) return 'Sta scrivendo...';
    return chat.status === 'online' ? 'Online' : chat.lastSeen ? `Ultimo accesso ${formatLastSeen(chat.lastSeen)}` : 'Offline';
  };

  const formatLastSeen = (lastSeen?: Date | string) => {
    if (!lastSeen) return '';
    if (typeof lastSeen === 'string') return lastSeen;
    return format(lastSeen, 'dd/MM/yyyy HH:mm', { locale: it });
  };

  // Aggiungi un effetto per marcare i messaggi come letti
  useEffect(() => {
    if (!messages.length || !currentUser) return;

    const unreadMessages = messages.filter(
      msg => !msg.isMe && msg.status !== 'read'
    );

    if (unreadMessages.length > 0) {
      markAsRead();
    }
  }, [messages, currentUser]);

  if (loading) {
    return (
      <div className="fixed inset-0 theme-bg flex items-center justify-center">
        <div className="theme-text">Caricamento...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 theme-bg flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 theme-bg flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 theme-bg-primary border-b theme-divide">
        <button
          onClick={onClose}
          className="p-2 hover:theme-bg-secondary rounded-full transition-colors theme-text"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <img
          src={chat.photoURL}
          alt={chat.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold theme-text truncate">
            {chat.name}
          </h2>
          <p className="text-sm theme-text opacity-70 truncate">
            {getStatusText()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {!chatData?.type && (
            <>
              <button
                onClick={() => handleStartCall(false)}
                disabled={isCallActive || options.isBlocked || chat.status !== 'online'}
                className={`p-2 rounded-full transition-colors hover:theme-bg-secondary
                ${isCallActive ? 'text-red-500' : 'text-green-500'} 
                disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Chiamata vocale"
              >
                <Phone className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleStartCall(true)}
                disabled={isCallActive || options.isBlocked || chat.status !== 'online'}
                className={`p-2 rounded-full transition-colors hover:theme-bg-secondary
                ${isCallActive ? 'text-red-500' : 'text-blue-500'}
                disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Videochiamata"
              >
                <Video className="w-5 h-5" />
              </button>
            </>
          )}
          <button 
            onClick={() => setShowOptions(true)}
            className="p-2 hover:theme-bg-secondary rounded-full transition-colors theme-text"
            title="Opzioni chat"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <MessageItem
            key={msg.id}
            {...msg}
            senderPhoto={msg.isMe ? currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.displayName || '')}&background=random` : chat.photoURL}
            senderName={msg.isMe ? currentUser?.displayName || '' : chat.name}
            onDelete={deleteMessage}
            isGroupChat={chatData?.type === 'group'}
            isAdmin={chatData?.groupAdmins?.includes(currentUser?.uid)}
            isGroupCreator={chatData?.groupCreator === currentUser?.uid}
          />
        ))}
        <div ref={messagesEndRef} />
        <div className="h-[120px]" />
      </div>

      {/* Input */}
      <div className="absolute bottom-[48px] left-0 right-0 theme-bg-primary border-t theme-divide">
        <form onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSend(e);
        }} className="p-4">
          {sendError && (
            <div className="absolute -top-10 left-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg">
              {sendError}
            </div>
          )}
          <div className="flex items-center space-x-2">
            <MediaInput
              onMediaSelect={handleMediaSend}
              disabled={options.isBlocked}
              isUploading={isUploading}
            />
            {!isRecording && !message.trim() && (
              <AudioRecorder
                onRecordingComplete={handleAudioSend}
                disabled={options.isBlocked || isUploading}
                onRecordingStateChange={setIsRecording}
              />
            )}
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={options.isBlocked ? 'Chat bloccata' : 'Scrivi un messaggio...'}
              disabled={options.isBlocked || isUploading || isRecording}
              className="flex-1 theme-bg-secondary theme-text rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!message.trim() || options.isBlocked || isUploading || isRecording}
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="p-2 theme-bg-accent rounded-full hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed theme-text relative"
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Chat Options */}
      <ChatOptions
        isOpen={showOptions}
        onClose={() => setShowOptions(false)}
        chatData={chatData}
        options={options}
      />

      {/* Active Call Overlay */}
      {isCallActive && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
          <img
            src={chat.photoURL}
            alt={chat.name}
            className="w-24 h-24 rounded-full mb-4"
          />
          <h3 className="theme-text text-xl font-semibold mb-2">{chat.name}</h3>
          <p className="theme-text opacity-70 mb-8">Chiamata in corso...</p>
          <button
            onClick={handleEndCall}
            className="p-4 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
          >
            <Phone className="w-6 h-6 theme-text" />
          </button>
        </div>
      )}
    </div>
  );
}