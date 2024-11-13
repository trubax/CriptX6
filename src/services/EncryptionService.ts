import { box, randomBytes } from 'tweetnacl';
import { decodeUTF8, encodeUTF8, encodeBase64, decodeBase64 } from 'tweetnacl-util';

export class EncryptionService {
  private static instance: EncryptionService;
  private keyPair: { publicKey: Uint8Array; secretKey: Uint8Array } | null = null;

  private constructor() {
    this.generateKeyPair();
  }

  static getInstance() {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  private generateKeyPair() {
    this.keyPair = box.keyPair();
  }

  getPublicKey(): string {
    if (!this.keyPair) throw new Error('KeyPair not initialized');
    return encodeBase64(this.keyPair.publicKey);
  }

  async encryptMessage(message: string, recipientPublicKey: string): Promise<{
    encrypted: string;
    nonce: string;
  }> {
    if (!this.keyPair) throw new Error('KeyPair not initialized');

    const messageUint8 = decodeUTF8(message);
    const nonce = randomBytes(box.nonceLength);
    const recipientPublicKeyUint8 = decodeBase64(recipientPublicKey);

    const encryptedMessage = box(
      messageUint8,
      nonce,
      recipientPublicKeyUint8,
      this.keyPair.secretKey
    );

    return {
      encrypted: encodeBase64(encryptedMessage),
      nonce: encodeBase64(nonce)
    };
  }

  async decryptMessage(
    encryptedMessage: string,
    nonce: string,
    senderPublicKey: string
  ): Promise<string> {
    if (!this.keyPair) throw new Error('KeyPair not initialized');

    const encryptedMessageUint8 = decodeBase64(encryptedMessage);
    const nonceUint8 = decodeBase64(nonce);
    const senderPublicKeyUint8 = decodeBase64(senderPublicKey);

    const decrypted = box.open(
      encryptedMessageUint8,
      nonceUint8,
      senderPublicKeyUint8,
      this.keyPair.secretKey
    );

    if (!decrypted) {
      throw new Error('Could not decrypt message');
    }

    return encodeUTF8(decrypted);
  }

  // Crittografia per stream audio/video
  async encryptStream(stream: MediaStream): Promise<MediaStream> {
    // Implementazione della crittografia dello stream per chiamate
    const encryptedTracks: MediaStreamTrack[] = [];
    
    stream.getTracks().forEach(track => {
      // Qui andrebbe implementata la crittografia real-time dello stream
      // Per ora facciamo un pass-through del track originale
      encryptedTracks.push(track);
    });

    return new MediaStream(encryptedTracks);
  }

  async decryptStream(encryptedStream: MediaStream): Promise<MediaStream> {
    // Implementazione della decrittografia dello stream per chiamate
    const decryptedTracks: MediaStreamTrack[] = [];
    
    encryptedStream.getTracks().forEach(track => {
      // Qui andrebbe implementata la decrittografia real-time dello stream
      // Per ora facciamo un pass-through del track originale
      decryptedTracks.push(track);
    });

    return new MediaStream(decryptedTracks);
  }
}