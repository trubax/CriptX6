import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Timer, 
  ChevronDown, 
  Menu, 
  User,
  Search,
  Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  activeTab?: 'chats' | 'contacts';
  setActiveTab?: (tab: 'chats' | 'contacts') => void;
  isIndividualChat?: boolean;
  onSetMessageTimer?: (seconds: number) => Promise<void>;
  currentTimer?: number;
}

export default function Header({ 
  activeTab, 
  setActiveTab, 
  isIndividualChat,
  onSetMessageTimer,
  currentTimer = 0
}: HeaderProps) {
  const navigate = useNavigate();
  const { currentUser, logout, isAnonymous } = useAuth();
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setShowSidebar(false);
  };

  const timerOptions = [
    { label: 'Disattiva', value: 0 },
    { label: '10 secondi', value: 10 },
    { label: '30 secondi', value: 30 },
    { label: '60 secondi', value: 60 }
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 theme-bg-primary shadow-md">
        <div className="p-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSidebar(true)}
              className="p-2 rounded-full hover:theme-bg-secondary"
            >
              <Menu className="w-5 h-5 theme-text" />
            </button>
            <h1 className="text-xl font-bold theme-text">
              CriptX
            </h1>
            {isAnonymous && (
              <span className="text-sm theme-bg-accent px-2 py-1 rounded-full theme-text">
                Guest: {currentUser?.displayName}
              </span>
            )}
          </div>

          {isIndividualChat && onSetMessageTimer && (
            <div className="absolute left-1/2 -translate-x-1/2">
              <div className="relative">
                <button
                  onClick={() => setShowTimerMenu(!showTimerMenu)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                    currentTimer > 0
                      ? 'theme-bg-accent theme-text'
                      : 'theme-bg-secondary theme-text opacity-70 hover:opacity-100'
                  }`}
                >
                  <Timer className="w-4 h-4" />
                  <span className="text-sm">
                    {currentTimer > 0 ? `${currentTimer}s` : 'Timer'}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showTimerMenu && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-40 theme-bg-primary rounded-lg shadow-lg overflow-hidden z-50">
                    {timerOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          onSetMessageTimer(option.value);
                          setShowTimerMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          currentTimer === option.value
                            ? 'theme-bg-accent theme-text'
                            : 'theme-text hover:theme-bg-secondary'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="p-2 rounded-full transition-colors hover:theme-bg-secondary theme-text"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {showSidebar && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowSidebar(false)}
          />
          
          <div className="fixed top-0 left-0 h-full w-64 theme-bg-primary shadow-lg z-50 transform transition-transform duration-300 ease-in-out">
            <div className="p-4 border-b theme-divide">
              <div className="flex items-center space-x-3">
                <img 
                  src={currentUser?.photoURL || '/default-avatar.png'} 
                  alt="Profile"
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <div className="font-medium theme-text">
                    {currentUser?.displayName || 'Utente'}
                  </div>
                  <div className="text-sm theme-text opacity-70">
                    {currentUser?.email || 'Guest User'}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2">
              <button 
                onClick={() => handleNavigate('/profile')}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:theme-bg-secondary theme-text"
              >
                <User className="w-5 h-5" />
                <span>Gestisci Profilo</span>
              </button>

              <button 
                onClick={() => handleNavigate('/search-services')}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:theme-bg-secondary theme-text"
              >
                <Search className="w-5 h-5" />
                <span>Cerca un Servizio</span>
              </button>

              <button 
                onClick={() => handleNavigate('/settings')}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:theme-bg-secondary theme-text"
              >
                <Settings className="w-5 h-5" />
                <span>Impostazioni</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}