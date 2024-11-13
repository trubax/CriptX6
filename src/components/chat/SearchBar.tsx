import React from 'react';
import { Search, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: 'chats' | 'contacts';
}

export default function SearchBar({ searchQuery, setSearchQuery, activeTab }: SearchBarProps) {
  const { theme } = useTheme();

  return (
    <div className={`px-4 py-2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`flex items-center px-3 py-2 rounded-lg ${
        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
      }`}>
        <Search className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
        <input
          type="text"
          placeholder={activeTab === 'chats' ? 'Cerca nelle chat...' : 'Cerca contatti...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`ml-2 bg-transparent border-none focus:outline-none w-full ${
            theme === 'dark' ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
          }`}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className={`p-1 rounded-full ${
              theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}