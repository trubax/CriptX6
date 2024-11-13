import React, { useState, useRef } from 'react';
import { Mic, Loader2, X } from 'lucide-react';
import { PermissionsService } from '../../services/PermissionsService';

interface AudioRecorderProps {
  onRecordingComplete: (file: File) => Promise<void>;
  onRecordingStateChange?: (isRecording: boolean) => void;
  disabled?: boolean;
}

export default function AudioRecorder({ onRecordingComplete, onRecordingStateChange, disabled }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout>();
  const streamRef = useRef<MediaStream | null>(null);
  const permissionsService = PermissionsService.getInstance();

  const updateRecordingState = (state: boolean) => {
    setIsRecording(state);
    onRecordingStateChange?.(state);
  };

  const startRecording = async () => {
    try {
      const { granted, error: permissionError } = await permissionsService.checkAndRequestPermissions('audio');
      
      if (!granted) {
        setError(permissionError || 'Permessi microfono non concessi');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      updateRecordingState(true);
      setRecordingTime(0);
      setError(null);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error('Error starting audio recording:', err);
      setError('Errore durante la registrazione');
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current || !streamRef.current) return;

    try {
      setIsProcessing(true);
      const mediaRecorder = mediaRecorderRef.current;

      return new Promise<void>((resolve) => {
        mediaRecorder.onstop = async () => {
          try {
            const audioBlob = new Blob(audioChunksRef.current, {
              type: mediaRecorder.mimeType
            });

            const file = new File([audioBlob], `audio_${Date.now()}.${
              mediaRecorder.mimeType.includes('webm') ? 'webm' : 'm4a'
            }`, { type: mediaRecorder.mimeType });

            await onRecordingComplete(file);
            setError(null);
          } catch (err) {
            console.error('Error processing audio:', err);
            setError('Errore durante il salvataggio dell\'audio');
          } finally {
            if (recordingTimerRef.current) {
              clearInterval(recordingTimerRef.current);
            }

            // Clean up
            streamRef.current?.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            mediaRecorderRef.current = null;
            audioChunksRef.current = [];
            
            updateRecordingState(false);
            setRecordingTime(0);
            setIsProcessing(false);
            resolve();
          }
        };

        mediaRecorder.stop();
      });
    } catch (err) {
      console.error('Error stopping recording:', err);
      setError('Errore durante l\'arresto della registrazione');
      setIsProcessing(false);
    }
  };

  const cancelRecording = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }

    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    updateRecordingState(false);
    setRecordingTime(0);
    setError(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative">
      {isRecording ? (
        <div className="flex items-center gap-2">
          <button
            onClick={cancelRecording}
            disabled={isProcessing}
            className="p-2 hover:theme-bg-secondary rounded-full transition-colors disabled:opacity-50 theme-text min-w-[40px]"
            title="Annulla registrazione"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-sm theme-text">
            {formatTime(recordingTime)}
          </span>
          <button
            onClick={stopRecording}
            disabled={isProcessing}
            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50 min-w-[40px]"
            title="Ferma registrazione"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
        </div>
      ) : (
        <button
          onClick={startRecording}
          disabled={disabled || isProcessing}
          className="p-2 hover:theme-bg-secondary rounded-full transition-colors disabled:opacity-50 theme-text min-w-[40px]"
          title="Registra messaggio vocale"
        >
          <Mic className="w-5 h-5" />
        </button>
      )}

      {error && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-500 text-white text-xs px-2 py-1 rounded">
          {error}
        </div>
      )}
    </div>
  );
}