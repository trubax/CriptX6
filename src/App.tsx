import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './components/Login';
import Chat from './components/Chat';
import Settings from './components/Settings';
import RegularUsers from './components/RegularUsers';
import ContactsPage from './pages/ContactsPage';
import GroupChatPage from './pages/GroupChatPage';
import PrivateRoute from './components/PrivateRoute';
import BottomNavigation from './components/navigation/BottomNavigation';
import OfflineAlert from './components/OfflineAlert';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import ProfilePage from './components/profile/ProfilePage';

function AuthenticatedApp() {
  const { isOnline, isFirestoreAvailable } = useNetworkStatus();

  return (
    <div className="min-h-screen theme-bg theme-text pb-16">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <Chat />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <RegularUsers />
            </PrivateRoute>
          }
        />
        <Route
          path="/contacts"
          element={
            <PrivateRoute>
              <ContactsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/group"
          element={
            <PrivateRoute>
              <GroupChatPage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/chat" replace />} />
      </Routes>
      <BottomNavigation />
      {(!isOnline || !isFirestoreAvailable) && <OfflineAlert />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AuthenticatedApp />
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}