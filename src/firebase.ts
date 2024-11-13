import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  PhoneAuthProvider,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD38C-wyEziutHYrQG4rFatW-9Z5In37Ss",
  authDomain: "criptax-8d87d.firebaseapp.com",
  projectId: "criptax-8d87d",
  storageBucket: "criptax-8d87d.appspot.com",
  messagingSenderId: "693837443791",
  appId: "1:693837443791:web:c3d93b462cc82458e6bdba",
  measurementId: "G-YNX6MZDC7K",
  databaseURL: "https://criptax-8d87d-default-rtdb.europe-west1.firebasedatabase.app/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

// Initialize Messaging
const messaging = getMessaging(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser doesn\'t support offline persistence.');
  }
});

// Configure Google provider
const provider = new GoogleAuthProvider();
provider.addScope('profile');
provider.addScope('email');
provider.setCustomParameters({
  prompt: 'select_account'
});

// Helper function for Google Sign In
export const signInWithGoogle = async () => {
  return await signInWithPopup(auth, provider);
};

// Helper function for Phone Sign In
export const initiatePhoneSignIn = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return confirmationResult;
  } catch (error) {
    console.error('Error initiating phone sign in:', error);
    throw error;
  }
};

// Helper function to verify phone code
export const verifyPhoneCode = async (verificationId: string, code: string) => {
  try {
    const credential = PhoneAuthProvider.credential(verificationId, code);
    return await auth.signInWithCredential(credential);
  } catch (error) {
    console.error('Error verifying phone code:', error);
    throw error;
  }
};

// Helper function to get FCM token
export const getFCMToken = async () => {
  try {
    const currentToken = await getToken(messaging, {
      vapidKey: "BLBz-RxW2qRyB8z9VSIghvTv4kM_tX1WgzqcBYAlEiTqcZ8xGxq_VXGYdPKYVCoEfEHqkADz6JiqGGhDyM-Zjrs"
    });
    return currentToken;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Helper function to handle foreground messages
export const onForegroundMessage = (callback: (payload: any) => void) => {
  return onMessage(messaging, callback);
};

export { auth, provider, db, storage, messaging };