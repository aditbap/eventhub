
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// ==========================================================================================
// Firebase Configuration for Firebase Studio Development
// ==========================================================================================
// PENTING: Ganti nilai placeholder di bawah ini dengan kredensial aktual dari proyek Firebase Anda.
// Anda bisa menemukan nilai-nilai ini di Firebase Console > Project settings > General > Your apps > Web app.
// ==========================================================================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // GANTI DENGAN API KEY ANDA
  authDomain: "YOUR_AUTH_DOMAIN", // GANTI DENGAN AUTH DOMAIN ANDA
  projectId: "YOUR_PROJECT_ID", // GANTI DENGAN PROJECT ID ANDA
  storageBucket: "YOUR_STORAGE_BUCKET", // GANTI DENGAN STORAGE BUCKET ANDA
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // GANTI DENGAN MESSAGING SENDER ID ANDA
  appId: "YOUR_APP_ID" // GANTI DENGAN APP ID ANDA
};

// Pemeriksaan dasar untuk memastikan placeholder telah diganti
if (firebaseConfig.apiKey === "YOUR_API_KEY" || firebaseConfig.projectId === "YOUR_PROJECT_ID") {
  console.warn(
    "PERINGATAN: Konfigurasi Firebase masih menggunakan nilai placeholder. " +
    "Harap perbarui src/lib/firebase.ts dengan kredensial proyek Firebase Anda yang sebenarnya agar aplikasi berfungsi dengan benar."
  );
}

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Error initializing Firebase app:", error);
    // Jika konfigurasi belum diganti, errornya mungkin karena itu.
    if (firebaseConfig.apiKey === "YOUR_API_KEY") {
        throw new Error(
            `Gagal menginisialisasi Firebase: ${(error as Error).message}. ` +
            "Sepertinya Anda masih menggunakan placeholder 'YOUR_API_KEY' di src/lib/firebase.ts. " +
            "Harap ganti dengan nilai API Key proyek Firebase Anda."
        );
    }
    throw new Error(`Failed to initialize Firebase: ${(error as Error).message}.`);
  }
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { auth, db, storage };
