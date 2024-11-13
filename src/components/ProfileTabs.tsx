import React from 'react';
import { Grid, Bookmark, UserSquare2, Briefcase } from 'lucide-react';

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <div className="border-t border-gray-200">
      <div className="flex justify-around">
        <button 
          onClick={() => onTabChange('posts')}
          className={`px-4 py-3 border-t-2 transition-colors ${
            activeTab === 'posts' ? 'border-black' : 'border-transparent text-gray-400'
          }`}
        >
          <Grid className="w-6 h-6" />
        </button>
        <button 
          onClick={() => onTabChange('services')}
          className={`px-4 py-3 border-t-2 transition-colors ${
            activeTab === 'services' ? 'border-black' : 'border-transparent text-gray-400'
          }`}
        >
          <Briefcase className="w-6 h-6" />
        </button>
        <button 
          onClick={() => onTabChange('saved')}
          className={`px-4 py-3 border-t-2 transition-colors ${
            activeTab === 'saved' ? 'border-black' : 'border-transparent text-gray-400'
          }`}
        >
          <Bookmark className="w-6 h-6" />
        </button>
        <button 
          onClick={() => onTabChange('tagged')}
          className={`px-4 py-3 border-t-2 transition-colors ${
            activeTab === 'tagged' ? 'border-black' : 'border-transparent text-gray-400'
          }`}
        >
          <UserSquare2 className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}