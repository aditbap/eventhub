
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
  apiKey: "AIzaSyBhyfSnC_GCEEcBXoqWxsqjbbJDPCQCGQY", // GANTI DENGAN API KEY ANDA
  authDomain: "upj-event-hub.firebaseapp.com", // GANTI DENGAN AUTH DOMAIN ANDA
  projectId: "upj-event-hub", // GANTI DENGAN PROJECT ID ANDA
  storageBucket: "upj-event-hub.firebasestorage.app", // GANTI DENGAN STORAGE BUCKET ANDA
  messagingSenderId: "329944442699", // GANTI DENGAN MESSAGING SENDER ID ANDA
  appId: "1:329944442699:web:a328d9566c438e08b2eace" // GANTI DENGAN APP ID ANDA
};

// Pemeriksaan dasar untuk memastikan placeholder telah diganti (opsional, tapi membantu)
if (firebaseConfig.apiKey === "YOUR_API_KEY" || firebaseConfig.projectId === "YOUR_PROJECT_ID") {
  console.warn(
    "PERINGATAN: Konfigurasi Firebase di src/lib/firebase.ts masih menggunakan nilai placeholder. " +
    "Harap perbarui dengan kredensial proyek Firebase Anda yang sebenarnya agar aplikasi berfungsi dengan benar."
  );
  // Anda bisa memilih untuk melempar error di sini jika ingin lebih tegas
  // throw new Error("Konfigurasi Firebase placeholder belum diganti. Harap perbarui src/lib/firebase.ts");
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
