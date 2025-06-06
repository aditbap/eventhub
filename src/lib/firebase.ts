
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage'; // Added

// ==========================================================================================
// Firebase Configuration - Updated with user-provided values.
// ==========================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyBhyfSnC_GCEEcBXoqWxsqjbbJDPCQCGQY",
  authDomain: "upj-event-hub.firebaseapp.com",
  projectId: "upj-event-hub",
  storageBucket: "upj-event-hub.appspot.com", // Corrected from .firebasestorage.app
  messagingSenderId: "329944442699",
  appId: "1:329944442699:web:a328d9566c438e08b2eace"
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app); // Added

export { auth, db, storage }; // Modified
