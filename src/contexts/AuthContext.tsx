
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
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  type User as FirebaseUser 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore';
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
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean, error?: { message: string, code?: string } }>;
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
    try {
      await signOut(auth);
      setUser(null); 
      router.push('/login'); 
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [router, setUser]); 

  const updateUserName = useCallback(async (newName: string): Promise<{ success: boolean, error?: { message: string, code?: string } }> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: { message: "No user logged in." } };
    }
    const trimmedNewName = newName.trim();
    if (!trimmedNewName) {
      return { success: false, error: { message: "Name cannot be empty." } };
    }
  
    console.time("updateUserNameFirebase");
    console.log(`updateUserName: Attempting to update name for UID: ${currentUser.uid} to "${trimmedNewName}"`);
  
    try {
      console.log("updateUserName: Attempting to update Firebase Auth profile...");
      await updateProfile(currentUser, { displayName: trimmedNewName });
      console.log("updateUserName: Firebase Auth profile updated successfully.");
  
      const userDocRef = doc(db, "users", currentUser.uid);
      console.log(`updateUserName: Checking Firestore document at users/${currentUser.uid}...`);
      const docSnap = await getDoc(userDocRef);
  
      const userDataToUpdate = {
        displayName: trimmedNewName,
        photoURL: currentUser.photoURL || null, 
        email: currentUser.email || null, 
        updatedAt: serverTimestamp()
      };
  
      if (docSnap.exists()) {
        console.log("updateUserName: Firestore document exists. Updating with new name and updatedAt...");
        await updateDoc(userDocRef, userDataToUpdate);
        console.log("updateUserName: Firestore document updated successfully.");
      } else {
        console.warn(`updateUserName: Firestore document users/${currentUser.uid} not found. Creating document.`);
        await setDoc(userDocRef, {
          uid: currentUser.uid,
          ...userDataToUpdate,
          createdAt: serverTimestamp() 
        });
        console.log("updateUserName: Firestore document created successfully.");
      }
      
      setUser(prevUser => prevUser ? { ...prevUser, displayName: trimmedNewName, photoURL: currentUser.photoURL } : null);
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
  
  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean, error?: { message: string, code?: string } }> => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      return { success: false, error: { message: "User not found or email is missing. Please log in again." } };
    }

    console.log(`changePassword: Attempting for user ${currentUser.email}`);
    try {
      console.log("changePassword: Creating credential...");
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      
      console.log("changePassword: Attempting to re-authenticate...");
      await reauthenticateWithCredential(currentUser, credential);
      console.log("changePassword: Re-authentication successful.");
      
      console.log("changePassword: Attempting to update password...");
      await updatePassword(currentUser, newPassword);
      console.log("changePassword: Password updated successfully.");
      
      return { success: true };
    } catch (err: any) {
      console.warn(`AuthContext: Failed to change password. Error Code: ${err.code}, Message: ${err.message}`, err);
      let errorMessage = "Could not change password. Please try again.";
      if (err.code === 'auth/wrong-password') {
        errorMessage = "The current password you entered is incorrect.";
      } else if (err.code === 'auth/weak-password') {
        errorMessage = "The new password is too weak. Please choose a stronger password (at least 6 characters).";
      } else if (err.code === 'auth/requires-recent-login') {
         errorMessage = "This operation is sensitive and requires recent authentication. Please log out and log back in before attempting to change your password.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      return { success: false, error: { message: errorMessage, code: err.code } };
    }
  }, []);

  useEffect(() => {
    const protectedAppPaths = ['/explore', '/events', '/create', '/map', '/profile', '/settings'];
    const isProtectedPath = protectedAppPaths.some(p => pathname.startsWith(p));

    if (!loading && !user && isProtectedPath) {
      router.replace('/login');
    }
  }, [user, loading, pathname, router]);

  useEffect(() => {
    const authPagesForRedirect = ['/login', '/register', '/reset-password']; 
    if (!loading && user && (authPagesForRedirect.includes(pathname) || pathname === '/')) {
      router.replace('/explore');
    }
  }, [user, loading, pathname, router]);


  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginWithGoogle, updateUserName, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
