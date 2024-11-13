import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, Settings as SettingsIcon, User, BookOpen, Users } from 'lucide-react';

export default function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show navigation bar on login page
  if (location.pathname === '/login') {
    return null;
  }

  const navItems = [
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/contacts', icon: BookOpen, label: 'Rubrica' },
    { path: '/group', icon: Users, label: 'Gruppo' },
    { path: '/users', icon: User, label: 'Utenti' },
    { path: '/settings', icon: SettingsIcon, label: 'Impostazioni' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 theme-bg-primary border-t theme-divide z-50">
      <div className="flex justify-around items-center px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center py-2 transition-colors ${
                isActive 
                  ? 'theme-text' 
                  : 'theme-text opacity-60 hover:opacity-100'
              }`}
            >
              <Icon 
                className={`w-6 h-6 ${isActive && 'theme-glow-sm'}`} 
                strokeWidth={isActive ? 2.5 : 2} 
              />
              <span className="text-xs mt-1">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-0.5 theme-bg-accent rounded-full theme-glow" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}