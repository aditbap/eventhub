
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// ==========================================================================================
// !! PENTING !! PENTING !! PENTING !!
// ANDA HARUS MENGGANTI NILAI PLACEHOLDER DI BAWAH INI DENGAN
// KONFIGURASI PROYEK FIREBASE ANDA YANG SEBENARNYA.
//
// Anda bisa mendapatkan ini dari Firebase Console:
// 1. Pergi ke https://console.firebase.google.com/
// 2. Pilih proyek Anda.
// 3. Klik ikon roda gigi (Pengaturan) -> Project settings.
// 4. Di tab "General", scroll ke "Your apps".
// 5. Klik aplikasi Web Anda (atau buat baru jika belum ada).
// 6. Pilih "Config" di bawah "Firebase SDK snippet".
// 7. Salin seluruh objek konfigurasi dan tempel di sini, menggantikan objek di bawah.
// ==========================================================================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE", // <-- GANTI INI DENGAN API KEY ANDA
  authDomain: "YOUR_AUTH_DOMAIN_HERE", // <-- GANTI INI
  projectId: "YOUR_PROJECT_ID_HERE", // <-- GANTI INI
  storageBucket: "YOUR_STORAGE_BUCKET_HERE", // <-- GANTI INI
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE", // <-- GANTI INI
  appId: "YOUR_APP_ID_HERE" // <-- GANTI INI
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
