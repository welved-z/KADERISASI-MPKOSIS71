# Sistem Kaderisasi Digital — MPK OSIS SMAN 71 (CAS)

Deskripsi singkat
-----------------
Sistem Kaderisasi Digital adalah platform evaluasi berbasis narasi (experience‑based) yang dirancang untuk MPK OSIS SMAN 71. Sistem ini membantu Angkatan 27 (penilai) mendokumentasikan perkembangan Angkatan 28 (kader) secara terstruktur, aman, dan mudah diakses melalui perangkat mobile.

Arsitektur
----------
- Frontend: Static HTML/CSS/Vanilla JS (dapat di‑host di GitHub Pages)
- Auth & Database: Firebase Authentication (Email/Password) + Cloud Firestore
- Admin tools: Node.js script untuk pembuatan akun massal penilai (menggunakan Firebase Admin SDK)

Fitur utama
-----------
- Login gateway untuk penilai (role-based)
- Input jurnal naratif & tag kompetensi
- Pembatasan penilaian berdasarkan divisi (hanya penilai dari divisi yang sama dapat menilai kader)
- Hybrid Card-Table (mobile card view / desktop table view)
- Prevent double-submit via deterministic document ID + transaction + Firestore Rules
- Admin script untuk pembuatan akun massal (CSV → Firebase Auth + Firestore users docs)

Keamanan & privasi
------------------
- Jangan commit service account JSON, kredensial, atau token ke repo publik.
- Simpan service account di mesin lokal dan jalankan skrip admin secara lokal.
- API keys Firebase yang dimasukkan di frontend (firebaseConfig) bukan secret, namun Firestore Rules mengamankan penulisan/akses data.
- Selalu gunakan HTTPS saat mem-publish.

Lisensi
-------
Proyek ini dilisensikan di bawah MIT License — lihat file LICENSE untuk detail.

Mulai cepat
-----------
1. Clone/siapkan repo ini.
2. Buat proyek Firebase (Auth + Firestore). Terapkan `firestore.rules` yang disediakan pada console Firestore.
3. Isi konfigurasi Firebase pada `app.js` (frontend).
4. Jalankan skrip admin `create-users.js` secara lokal untuk membuat akun penilai dari CSV (lihat README_ADMIN.md).
5. Deploy frontend ke GitHub Pages.

Dokumentasi admin
-----------------
Petunjuk admin untuk pembuatan akun massal dan langkah penting lainnya ada di `README_ADMIN.md`.

Kontak
------
Untuk bantuan teknis lanjutan atau pengaturan khusus, hubungi pengembang internal atau admin proyek.
