import React, { useState, useRef } from 'react';
import { Mic, X } from 'lucide-react';
import { PermissionsService } from '../../../services/PermissionsService';

interface AudioRecorderProps {
  onRecordingComplete: (file: File) => Promise<void>;
  disabled?: boolean;
}

export default function AudioRecorder({ onRecordingComplete, disabled }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isHoldingButton, setIsHoldingButton] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout>();
  const streamRef = useRef<MediaStream | null>(null);
  const permissionsService = PermissionsService.getInstance();

  const startRecording = async (e: React.MouseEvent | React.TouchEvent) => {
    // Only prevent default if this is a direct click/touch on the button
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (disabled) return;
    setIsHoldingButton(true);

    try {
      const { granted, error: permissionError } = await permissionsService.checkAndRequestPermissions('audio');
      
      if (!granted) {
        setError(permissionError || 'Permessi microfono non concessi');
        setIsHoldingButton(false);
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
      setIsRecording(true);
      setRecordingTime(0);
      setError(null);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error('Error starting audio recording:', err);
      setError('Errore durante la registrazione');
      setIsHoldingButton(false);
    }
  };

  const stopRecording = async (e: React.MouseEvent | React.TouchEvent) => {
    // Only prevent default if this is a direct click/touch on the button
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
    }

    setIsHoldingButton(false);

    if (!mediaRecorderRef.current || !streamRef.current || !isRecording) return;

    return new Promise<void>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = async () => {
        try {
          // Only process recording if it's longer than 0.5 seconds
          if (recordingTime >= 0.5) {
            const audioBlob = new Blob(audioChunksRef.current, {
              type: mediaRecorder.mimeType
            });

            const file = new File([audioBlob], `audio_${Date.now()}.${
              mediaRecorder.mimeType.includes('webm') ? 'webm' : 'm4a'
            }`, { type: mediaRecorder.mimeType });

            await onRecordingComplete(file);
          }
          setError(null);
        } catch (err) {
          console.error('Error processing audio:', err);
          setError('Errore durante il salvataggio dell\'audio');
        }

        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }

        // Clean up
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
        
        setIsRecording(false);
        setRecordingTime(0);
        resolve();
      };

      mediaRecorder.stop();
    });
  };

  const cancelRecording = (e: React.MouseEvent) => {
    // Only prevent default if this is a direct click/touch on the button
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }

    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setIsHoldingButton(false);
    setRecordingTime(0);
    setError(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      {isRecording ? (
        <div className="flex items-center gap-2">
          <button
            onClick={cancelRecording}
            className="p-2 hover:theme-bg-secondary rounded-full transition-colors theme-text"
            title="Annulla registrazione"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-sm theme-text">
            {formatTime(recordingTime)}
          </span>
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={disabled}
            className={`p-2 ${isHoldingButton ? 'bg-red-500' : 'bg-red-600'} text-white rounded-full transition-colors disabled:opacity-50`}
            title="Tieni premuto per registrare"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          disabled={disabled}
          className="p-2 hover:theme-bg-secondary rounded-full transition-colors disabled:opacity-50 theme-text"
          title="Tieni premuto per registrare"
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