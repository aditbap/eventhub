
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
import { doc, setDoc, getDoc, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore'; // Added updateDoc
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
  register: (name: string, email: string, password: string) => Promise<{ success: true; user: User } | { success: false; error: { code?: string; message: string } }>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  updateUserName: (newName: string) => Promise<{ success: boolean, error?: { message: string, code?: string } }>;
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
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error; 
    } finally {
      setLoading(false);
    }
  }, [setUser]); 

  const register = useCallback(async (name: string, email: string, password: string): Promise<{ success: true; user: User } | { success: false; error: { code?: string; message: string } }> => {
    if (!name || !email || !password) {
      return { success: false, error: { message: "Name, email, and password are required." } };
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
        
        const userData = {
          uid: userCredential.user.uid,
          displayName: name,
          email: email,
          photoURL: userCredential.user.photoURL || null,
          createdAt: serverTimestamp(), 
          updatedAt: serverTimestamp() // Added updatedAt
        };
        await setDoc(doc(db, "users", userCredential.user.uid), userData);

        const loggedInUser = { 
          uid: userCredential.user.uid, 
          email: userCredential.user.email, 
          displayName: name,
          photoURL: userCredential.user.photoURL
        };
        setUser(loggedInUser);
        return { success: true, user: loggedInUser };
      } else {
        return { success: false, error: { message: "User creation failed unexpectedly after Firebase call." } };
      }
    } catch (err: any) {
      console.warn("AuthContext: Registration failed:", err.code, err.message); 
      return { success: false, error: { code: err.code, message: err.message } };
    }
  }, [setUser]); 

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          const googleUserData = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || null,
            email: firebaseUser.email || null,
            photoURL: firebaseUser.photoURL || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp() // Added updatedAt
          };
          await setDoc(userDocRef, googleUserData);
        } else {
          // If user document exists, update updatedAt timestamp
           await updateDoc(userDocRef, { 
            updatedAt: serverTimestamp(),
            // Optionally update displayName and photoURL if they might have changed in Google account
            displayName: firebaseUser.displayName || userDoc.data()?.displayName || null,
            photoURL: firebaseUser.photoURL || userDoc.data()?.photoURL || null,
          });
        }
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      }
    } catch (error: any) {
      let userMessage = 'Failed to login with Google. Please try again.';
      console.warn("Google login failed. Raw error object:", error); 
      if (error.code) {
        console.warn("Error code:", error.code); 
        switch (error.code) {
          case 'auth/popup-closed-by-user':
            userMessage = 'Google Sign-In was cancelled. Please try again.';
            break;
          case 'auth/popup-blocked':
            userMessage = 'Google Sign-In popup was blocked by your browser. Please enable popups and try again.';
            break;
          case 'auth/cancelled-popup-request':
             userMessage = 'Google Sign-In was cancelled. Please ensure popups are not blocked and try again.';
            break;
          case 'auth/unauthorized-domain':
            userMessage = 'This domain is not authorized for Google Sign-In. Please contact support.';
            break;
        }
      } else {
         console.warn("Google login failed (no code):", error.message, error); 
      }
      error.displayMessage = userMessage; 
      throw error;
    }
  }, [setUser]); 

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
  }, [router, setUser]); 

  const updateUserName = useCallback(async (newName: string): Promise<{ success: boolean, error?: { message: string, code?: string } }> => {
    if (!auth.currentUser) {
      return { success: false, error: { message: "No user logged in." } };
    }
    const trimmedNewName = newName.trim();
    if (!trimmedNewName) {
      return { success: false, error: { message: "Name cannot be empty." } };
    }

    const userToUpdate = auth.currentUser;
    
    console.log(`updateUserName: Attempting to update name for UID: ${userToUpdate.uid} to "${trimmedNewName}"`);
    console.time("updateUserNameFirebase");

    try {
      console.log("updateUserName: Updating Firebase Auth profile...");
      await updateProfile(userToUpdate, { displayName: trimmedNewName });
      console.log("updateUserName: Firebase Auth profile updated successfully.");

      const userDocRef = doc(db, "users", userToUpdate.uid);
      console.log(`updateUserName: Checking Firestore document users/${userToUpdate.uid}...`);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        console.log("updateUserName: Firestore document exists. Updating with new name and updatedAt...");
        await updateDoc(userDocRef, { 
          displayName: trimmedNewName,
          updatedAt: serverTimestamp() 
        });
        console.log("updateUserName: Firestore document updated successfully.");
      } else {
        console.warn(`updateUserName: Firestore document users/${userToUpdate.uid} not found. Creating document with new name.`);
        await setDoc(userDocRef, {
          uid: userToUpdate.uid,
          displayName: trimmedNewName,
          email: userToUpdate.email || null,
          photoURL: userToUpdate.photoURL || null,
          createdAt: serverTimestamp(), // This marks the creation of this 'repaired' doc
          updatedAt: serverTimestamp()
        });
        console.log("updateUserName: Firestore document created successfully for missing user.");
      }
      
      setUser(prevUser => prevUser ? { ...prevUser, displayName: trimmedNewName } : null);
      console.timeEnd("updateUserNameFirebase");
      return { success: true };

    } catch (err: any) {
      console.timeEnd("updateUserNameFirebase"); 
      console.warn(`AuthContext: Failed to update user name. Error Code: ${err.code}, Message: ${err.message}`, err);
      let errorMessage = "Could not update name. Please try again.";
      if (err.message) {
        errorMessage = err.message;
      }
      return { success: false, error: { message: errorMessage, code: err.code } };
    }
  }, [setUser, db]); 
  
  useEffect(() => {
    const allowedUnauthenticatedPaths = [
      '/login',
      '/register',
      '/reset-password',
      '/new-password', 
    ];

    if (
      !loading &&
      !user &&
      !pathname.startsWith('/_next/') && 
      !allowedUnauthenticatedPaths.some(p => pathname === p || pathname.startsWith(p + '/')) &&
      pathname !== '/' 
    ) {
      router.replace('/login');
    }
  }, [user, loading, pathname, router]);

  useEffect(() => {
    const authPages = ['/login', '/register', '/reset-password', '/new-password'];
    if (!loading && user && (authPages.includes(pathname) || pathname === '/')) {
      router.replace('/explore'); 
    }
  }, [user, loading, pathname, router]);


  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginWithGoogle, updateUserName }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
