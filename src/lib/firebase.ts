
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// ==========================================================================================
// !! PENTING !!
// GANTI NILAI PLACEHOLDER DI BAWAH INI DENGAN KONFIGURASI PROYEK FIREBASE ANDA YANG SEBENARNYA
// Anda bisa mendapatkan ini dari Firebase Console:
// Project settings > General > Your apps > Firebase SDK snippet > Config
// ==========================================================================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // <-- GANTI INI
  authDomain: "YOUR_AUTH_DOMAIN", // <-- GANTI INI
  projectId: "YOUR_PROJECT_ID", // <-- GANTI INI
  storageBucket: "YOUR_STORAGE_BUCKET", // <-- GANTI INI
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // <-- GANTI INI
  appId: "YOUR_APP_ID" // <-- GANTI INI
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

export { auth, db };
