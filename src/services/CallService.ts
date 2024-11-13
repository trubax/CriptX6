import AgoraRTC, { 
  IAgoraRTCClient, 
  ICameraVideoTrack, 
  IMicrophoneAudioTrack,
  UID
} from 'agora-rtc-sdk-ng';
import { EncryptionService } from './EncryptionService';
import { NotificationService } from './NotificationService';

const AGORA_APP_ID = 'YOUR_AGORA_APP_ID';

export class CallService {
  private client: IAgoraRTCClient;
  private localAudioTrack?: IMicrophoneAudioTrack;
  private localVideoTrack?: ICameraVideoTrack;
  private encryptionService: EncryptionService;
  private notificationService: NotificationService;
  private remoteUsers: Map<UID, {
    audioTrack?: MediaStreamTrack;
    videoTrack?: MediaStreamTrack;
  }> = new Map();
  
  constructor() {
    this.client = AgoraRTC.createClient({ 
      mode: 'rtc', 
      codec: 'vp8'
    });
    this.encryptionService = EncryptionService.getInstance();
    this.notificationService = NotificationService.getInstance();
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('user-published', async (user, mediaType) => {
      await this.client.subscribe(user, mediaType);

      if (mediaType === 'audio') {
        const audioTrack = user.audioTrack?.play();
        if (audioTrack) {
          const decryptedStream = await this.encryptionService.decryptStream(new MediaStream([audioTrack]));
          this.remoteUsers.set(user.uid, { 
            ...this.remoteUsers.get(user.uid),
            audioTrack: decryptedStream.getAudioTracks()[0] 
          });
        }
      }

      if (mediaType === 'video') {
        const videoTrack = user.videoTrack?.play();
        if (videoTrack) {
          const decryptedStream = await this.encryptionService.decryptStream(new MediaStream([videoTrack]));
          this.remoteUsers.set(user.uid, {
            ...this.remoteUsers.get(user.uid),
            videoTrack: decryptedStream.getVideoTracks()[0]
          });
        }
      }
    });

    this.client.on('user-unpublished', user => {
      this.remoteUsers.delete(user.uid);
    });

    // Gestione chiamate in arrivo
    this.client.on('user-joined', async (user) => {
      // Mostra notifica di chiamata in arrivo
      await this.notificationService.showCallNotification(
        user.uid.toString(),
        user.uid.toString(),
        !!this.localVideoTrack
      );
    });

    this.client.on('user-left', () => {
      // Ferma il suono della chiamata
      this.notificationService.stopCallSound();
    });
  }

  async startCall(channelId: string, isVideo: boolean = false) {
    try {
      await this.client.join(AGORA_APP_ID, channelId, null, null);

      // Create and encrypt audio track
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      const encryptedAudioStream = await this.encryptionService.encryptStream(
        new MediaStream([this.localAudioTrack.getMediaStreamTrack()])
      );
      await this.client.publish(AgoraRTC.createCustomAudioTrack({
        mediaStreamTrack: encryptedAudioStream.getAudioTracks()[0]
      }));

      if (isVideo) {
        // Create and encrypt video track
        this.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
        const encryptedVideoStream = await this.encryptionService.encryptStream(
          new MediaStream([this.localVideoTrack.getMediaStreamTrack()])
        );
        await this.client.publish(AgoraRTC.createCustomVideoTrack({
          mediaStreamTrack: encryptedVideoStream.getVideoTracks()[0]
        }));
      }

      return {
        localAudioTrack: this.localAudioTrack,
        localVideoTrack: this.localVideoTrack
      };
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  }

  async endCall() {
    try {
      this.localAudioTrack?.close();
      this.localVideoTrack?.close();
      await this.client.leave();
      this.remoteUsers.clear();
      this.notificationService.stopCallSound();
    } catch (error) {
      console.error('Error ending call:', error);
      throw error;
    }
  }

  async toggleMute(isMuted: boolean) {
    if (this.localAudioTrack) {
      this.localAudioTrack.setEnabled(!isMuted);
    }
  }

  async toggleVideo(isVideoEnabled: boolean) {
    if (this.localVideoTrack) {
      this.localVideoTrack.setEnabled(isVideoEnabled);
    }
  }

  getRemoteUsers() {
    return Array.from(this.remoteUsers.entries());
  }
}