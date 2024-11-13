import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { User } from '../hooks/useUsers';
import { format } from 'date-fns';
import { MessageCircle, Share2 } from 'lucide-react';

interface UsersListProps {
  users: User[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  isAnonymous?: boolean;
}

export default function UsersList({
  users,
  loading,
  error,
  hasMore,
  onLoadMore,
  isAnonymous
}: UsersListProps) {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleShare = async (user: User) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Unisciti a CriptX',
          text: `Chatta con ${user.displayName} su CriptX!`,
          url: window.location.origin
        });
      } else {
        // Fallback per browser che non supportano Web Share API
        await navigator.clipboard.writeText(
          `Unisciti a CriptX e chatta con ${user.displayName}! ${window.location.origin}`
        );
        alert('Link copiato negli appunti!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  if (error) {
    return (
      <div className={`p-4 text-center ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {users.map(user => (
        <div
          key={user.uid}
          className={`p-4 ${
            theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
          } transition-colors`}
        >
          <div className="flex items-center space-x-4">
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-12 h-12 rounded-full"
            />
            <div className="flex-1">
              <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {user.displayName}
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {user.status === 'online' ? (
                  <span className="text-green-500">Online</span>
                ) : (
                  `Ultimo accesso: ${format(user.lastSeen, 'dd/MM/yyyy HH:mm')}`
                )}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate(`/chat/${user.uid}`)}
                className={`p-2 rounded-full ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleShare(user)}
                className={`p-2 rounded-full ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {loading && (
        <div className={`p-4 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Caricamento...
        </div>
      )}

      {hasMore && !loading && (
        <div className="p-4 text-center">
          <button
            onClick={onLoadMore}
            className={`px-4 py-2 rounded-md ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            }`}
          >
            Carica altri
          </button>
        </div>
      )}

      {!loading && users.length === 0 && (
        <div className={`p-4 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {isAnonymous
            ? 'Nessun utente anonimo trovato'
            : 'Nessun utente registrato trovato'}
        </div>
      )}
    </div>
  );
}