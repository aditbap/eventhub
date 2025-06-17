
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { auth, db, storage } from '@/lib/firebase';
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
import { doc, setDoc, getDoc, serverTimestamp, Timestamp, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter, usePathname } from 'next/navigation';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  username: string | null; 
  photoURL?: string | null;
  bio?: string | null; 
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, username: string) => Promise<{ success: true; user: User } | { success: false; error: { code?: string; message: string } }>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  updateUserName: (newName: string) => Promise<{ success: boolean, error?: { message: string, code?: string } }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean, error?: { message: string, code?: string } }>;
  updateUserBirthDate: (newBirthDate: string) => Promise<{ success: boolean, error?: { message: string, code?: string } }>;
  updateUserGender: (newGender: string) => Promise<{ success: boolean, error?: { message: string, code?: string } }>;
  updateUserProfilePicture: (file: File) => Promise<{ success: boolean, photoURL?: string, error?: { message: string, code?: string } }>;
  updateUserBio: (newBio: string) => Promise<{ success: boolean, error?: { message: string, code?: string } }>; 
  updateUserUsername: (newUsername: string) => Promise<{ success: boolean, error?: { message: string, code?: string } }>;
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
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(userDocRef);
        let userBio = null;
        let username = null;
        if (docSnap.exists()) {
          const data = docSnap.data();
          userBio = data?.bio || null;
          username = data?.username || null; 
        }
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          username: username, 
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
        let username = null;
        if (docSnap.exists()) {
          const data = docSnap.data();
          userBio = data?.bio || null;
          username = data?.username || null;
        }
        setUser({ 
          uid: userCredential.user.uid, 
          email: userCredential.user.email, 
          displayName: userCredential.user.displayName,
          username: username,
          photoURL: userCredential.user.photoURL,
          bio: userBio,
        });
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error; 
    }
  }, []); 

  const register = useCallback(async (name: string, email: string, password: string, usernameInput: string): Promise<{ success: true; user: User } | { success: false; error: { code?: string; message: string } }> => {
    if (!name || !email || !password || !usernameInput) {
      return { success: false, error: { message: "Name, email, password, and username are required." } };
    }

    const normalizedUsername = usernameInput.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(normalizedUsername)) {
        return { success: false, error: { message: "Username must be 3-20 characters, lowercase letters, numbers, or underscores only." } };
    }

    try {
      const usersRef = collection(db, "users");
      const qUsername = query(usersRef, where("username", "==", normalizedUsername));
      const usernameSnapshot = await getDocs(qUsername);
      if (!usernameSnapshot.empty) {
        return { success: false, error: { message: "Username is already taken. Please choose another one." } };
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
        
        const userData = {
          uid: userCredential.user.uid,
          displayName: name,
          username: normalizedUsername,
          email: email,
          photoURL: userCredential.user.photoURL || null,
          bio: null, 
          createdAt: serverTimestamp(), 
          updatedAt: serverTimestamp()
        };
        await setDoc(doc(db, "users", userCredential.user.uid), userData);

        const loggedInUser: User = { 
          uid: userCredential.user.uid, 
          email: userCredential.user.email, 
          displayName: name,
          username: normalizedUsername,
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
      if (err.code === 'auth/email-already-in-use') {
        return { success: false, error: { code: err.code, message: "This email address is already in use." } };
      }
      return { success: false, error: { code: err.code, message: err.message || "Registration failed." } };
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
        let username = null;

        const googleUserData: any = { 
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || null,
            email: firebaseUser.email || null,
            photoURL: firebaseUser.photoURL || null,
            updatedAt: serverTimestamp(),
        };

        if (!userDoc.exists()) {
          googleUserData.createdAt = serverTimestamp();
          googleUserData.bio = null; 
          googleUserData.username = null; 
          await setDoc(userDocRef, googleUserData);
          userBio = null;
        } else {
           const existingData = userDoc.data();
           userBio = existingData?.bio || null;
           username = existingData?.username || null; 
           await updateDoc(userDocRef, { 
            displayName: firebaseUser.displayName || existingData?.displayName || null,
            photoURL: firebaseUser.photoURL || existingData?.photoURL || null,
            username: username, 
            updatedAt: serverTimestamp(),
          });
        }
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          username: username, 
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
            
      const firestoreData: any = {
        displayName: trimmedNewName,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(userDocRef, firestoreData); 
      await authUpdatePromise;

      setUser(prevUser => prevUser ? { ...prevUser, displayName: trimmedNewName } : null);
      return { success: true };

    } catch (err: any) {
      console.warn(`AuthContext: Failed to update user name. Error Code: ${err.code}, Message: ${err.message}`, err);
      return { success: false, error: { message: err.message || "Could not update name.", code: err.code } };
    }
  }, []);
  
  const updateUserUsername = useCallback(async (newUsernameInput: string): Promise<{ success: boolean, error?: { message: string, code?: string } }> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: { message: "No user logged in." } };
    }
    
    const normalizedNewUsername = newUsernameInput.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(normalizedNewUsername)) {
        return { success: false, error: { message: "Username must be 3-20 characters, lowercase letters, numbers, or underscores only." } };
    }

    try {
      const usersRef = collection(db, "users");
      const qUsername = query(usersRef, where("username", "==", normalizedNewUsername));
      const usernameSnapshot = await getDocs(qUsername);
      
      let isTaken = false;
      usernameSnapshot.forEach(docSnap => {
        if (docSnap.id !== currentUser.uid) { 
          isTaken = true;
        }
      });

      if (isTaken) {
        return { success: false, error: { message: "Username is already taken. Please choose another one." } };
      }

      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef); 

      const firestoreData: any = {
        username: normalizedNewUsername,
        updatedAt: serverTimestamp()
      };

      if (userDocSnap.exists()) {
        await updateDoc(userDocRef, firestoreData);
      } else {
        await setDoc(userDocRef, {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          bio: null,
          ...firestoreData, 
          createdAt: serverTimestamp(),
        });
      }

      setUser(prevUser => prevUser ? { ...prevUser, username: normalizedNewUsername } : null);
      return { success: true };

    } catch (err: any) {
      console.warn(`AuthContext: Failed to update username. Error Code: ${err.code}, Message: ${err.message}`, err);
      return { success: false, error: { message: err.message || "Could not update username.", code: err.code } };
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
      const birthDateData: any = {
        birthDate: newBirthDate,
        updatedAt: serverTimestamp()
      };
      await updateDoc(userDocRef, birthDateData); 
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
      const genderData: any = {
        gender: newGender,
        updatedAt: serverTimestamp()
      };
      await updateDoc(userDocRef, genderData); 
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
      const firestoreData: any = {
        photoURL: downloadURL,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(userDocRef, firestoreData); 
      await authUpdatePromise;

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
      const bioData: any = { 
        bio: newBio,
        updatedAt: serverTimestamp()
      };
      await updateDoc(userDocRef, bioData); 
      setUser(prevUser => prevUser ? { ...prevUser, bio: newBio } : null);
      return { success: true };
    } catch (err: any) {
      console.warn(`AuthContext: Failed to update user bio. Error Code: ${err.code}, Message: ${err.message}`, err);
      return { success: false, error: { message: err.message || "Could not update bio.", code: err.code } };
    }
  }, []);


  useEffect(() => {
    if (loading) return; 

    const publicOnlyPages = ['/login', '/register', '/reset-password']; 
    const setUsernamePage = '/set-username';
    const rootPage = '/';
    const currentPath = pathname; 

    if (user) { 
      if (!user.username) { 
        if (currentPath !== setUsernamePage) {
          router.replace(setUsernamePage);
        }
      } else { 
        if (publicOnlyPages.includes(currentPath) || currentPath === setUsernamePage || currentPath === rootPage) {
          router.replace('/explore');
        }
      }
    } else { 
      const isAppPage = !publicOnlyPages.includes(currentPath) && currentPath !== rootPage && currentPath !== setUsernamePage;
      if (isAppPage) {
        router.replace('/login');
      }
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
        updateUserUsername,
        changePassword, 
        updateUserBirthDate, 
        updateUserGender,
        updateUserProfilePicture,
        updateUserBio 
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
