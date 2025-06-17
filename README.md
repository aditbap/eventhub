
# UPJ Event Hub: Your Campus Event Companion

UPJ Event Hub adalah aplikasi modern dan ramah pengguna yang dirancang untuk menjadi platform sentral dalam menemukan, membuat, dan mengelola berbagai acara di lingkungan Universitas Pembangunan Jaya (UPJ). Aplikasi ini bertujuan untuk menghubungkan mahasiswa, dosen, dan staf dengan menyediakan pengalaman acara yang mulus dan menarik.

## Keunggulan Aplikasi (Advantages)

*   **Sentralisasi Informasi:** Semua informasi acara kampus tersedia di satu tempat, mudah diakses, dan selalu diperbarui.
*   **Penemuan Acara yang Intuitif:** Dengan fitur pencarian cerdas, filter kategori yang jelas, dan rekomendasi acara berdasarkan lokasi, pengguna dapat dengan mudah menemukan kegiatan yang paling relevan dengan minat mereka.
*   **Peningkatan Keterlibatan Komunitas:** Mendorong partisipasi aktif dalam berbagai kegiatan kampus, mulai dari festival musik, bazar kuliner, turnamen olahraga, hingga seminar teknologi dan workshop kreatif.
*   **Manajemen Acara yang Efisien:** Pengguna yang berwenang (seperti admin atau penyelenggara acara terverifikasi) dapat dengan mudah membuat, mempublikasikan, dan mengelola acara mereka, lengkap dengan detail yang diperlukan.
*   **Pengalaman Pengguna Modern & Responsif:** Antarmuka yang bersih, menarik secara visual, dan intuitif, dioptimalkan untuk penggunaan yang lancar di berbagai perangkat, terutama perangkat seluler.
*   **Transaksi Tiket Terintegrasi:** Proses perolehan tiket (baik gratis maupun berbayar) yang aman dan mudah melalui integrasi dengan payment gateway Midtrans.
*   **Fitur Sosial Dasar:** Memungkinkan pengguna untuk terhubung dengan melihat profil pengguna lain dan mengelola daftar pengikut/mengikuti.

## Fitur Utama (Key Features)

1.  **Layar Onboarding:** Pengenalan visual yang menarik dengan branding UPJ Event Hub.
2.  **Penemuan Acara Berbasis Lokasi:** Secara otomatis mendeteksi lokasi pengguna (default "Bintaro") dan menampilkan acara-acara terdekat.
3.  **Pencarian & Filter Kategori:**
    *   Fitur pencarian untuk menemukan acara berdasarkan kata kunci.
    *   Filter acara berdasarkan kategori: Musik, Makanan, Olahraga, Teknologi, dan Lainnya, dengan indikator tab aktif.
4.  **Feed Acara & Rekomendasi Cerdas:**
    *   **Upcoming Events:** Tampilan kartu acara horizontal yang menampilkan acara-acara mendatang dalam 7 hari ke depan, lengkap dengan gambar, tanggal, judul, lokasi, dan jumlah peserta.
    *   **Near You:** Daftar vertikal acara yang relevan dengan lokasi pengguna, terutama yang masih baru atau memiliki sedikit peserta, untuk mendorong partisipasi.
    *   **Bookmark Acara:** Pengguna dapat menyimpan acara yang menarik minat mereka.
5.  **Halaman Detail Acara:** Menyajikan informasi komprehensif termasuk deskripsi lengkap, jadwal, peta lokasi (fitur akan datang), dan tombol "Get Ticket".
6.  **Proses Checkout Tiket:**
    *   Pengguna dapat "membeli" tiket (gratis atau berbayar).
    *   Transaksi dicatat di Firestore di bawah ID pengguna.
    *   Integrasi dengan Midtrans untuk menangani transaksi berbayar.
7.  **Registrasi & Login Pengguna:**
    *   Otentikasi aman menggunakan Firebase Authentication (Email/Password dan Google Sign-In).
    *   Formulir registrasi yang meminta Nama, Email, Username, dan Password.
    *   Validasi input dan pesan error yang jelas.
8.  **Halaman Profil Pengguna (Tab "Profile"):**
    *   **My Tickets:** Menampilkan daftar tiket yang telah diklaim pengguna, termasuk detail acara dan (opsional) kode QR.
    *   **My Created Events:** Daftar acara yang dibuat oleh pengguna tersebut.
    *   **Saved Events:** Daftar acara yang telah di-bookmark oleh pengguna.
    *   **Followers/Following:** Menampilkan daftar pengikut dan pengguna yang diikuti.
    *   **Edit Profil:** Pengguna dapat mengubah nama tampilan, username (dengan batasan), bio, foto profil, tanggal lahir, dan gender.
    *   **Logout:** Fungsi keluar yang aman.
9.  **Navigasi Bawah Intuitif (Bottom Navigation Bar):**
    *   **Explore:** Feed utama dan rekomendasi acara.
    *   **Events:** Daftar semua acara dengan opsi filter.
    *   **Create:** Akses untuk membuat acara baru (untuk pengguna yang berwenang).
    *   **Social:** Halaman untuk mencari dan menemukan pengguna lain.
    *   **Profile:** Akses ke informasi pengguna, tiket, dan pengaturan.
10. **Notifikasi Pengguna:** Pemberitahuan untuk konfirmasi tiket, pengingat acara, dan aktivitas sosial seperti pengikut baru.
11. **Pengaturan Aplikasi:**
    *   Pengaturan notifikasi.
    *   Pengelolaan detail akun (nama, username, password, bio, dll.).
    *   Opsi untuk menghapus akun.
12. **Otentikasi Persisten:** Pengguna tetap login setelah aplikasi ditutup dan dibuka kembali.

## Teknologi yang Digunakan (Technology Stack)

*   **Framework Frontend:** Next.js (menggunakan App Router untuk routing dan Server Components)
*   **Bahasa Pemrograman:** TypeScript
*   **Library UI:** React
*   **Sistem Komponen UI:** ShadCN UI (koleksi komponen siap pakai yang dibangun di atas Radix UI dan Tailwind CSS)
*   **Styling:** Tailwind CSS (utility-first CSS framework)
*   **Manajemen State (Klien):** React Context (untuk Auth), Zustand atau store kustom (untuk EventStore)
*   **Backend & Database:**
    *   **Firebase Authentication:** Untuk manajemen pengguna (login, registrasi).
    *   **Firestore:** Database NoSQL untuk menyimpan data acara, tiket, profil pengguna, notifikasi, dan chat.
    *   **Firebase Storage:** Untuk menyimpan file seperti gambar profil pengguna.
*   **Payment Gateway:** Midtrans (untuk memproses pembayaran tiket acara)
*   **AI (Potensial):** Genkit (framework AI dari Google, siap digunakan jika ada fitur berbasis AI yang akan dikembangkan di masa mendatang, seperti rekomendasi cerdas atau pembuatan deskripsi acara otomatis).
*   **Font:** Poppins (untuk headline) dan Roboto (untuk body text).
*   **Icons:** Lucide React.
*   **Form Handling:** React Hook Form dengan Zod untuk validasi skema.
*   **Animasi:** Framer Motion.

Aplikasi ini dibangun dengan fokus pada kualitas kode, keterbacaan, kinerja, dan pengalaman pengguna yang menyenangkan, mengikuti praktik terbaik pengembangan web modern.
