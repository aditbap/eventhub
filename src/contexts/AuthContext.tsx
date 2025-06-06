
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
    // setLoading(true); // Removed to prevent global loader during login if already on login page
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
      // setLoading(false); // Auth state change will handle this
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
          updatedAt: serverTimestamp()
        };
        await setDoc(doc(db, "users", userCredential.user.uid), userData);

        const loggedInUser = { 
          uid: userCredential.user.uid, 
          email: userCredential.user.email, 
          displayName: name,
          photoURL: userCredential.user.photoURL
        };
        setUser(loggedInUser);
        // Navigation to /explore will be handled by the useEffect below once user state is set
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

        const googleUserData = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || null,
            email: firebaseUser.email || null,
            photoURL: firebaseUser.photoURL || null,
            updatedAt: serverTimestamp(),
        };

        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            ...googleUserData,
            createdAt: serverTimestamp(),
          });
        } else {
           await updateDoc(userDocRef, { 
            ...googleUserData,
            displayName: firebaseUser.displayName || userDoc.data()?.displayName || null, // Keep existing if new is null
            photoURL: firebaseUser.photoURL || userDoc.data()?.photoURL || null, // Keep existing if new is null
          });
        }
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
        // Navigation to /explore will be handled by the useEffect below
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
    // setLoading(true); // No need to set loading true, onAuthStateChanged will handle it.
    try {
      await signOut(auth);
      setUser(null); // This will trigger onAuthStateChanged
      router.push('/login'); 
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      // setLoading(false); // onAuthStateChanged sets loading to false
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
    
    console.time("updateUserNameFirebase");
    console.log(`updateUserName: Attempting to update name for UID: ${userToUpdate.uid} to "${trimmedNewName}"`);
  
    try {
      console.log("updateUserName: Attempting to update Firebase Auth profile...");
      await updateProfile(userToUpdate, { displayName: trimmedNewName });
      console.log("updateUserName: Firebase Auth profile updated successfully.");
  
      const userDocRef = doc(db, "users", userToUpdate.uid);
      console.log(`updateUserName: Checking Firestore document at users/${userToUpdate.uid}...`);
      const docSnap = await getDoc(userDocRef);
  
      const userDataToUpdate = {
        displayName: trimmedNewName,
        photoURL: userToUpdate.photoURL || null, // Ensure photoURL is consistent
        email: userToUpdate.email || null, // Ensure email is consistent
        updatedAt: serverTimestamp()
      };
  
      if (docSnap.exists()) {
        console.log("updateUserName: Firestore document exists. Updating with new name and updatedAt...");
        await updateDoc(userDocRef, userDataToUpdate);
        console.log("updateUserName: Firestore document updated successfully.");
      } else {
        console.warn(`updateUserName: Firestore document users/${userToUpdate.uid} not found. Creating document.`);
        await setDoc(userDocRef, {
          uid: userToUpdate.uid,
          ...userDataToUpdate, // includes new displayName, photoURL, email, updatedAt
          createdAt: serverTimestamp() // Set createdAt only if creating new doc
        });
        console.log("updateUserName: Firestore document created successfully.");
      }
      
      setUser(prevUser => prevUser ? { ...prevUser, displayName: trimmedNewName, photoURL: userToUpdate.photoURL } : null);
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
  
  // Redirect unauthenticated users from protected pages
  useEffect(() => {
    const protectedAppPaths = ['/explore', '/events', '/create', '/map', '/profile', '/settings'];
    // Add more specific protected paths if needed
    // Example: /events/[eventId] is implicitly protected by /events parent

    const isProtectedPath = protectedAppPaths.some(p => pathname.startsWith(p));

    if (!loading && !user && isProtectedPath) {
      router.replace('/login');
    }
  }, [user, loading, pathname, router]);

  // Redirect authenticated users from auth pages (like login, register) to explore
  useEffect(() => {
    // '/new-password' is removed so logged-in users can access it from settings
    const authPagesForRedirect = ['/login', '/register', '/reset-password']; 
    if (!loading && user && (authPagesForRedirect.includes(pathname) || pathname === '/')) {
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

    