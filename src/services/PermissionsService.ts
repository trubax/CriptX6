import { isPlatform } from '../utils/platform';

export class PermissionsService {
  private static instance: PermissionsService;

  private constructor() {}

  static getInstance() {
    if (!PermissionsService.instance) {
      PermissionsService.instance = new PermissionsService();
    }
    return PermissionsService.instance;
  }

  private async checkDeviceAvailability(type: 'audio' | 'video' | 'both'): Promise<boolean> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasAudio = devices.some(device => device.kind === 'audioinput');
      const hasVideo = devices.some(device => device.kind === 'videoinput');

      if (type === 'audio') return hasAudio;
      if (type === 'video') return hasVideo;
      return hasAudio && hasVideo;
    } catch (error) {
      console.error('Error checking device availability:', error);
      return false;
    }
  }

  async checkMediaPermissions(type: 'audio' | 'video' | 'both'): Promise<{
    hasPermission: boolean;
    devices: MediaDeviceInfo[];
    error?: string;
  }> {
    try {
      // Check if the API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        throw new Error('API non supportata su questo dispositivo');
      }

      // Check device availability first
      const hasDevices = await this.checkDeviceAvailability(type);
      if (!hasDevices) {
        const deviceType = type === 'audio' ? 'microfono' : type === 'video' ? 'videocamera' : 'dispositivi richiesti';
        throw new Error(`Nessun ${deviceType} trovato sul dispositivo`);
      }

      // Request permissions based on type
      const constraints: MediaStreamConstraints = {
        audio: type === 'audio' || type === 'both' ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false,
        video: type === 'video' || type === 'both' ? {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } : false
      };

      // Try to get a media stream to trigger permission request
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Stop all tracks immediately
      stream.getTracks().forEach(track => track.stop());

      // Get list of available devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      // Verify we have the required devices after permission grant
      if ((type === 'audio' || type === 'both') && audioDevices.length === 0) {
        throw new Error('Nessun dispositivo audio disponibile');
      }

      if ((type === 'video' || type === 'both') && videoDevices.length === 0) {
        throw new Error('Nessuna videocamera disponibile');
      }

      return {
        hasPermission: true,
        devices: type === 'audio' ? audioDevices : type === 'video' ? videoDevices : devices
      };
    } catch (error: any) {
      console.error('Error checking media permissions:', error);

      let errorMessage = 'Errore durante l\'accesso ai dispositivi';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = isPlatform.mobile
          ? 'Permessi fotocamera/microfono negati. Controlla le impostazioni del dispositivo.'
          : 'Permessi fotocamera/microfono negati. Controlla le impostazioni del browser.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        const deviceType = type === 'audio' ? 'microfono' : type === 'video' ? 'videocamera' : 'dispositivi richiesti';
        errorMessage = `Nessun ${deviceType} trovato sul dispositivo`;
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Impossibile accedere ai dispositivi. Potrebbero essere in uso da un\'altra applicazione.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Le impostazioni richieste non sono supportate dal dispositivo';
      } else if (error.name === 'TypeError') {
        errorMessage = 'Configurazione non valida per i dispositivi richiesti';
      }

      return {
        hasPermission: false,
        devices: [],
        error: errorMessage
      };
    }
  }

  async requestMediaPermissions(type: 'audio' | 'video' | 'both'): Promise<boolean> {
    const { hasPermission, error } = await this.checkMediaPermissions(type);
    
    if (!hasPermission && error) {
      // On mobile, we can redirect to app settings
      if (isPlatform.mobile) {
        // TODO: Implement native app settings navigation when available
        return false;
      }
      
      // On web, we show instructions
      const deviceType = type === 'audio' ? 'il microfono' : type === 'video' ? 'la videocamera' : 'microfono e videocamera';
      const message = `Per utilizzare questa funzione, è necessario concedere i permessi per ${deviceType}.\n\n` +
                     `Per abilitare i permessi:\n` +
                     `1. Clicca sull'icona del lucchetto nella barra degli indirizzi\n` +
                     `2. Trova le impostazioni per ${deviceType}\n` +
                     `3. Seleziona "Consenti"`;
      
      alert(message);
      return false;
    }

    return hasPermission;
  }

  async checkAndRequestPermissions(type: 'audio' | 'video' | 'both'): Promise<{
    granted: boolean;
    devices: MediaDeviceInfo[];
    error?: string;
  }> {
    // First check device availability
    const hasDevices = await this.checkDeviceAvailability(type);
    if (!hasDevices) {
      const deviceType = type === 'audio' ? 'microfono' : type === 'video' ? 'videocamera' : 'dispositivi richiesti';
      return {
        granted: false,
        devices: [],
        error: `Nessun ${deviceType} trovato sul dispositivo`
      };
    }

    const initialCheck = await this.checkMediaPermissions(type);
    
    if (!initialCheck.hasPermission) {
      const granted = await this.requestMediaPermissions(type);
      if (granted) {
        const finalCheck = await this.checkMediaPermissions(type);
        return {
          granted: finalCheck.hasPermission,
          devices: finalCheck.devices,
          error: finalCheck.error
        };
      }
      return {
        granted: false,
        devices: [],
        error: initialCheck.error
      };
    }

    return {
      granted: true,
      devices: initialCheck.devices
    };
  }
}