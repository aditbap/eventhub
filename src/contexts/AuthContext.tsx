
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { auth, db, storage } from '@/lib/firebase'; // Using REAL Firebase, Added storage
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
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'; // Added for storage
import { useRouter, usePathname } from 'next/navigation';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  bio?: string | null; // Added bio to local user state if needed, though usually fetched on profile
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
  updateUserBirthDate: (newBirthDate: string) => Promise<{ success: boolean, error?: { message: string, code?: string } }>;
  updateUserGender: (newGender: string) => Promise<{ success: boolean, error?: { message: string, code?: string } }>;
  updateUserProfilePicture: (file: File) => Promise<{ success: boolean, photoURL?: string, error?: { message: string, code?: string } }>;
  updateUserBio: (newBio: string) => Promise<{ success: boolean, error?: { message: string, code?: string } }>; // Added updateUserBio
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Fetch additional user data like bio from Firestore
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(userDocRef);
        let userBio = null;
        if (docSnap.exists()) {
          userBio = docSnap.data()?.bio || null;
        }
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          bio: userBio,
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
        const userDocRef = doc(db, "users", userCredential.user.uid);
        const docSnap = await getDoc(userDocRef);
        let userBio = null;
        if (docSnap.exists()) {
          userBio = docSnap.data()?.bio || null;
        }
        setUser({ 
          uid: userCredential.user.uid, 
          email: userCredential.user.email, 
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
          bio: userBio,
        });
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error; 
    }
  }, []); 

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
          bio: null, // Initialize bio as null
          createdAt: serverTimestamp(), 
          updatedAt: serverTimestamp()
        };
        await setDoc(doc(db, "users", userCredential.user.uid), userData);

        const loggedInUser = { 
          uid: userCredential.user.uid, 
          email: userCredential.user.email, 
          displayName: name,
          photoURL: userCredential.user.photoURL,
          bio: null,
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
  }, []); 

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        let userBio = null;

        const googleUserData: any = { // Use 'any' or a more specific type if preferred
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || null,
            email: firebaseUser.email || null,
            photoURL: firebaseUser.photoURL || null,
            updatedAt: serverTimestamp(),
        };

        if (!userDoc.exists()) {
          googleUserData.createdAt = serverTimestamp();
          googleUserData.bio = null; // Initialize bio if new user
          await setDoc(userDocRef, googleUserData);
          userBio = null;
        } else {
           userBio = userDoc.data()?.bio || null;
           await updateDoc(userDocRef, { 
            ...googleUserData,
            displayName: firebaseUser.displayName || userDoc.data()?.displayName || null,
            photoURL: firebaseUser.photoURL || userDoc.data()?.photoURL || null,
            updatedAt: serverTimestamp(),
          });
        }
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          bio: userBio,
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
  }, []); 

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null); 
      router.push('/login'); 
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [router]); 

 const updateUserName = useCallback(async (newName: string): Promise<{ success: boolean, error?: { message: string, code?: string } }> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: { message: "No user logged in." } };
    }
    const trimmedNewName = newName.trim();
    if (!trimmedNewName) {
      return { success: false, error: { message: "Name cannot be empty." } };
    }
    
    try {
      const authUpdatePromise = updateProfile(currentUser, { displayName: trimmedNewName });
      const userDocRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(userDocRef);
      
      const firestoreData: any = {
        displayName: trimmedNewName,
        updatedAt: serverTimestamp()
      };
      
      let firestoreUpdatePromise;
      if (docSnap.exists()) {
        firestoreUpdatePromise = updateDoc(userDocRef, firestoreData);
      } else {
        firestoreData.uid = currentUser.uid;
        firestoreData.email = currentUser.email || null;
        firestoreData.photoURL = currentUser.photoURL || null;
        firestoreData.createdAt = serverTimestamp();
        firestoreUpdatePromise = setDoc(userDocRef, firestoreData);
      }

      await Promise.all([authUpdatePromise, firestoreUpdatePromise]);
      setUser(prevUser => prevUser ? { ...prevUser, displayName: trimmedNewName } : null);
      return { success: true };

    } catch (err: any) {
      console.warn(`AuthContext: Failed to update user name. Error Code: ${err.code}, Message: ${err.message}`, err);
      return { success: false, error: { message: err.message || "Could not update name.", code: err.code } };
    }
  }, []);
  
  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean, error?: { message: string, code?: string } }> => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      return { success: false, error: { message: "User not found or email is missing. Please log in again." } };
    }

    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
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

  const updateUserBirthDate = useCallback(async (newBirthDate: string): Promise<{ success: boolean, error?: { message: string, code?: string } }> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: { message: "No user logged in." } };
    }
    
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(userDocRef);

      const birthDateData: any = {
        birthDate: newBirthDate,
        updatedAt: serverTimestamp()
      };

      if (docSnap.exists()) {
        await updateDoc(userDocRef, birthDateData);
      } else {
        birthDateData.uid = currentUser.uid;
        birthDateData.displayName = currentUser.displayName || null;
        birthDateData.email = currentUser.email || null;
        birthDateData.photoURL = currentUser.photoURL || null;
        birthDateData.createdAt = serverTimestamp();
        await setDoc(userDocRef, birthDateData);
      }
      return { success: true };
    } catch (err: any) {
      console.warn(`AuthContext: Failed to update user birth date. Error Code: ${err.code}, Message: ${err.message}`, err);
      return { success: false, error: { message: err.message || "Could not update birth date.", code: err.code } };
    }
  }, []);

  const updateUserGender = useCallback(async (newGender: string): Promise<{ success: boolean, error?: { message: string, code?: string } }> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: { message: "No user logged in." } };
    }
    
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(userDocRef);

      const genderData: any = {
        gender: newGender,
        updatedAt: serverTimestamp()
      };

      if (docSnap.exists()) {
        await updateDoc(userDocRef, genderData);
      } else {
        genderData.uid = currentUser.uid;
        genderData.displayName = currentUser.displayName || null;
        genderData.email = currentUser.email || null;
        genderData.photoURL = currentUser.photoURL || null;
        genderData.createdAt = serverTimestamp();
        await setDoc(userDocRef, genderData);
      }
      return { success: true };
    } catch (err: any) {
      console.warn(`AuthContext: Failed to update user gender. Error Code: ${err.code}, Message: ${err.message}`, err);
      return { success: false, error: { message: err.message || "Could not update gender.", code: err.code } };
    }
  }, []);

  const updateUserProfilePicture = useCallback(async (file: File): Promise<{ success: boolean, photoURL?: string, error?: { message: string, code?: string } }> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: { message: "No user logged in." } };
    }
    if (!file) {
      return { success: false, error: { message: "No file selected." } };
    }

    const filePath = `profile_pictures/${currentUser.uid}/${file.name}`;
    const fileRef = storageRef(storage, filePath);

    try {
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const authUpdatePromise = updateProfile(currentUser, { photoURL: downloadURL });
      
      const userDocRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(userDocRef);
      let firestorePromise;
      const firestoreData: any = {
        photoURL: downloadURL,
        updatedAt: serverTimestamp(),
      };

      if (docSnap.exists()) {
        firestorePromise = updateDoc(userDocRef, firestoreData);
      } else {
        firestoreData.uid = currentUser.uid;
        firestoreData.displayName = currentUser.displayName || null;
        firestoreData.email = currentUser.email || null;
        firestoreData.createdAt = serverTimestamp();
        firestorePromise = setDoc(userDocRef, firestoreData);
      }

      await Promise.all([authUpdatePromise, firestorePromise]);
      setUser(prevUser => prevUser ? { ...prevUser, photoURL: downloadURL } : null);
      return { success: true, photoURL: downloadURL };

    } catch (err: any) {
		  let detailedErrorMessage = "Could not update profile picture.";
		  if (err instanceof Error) {
			detailedErrorMessage = err.message;
		  }
		  if (typeof err === 'object' && err && 'code' in err) {
			const firebaseError = err as { code: string; message: string };
			console.warn(`AuthContext: Failed to update profile picture. Code: ${firebaseError.code}, Message: ${firebaseError.message}`, firebaseError);
			if (firebaseError.code === 'storage/unauthorized') {
			  detailedErrorMessage = "Permission denied. Please check Firebase Storage rules.";
			} else if (firebaseError.code === 'storage/object-not-found') {
			  detailedErrorMessage = "File not found during upload. This is unexpected.";
			} else if (firebaseError.code === 'storage/canceled') {
			  detailedErrorMessage = "Upload cancelled.";
			}
		  } else {
			console.warn(`AuthContext: Failed to update profile picture. Unknown error:`, err);
		  }
		  return { success: false, error: { message: detailedErrorMessage, code: (err as any)?.code } };
		}
  }, []);

  const updateUserBio = useCallback(async (newBio: string): Promise<{ success: boolean, error?: { message: string, code?: string } }> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: { message: "No user logged in." } };
    }
    
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(userDocRef);

      const bioData: any = { // Use 'any' or a more specific type
        bio: newBio,
        updatedAt: serverTimestamp()
      };

      if (docSnap.exists()) {
        await updateDoc(userDocRef, bioData);
      } else {
        // If user document doesn't exist, create it with all available info
        bioData.uid = currentUser.uid;
        bioData.displayName = currentUser.displayName || null;
        bioData.email = currentUser.email || null;
        bioData.photoURL = currentUser.photoURL || null;
        bioData.createdAt = serverTimestamp(); // Set createdAt if new doc
        await setDoc(userDocRef, bioData);
      }
      // Update local user state
      setUser(prevUser => prevUser ? { ...prevUser, bio: newBio } : null);
      return { success: true };
    } catch (err: any) {
      console.warn(`AuthContext: Failed to update user bio. Error Code: ${err.code}, Message: ${err.message}`, err);
      return { success: false, error: { message: err.message || "Could not update bio.", code: err.code } };
    }
  }, []);


  useEffect(() => {
    const protectedAppPaths = ['/explore', '/events', '/create', '/map', '/profile', '/settings', '/new-password'];
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
    <AuthContext.Provider value={{ 
        user, 
        loading, 
        login, 
        register, 
        logout, 
        loginWithGoogle, 
        updateUserName, 
        changePassword, 
        updateUserBirthDate, 
        updateUserGender,
        updateUserProfilePicture,
        updateUserBio // Expose updateUserBio
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

