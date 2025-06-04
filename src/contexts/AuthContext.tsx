
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { auth, db } from '@/lib/firebase'; // Using REAL Firebase
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  type User as FirebaseUser // Import actual Firebase User type
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';

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
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
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
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        setUser({ uid: userCredential.user.uid, email: userCredential.user.email, displayName: userCredential.user.displayName });
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
    if (!name || !email || !password) {
      throw new Error("Name, email, and password are required.");
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
        // Optionally, store additional user info in Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          displayName: name,
          email: email,
          createdAt: new Date(), // Or serverTimestamp()
        });
        setUser({ uid: userCredential.user.uid, email: userCredential.user.email, displayName: name });
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
      await signOut(auth);
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);
  
  useEffect(() => {
    const allowedUnauthenticatedPaths = [
      '/login',
      '/register',
      '/reset-password',
      '/new-password', 
      '/' 
    ];

    if (
      !loading &&
      !user &&
      !allowedUnauthenticatedPaths.some(p => pathname.startsWith(p)) &&
      pathname !== '/' 
    ) {
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
