import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export interface User {
  uid: string;
  displayName: string;
  photoURL: string;
  status: 'online' | 'offline';
  lastSeen: Date;
  isAnonymous: boolean;
}

export function useUsers(isAnonymous: boolean = false) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const { currentUser } = useAuth();
  const USERS_PER_PAGE = 10;

  const loadUsers = async (lastDocument?: QueryDocumentSnapshot) => {
    try {
      setLoading(true);
      setError(null);

      let userQuery = query(
        collection(db, 'users'),
        where('isAnonymous', '==', isAnonymous),
        where('uid', '!=', currentUser?.uid || ''),
        orderBy('uid'),
        orderBy('lastSeen', 'desc'),
        limit(USERS_PER_PAGE)
      );

      if (lastDocument) {
        userQuery = query(userQuery, startAfter(lastDocument));
      }

      const snapshot = await getDocs(userQuery);
      
      if (snapshot.empty && !lastDocument) {
        setUsers([]);
        return;
      }

      const newUsers = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
        lastSeen: doc.data().lastSeen?.toDate() || new Date()
      })) as User[];

      setUsers(prev => lastDocument ? [...prev, ...newUsers] : newUsers);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Errore nel caricamento degli utenti. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (lastDoc) {
      loadUsers(lastDoc);
    }
  };

  const searchUsers = async (query: string) => {
    try {
      setLoading(true);
      setError(null);

      const userQuery = query(
        collection(db, 'users'),
        where('isAnonymous', '==', isAnonymous),
        where('displayName', '>=', query),
        where('displayName', '<=', query + '\uf8ff'),
        limit(10)
      );

      const snapshot = await getDocs(userQuery);
      const searchResults = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
        lastSeen: doc.data().lastSeen?.toDate() || new Date()
      })) as User[];

      setUsers(searchResults);
      setLastDoc(null);
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Errore nella ricerca degli utenti. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [isAnonymous]);

  return {
    users,
    loading,
    error,
    hasMore: !!lastDoc,
    loadMore,
    searchUsers
  };
}