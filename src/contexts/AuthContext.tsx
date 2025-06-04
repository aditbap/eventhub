'use client';

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { auth } from '@/lib/firebase'; // Using mocked auth
import { useRouter, usePathname } from 'next/navigation';
import { User as FirebaseUser } from 'firebase/auth'; // Import actual Firebase User type if using real Firebase

// Define a simpler User type for the context or use FirebaseUser
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email?: string, password?: string) => Promise<void>;
  register: (name?: string, email?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email?: string, password?: string) => {
    setLoading(true);
    try {
      const { user: firebaseUser } = await auth.signInWithEmailAndPassword(email, password);
      if (firebaseUser) {
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email, displayName: firebaseUser.displayName });
        router.push('/explore');
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error; // Re-throw to be caught by form
    } finally {
      setLoading(false);
    }
  }, [router]);

  const register = useCallback(async (name?: string, email?: string, password?: string) => {
    setLoading(true);
    try {
      const { user: firebaseUser } = await auth.createUserWithEmailAndPassword(email, password, name); // Mocked function takes name
      if (firebaseUser) {
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email, displayName: name || firebaseUser.displayName });
        router.push('/explore');
      }
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await auth.signOut();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);
  
  useEffect(() => {
    if (!loading && !user && !pathname.startsWith('/login') && !pathname.startsWith('/register') && pathname !== '/') {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);


  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
