
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
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseUser 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
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
          photoURL: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        setUser({ 
          uid: userCredential.user.uid, 
          email: userCredential.user.email, 
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL 
        });
        router.push('/explore');
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error; 
    } finally {
      setLoading(false);
    }
  }, [router]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    if (!name || !email || !password) {
      throw new Error("Name, email, and password are required.");
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
        
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          displayName: name,
          email: email,
          photoURL: userCredential.user.photoURL || null,
          createdAt: serverTimestamp(), 
        });
        setUser({ 
          uid: userCredential.user.uid, 
          email: userCredential.user.email, 
          displayName: name,
          photoURL: userCredential.user.photoURL
        });
        router.push('/explore');
      }
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            createdAt: serverTimestamp(),
          });
        }
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
        router.push('/explore');
      }
    } catch (error: any) {
      console.error("Google login failed. Raw error object:", error);
      if (error.code) {
        console.error("Error code:", error.code);
      }
      if (error.message) {
        console.error("Error message:", error.message);
      }
      throw error; // Re-throw the error to be caught by the calling form
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
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
