import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, AlertCircle, LogIn, UserCircle2, Phone, Wifi, WifiOff } from 'lucide-react';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../firebase';

export default function Login() {
  const { login, loginAnonymously, loginWithPhone, currentUser, isDevelopment } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showNicknameInput, setShowNicknameInput] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [nickname, setNickname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showVerificationInput, setShowVerificationInput] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setError('');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setError('Nessuna connessione internet. Verifica la tua connessione e riprova.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (currentUser) {
    return <Navigate to="/chat" />;
  }

  const handleGoogleLogin = async () => {
    if (!isOnline) {
      setError('Nessuna connessione internet. Verifica la tua connessione e riprova.');
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      await login();
    } catch (error: any) {
      if (error?.code === 'auth/popup-blocked') {
        setIsRedirecting(true);
        setError('Il popup è stato bloccato. Reindirizzamento in corso...');
      } else {
        setError(error.message || 'Si è verificato un errore durante l\'accesso. Riprova più tardi.');
      }
    } finally {
      if (!isRedirecting) {
        setIsLoading(false);
      }
    }
  };

  const handlePhoneLogin = async () => {
    if (!phoneNumber.trim()) {
      setError('Inserisci un numero di telefono valido');
      return;
    }

    try {
      setError('');
      setIsLoading(true);

      // Configura reCAPTCHA
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved
          }
        });
      }

      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const result = await loginWithPhone(formattedPhone, window.recaptchaVerifier);
      
      if (result.verificationId) {
        setVerificationId(result.verificationId);
        setShowVerificationInput(true);
        setError('');
      }
    } catch (error: any) {
      console.error('Errore login telefono:', error);
      setError(error.message || 'Errore durante l\'invio del codice di verifica');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('Inserisci il codice di verifica');
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      await loginWithPhone(verificationId, verificationCode);
    } catch (error: any) {
      console.error('Errore verifica codice:', error);
      setError('Codice non valido. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOnline) {
      setError('Nessuna connessione internet. Verifica la tua connessione e riprova.');
      return;
    }

    if (!nickname.trim() || nickname.trim().length < 3) {
      setError('Il nickname deve contenere almeno 3 caratteri');
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      await loginAnonymously(nickname.trim());
    } catch (error: any) {
      setError(error.message || 'Si è verificato un errore durante l\'accesso temporaneo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl shadow-2xl">
        <div className="text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-blue-500" />
          <h2 className="mt-6 text-3xl font-bold text-white">Benvenuto su CriptX</h2>
          <p className="mt-2 text-sm text-gray-400">Messaggistica sicura per tutti</p>
          {!isOnline && (
            <div className="mt-4 flex items-center justify-center gap-2 text-yellow-500">
              <WifiOff className="w-5 h-5" />
              <span className="text-sm">Modalità offline</span>
            </div>
          )}
        </div>

        {error && (
          <div className={`bg-${isRedirecting ? 'blue' : 'red'}-900/50 border border-${isRedirecting ? 'blue' : 'red'}-500 rounded-lg p-4 flex items-start space-x-2`}>
            <AlertCircle className={`w-5 h-5 text-${isRedirecting ? 'blue' : 'red'}-500 flex-shrink-0 mt-0.5`} />
            <span className={`text-sm text-${isRedirecting ? 'blue' : 'red'}-200`}>{error}</span>
          </div>
        )}

        {showVerificationInput ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-2">
                Inserisci il codice di verifica
              </label>
              <input
                type="text"
                id="code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Codice di verifica"
                maxLength={6}
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleVerifyCode}
                disabled={isLoading || !verificationCode.trim()}
                className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifica in corso...' : 'Verifica codice'}
              </button>
              <button
                onClick={() => {
                  setShowVerificationInput(false);
                  setVerificationCode('');
                  setVerificationId('');
                }}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Indietro
              </button>
            </div>
          </div>
        ) : showPhoneInput ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                Inserisci il tuo numero di telefono
              </label>
              <input
                type="tel"
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+39 123 456 7890"
                required
              />
              <p className="mt-1 text-xs text-gray-400">
                Inserisci il numero con il prefisso internazionale (es. +39)
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handlePhoneLogin}
                disabled={isLoading || !phoneNumber.trim()}
                className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Invio in corso...' : 'Invia codice'}
              </button>
              <button
                onClick={() => {
                  setShowPhoneInput(false);
                  setPhoneNumber('');
                }}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Indietro
              </button>
            </div>
          </div>
        ) : showNicknameInput ? (
          <form onSubmit={handleAnonymousLogin} className="space-y-4">
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-300 mb-2">
                Scegli un nickname
              </label>
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Il tuo nickname"
                minLength={3}
                maxLength={20}
                required
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-400">
                Il nickname deve essere tra 3 e 20 caratteri
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isLoading || !isOnline || nickname.trim().length < 3}
                className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Accesso in corso...' : 'Accedi come ospite'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNicknameInput(false);
                  setError('');
                  setNickname('');
                }}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Indietro
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading || isRedirecting || !isOnline}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed gap-2"
            >
              <LogIn className="w-5 h-5" />
              {isRedirecting ? 'Reindirizzamento...' : isLoading ? 'Accesso in corso...' : 'Accedi con Google'}
            </button>

            <button
              onClick={() => setShowPhoneInput(true)}
              disabled={isLoading || !isOnline}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed gap-2"
            >
              <Phone className="w-5 h-5" />
              Accedi con il telefono
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-400">oppure</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowNicknameInput(true);
                setError('');
              }}
              disabled={isLoading || !isOnline}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-600 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed gap-2"
            >
              <UserCircle2 className="w-5 h-5" />
              Accedi come ospite
            </button>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs text-center text-gray-500">
            Accedendo, accetti i nostri Termini di Servizio e la Privacy Policy
          </p>
          {showNicknameInput && (
            <p className="text-xs text-center text-gray-500">
              L'account ospite scade dopo 24 ore o al logout
            </p>
          )}
          <p className="text-xs text-center text-gray-500">
            Le tue conversazioni sono crittografate end-to-end
          </p>
        </div>

        {/* reCAPTCHA container */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}