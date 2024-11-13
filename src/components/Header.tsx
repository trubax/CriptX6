import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Timer, ChevronDown, Menu, User, Settings, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  activeTab?: 'chats' | 'contacts';
  setActiveTab?: (tab: 'chats' | 'contacts') => void;
  isIndividualChat?: boolean;
  onSetMessageTimer?: (seconds: number) => Promise<void>;
  currentTimer?: number;
  onToggleSidebar?: () => void;
}

export default function Header({ 
  activeTab, 
  setActiveTab, 
  isIndividualChat,
  onSetMessageTimer,
  currentTimer = 0,
  onToggleSidebar
}: HeaderProps) {
  const navigate = useNavigate();
  const { currentUser, logout, isAnonymous } = useAuth();
  const [showTimerMenu, setShowTimerMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  const timerOptions = [
    { label: 'Disattiva', value: 0 },
    { label: '10 secondi', value: 10 },
    { label: '30 secondi', value: 30 },
    { label: '60 secondi', value: 60 }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 theme-bg-primary shadow-md">
      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-full hover:theme-bg-secondary transition-colors theme-text"
          >
            <Menu className="w-5 h-5" />
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
  );
}