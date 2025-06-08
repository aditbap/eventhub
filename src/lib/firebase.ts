
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// ==========================================================================================
// Firebase Configuration - Updated to use Environment Variables
// ==========================================================================================
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  // Basic check to ensure that critical config values are present
  // Firebase SDK will throw more specific errors if they are invalid.
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error(
      "Firebase configuration is missing critical values (apiKey or projectId). " +
      "Please ensure NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set in your environment."
    );
    // Avoid throwing an error here directly to let the Firebase SDK attempt initialization
    // and provide its own potentially more detailed error message.
  }
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Error initializing Firebase app:", error);
    // Re-throw the error if critical, or handle as appropriate
    throw new Error(`Failed to initialize Firebase: ${(error as Error).message}. Ensure all NEXT_PUBLIC_FIREBASE_ environment variables are correctly set.`);
  }
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { auth, db, storage };
