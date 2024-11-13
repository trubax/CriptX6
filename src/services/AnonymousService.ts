import { db } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

export class AnonymousService {
  private static instance: AnonymousService;

  private constructor() {}

  static getInstance(): AnonymousService {
    if (!AnonymousService.instance) {
      AnonymousService.instance = new AnonymousService();
    }
    return AnonymousService.instance;
  }

  async isNicknameTaken(nickname: string): Promise<boolean> {
    const nicknameRef = doc(db, 'nicknames', nickname.toLowerCase());
    const nicknameDoc = await getDocs(query(collection(db, 'anonymous'), where('nickname', '==', nickname)));
    return !nicknameDoc.empty;
  }

  async registerNickname(nickname: string, userId: string): Promise<void> {
    await setDoc(doc(db, 'nicknames', nickname.toLowerCase()), {
      userId,
      nickname,
      createdAt: new Date()
    });
  }

  async unregisterNickname(nickname: string): Promise<void> {
    await deleteDoc(doc(db, 'nicknames', nickname.toLowerCase()));
  }

  generateSuggestedNicknames(nickname: string): string[] {
    const suggestions: string[] = [];
    const suffixes = ['123', '_2', '_alt'];
    const randomNum = () => Math.floor(Math.random() * 999) + 1;
    
    while (suggestions.length < 3) {
      if (suggestions.length < suffixes.length) {
        suggestions.push(`${nickname}${suffixes[suggestions.length]}`);
      } else {
        suggestions.push(`${nickname}${randomNum()}`);
      }
    }
    
    return suggestions;
  }

  async cleanup(userId: string): Promise<void> {
    const anonymousRef = doc(db, 'anonymous', userId);
    const anonymousDoc = await getDocs(query(collection(db, 'anonymous'), where('userId', '==', userId)));
    
    if (!anonymousDoc.empty) {
      const nickname = anonymousDoc.docs[0].data().nickname;
      await this.unregisterNickname(nickname);
      await deleteDoc(anonymousRef);
    }
  }
}