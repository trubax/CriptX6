import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RotateCcw, Loader2 } from 'lucide-react';
import { isPlatform } from '../../../utils/platform';
import { PermissionsService } from '../../../services/PermissionsService';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File, type: 'photo' | 'video') => Promise<void>;
}

export default function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout>();
  const streamRef = useRef<MediaStream | null>(null);
  const permissionsService = PermissionsService.getInstance();

  useEffect(() => {
    if (isOpen) {
      initializeCamera();
    } else {
      stopMediaStream();
    }

    return () => {
      stopMediaStream();
    };
  }, [isOpen, facingMode]);

  const initializeCamera = async () => {
    setIsInitializing(true);
    setError(null);

    const { granted, devices, error: permissionError } = await permissionsService.checkAndRequestPermissions(
      isRecordingVideo ? 'both' : 'video'
    );

    if (!granted) {
      setError(permissionError || 'Permessi videocamera non concessi');
      setIsInitializing(false);
      return;
    }

    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    setHasMultipleCameras(videoDevices.length > 1);

    try {
      await startCamera();
    } finally {
      setIsInitializing(false);
    }
  };

  const stopMediaStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      stopMediaStream();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: isRecordingVideo
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Wait for video to be ready
        await new Promise((resolve) => {
          videoRef.current!.onloadedmetadata = () => {
            videoRef.current!.play();
            resolve(null);
          };
        });
      }

      setError(null);
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setError('Errore durante l\'accesso alla videocamera');
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    
    try {
      setIsProcessing(true);

      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      const aspectRatio = video.videoWidth / video.videoHeight;
      
      // Set canvas size to match video aspect ratio
      if (aspectRatio > 1) {
        canvas.width = Math.min(1920, video.videoWidth);
        canvas.height = canvas.width / aspectRatio;
      } else {
        canvas.height = Math.min(1920, video.videoHeight);
        canvas.width = canvas.height * aspectRatio;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Center the video frame in the canvas
      const sx = (video.videoWidth - canvas.width) / 2;
      const sy = (video.videoHeight - canvas.height) / 2;
      
      ctx.drawImage(video, 
        sx, sy, canvas.width, canvas.height,
        0, 0, canvas.width, canvas.height
      );

      const blob = await new Promise<Blob | null>((resolve) => 
        canvas.toBlob(resolve, 'image/jpeg', 0.9)
      );

      if (blob) {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        await onCapture(file, 'photo');
      }
    } catch (err) {
      console.error('Error capturing photo:', err);
      setError('Errore durante l\'acquisizione della foto');
    } finally {
      setIsProcessing(false);
    }
  };

  // ... rest of the code remains the same ...

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="p-4 flex justify-between items-center">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          disabled={isProcessing}
        >
          <X className="w-6 h-6 text-white" />
        </button>
        <span className="text-white font-medium">
          {isRecordingVideo ? 'Registrazione video' : 'Scatta foto'}
        </span>
        {hasMultipleCameras && isPlatform.mobile && (
          <button
            onClick={switchCamera}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            disabled={isProcessing}
          >
            <RotateCcw className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      <div className="flex-1 relative bg-black">
        {isInitializing ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Overlay for aspect ratio guide */}
            <div className="absolute inset-0 border-2 border-white/30 pointer-events-none" />
          </>
        )}
        
        {isRecordingVideo && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-3 py-1 rounded-full text-sm">
            {formatTime(recordingTime)}
          </div>
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </div>

      <div className="p-6 flex justify-center items-center gap-8">
        <button
          onClick={isRecordingVideo ? stopVideoRecording : capturePhoto}
          disabled={isProcessing || isInitializing}
          className={`w-16 h-16 rounded-full border-4 border-white hover:bg-white/10 transition-colors relative disabled:opacity-50`}
        >
          {isRecordingVideo && (
            <span className="absolute inset-2 bg-red-500 rounded-sm" />
          )}
        </button>
        <button
          onClick={isRecordingVideo ? undefined : startVideoRecording}
          disabled={isRecordingVideo || isProcessing || isInitializing}
          className={`p-4 rounded-full border-2 border-white ${
            isRecordingVideo || isProcessing || isInitializing ? 'opacity-50' : 'hover:bg-white/10'
          } transition-colors`}
        >
          <Camera className="w-6 h-6 text-white" />
        </button>
      </div>

      {error && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}