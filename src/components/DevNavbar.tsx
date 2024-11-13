import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, Settings, Users, Bell, Layout } from 'lucide-react';

export default function DevNavbar() {
  const location = useLocation();

  const navItems = [
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/contacts', icon: Users, label: 'Contatti' },
    { path: '/notifications', icon: Bell, label: 'Notifiche' },
    { path: '/settings', icon: Settings, label: 'Impostazioni' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-red-600 text-white px-4 py-2 flex items-center justify-between z-50">
      <div className="flex items-center gap-2">
        <Layout className="w-5 h-5" />
        <span className="font-bold text-sm">Modalità Sviluppo</span>
      </div>
      <div className="flex gap-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-red-700'
                  : 'hover:bg-red-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}