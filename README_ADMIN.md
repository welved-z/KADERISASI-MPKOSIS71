# ADMIN — Bulk user creation & CSV conversion

Penting: jalankan seluruh langkah di mesin lokal dan jangan mengunggah service account JSON ke repo publik.

1) Persiapan service account
- Buka Firebase Console → Project Settings → Service accounts → Generate new private key → unduh file JSON.
- Simpan file di folder lokal (contoh: `serviceAccount.json`). Pastikan file ini di‑exclude oleh `.gitignore`.

2) Menyiapkan CSV penilai
- Gunakan `penilai_template.csv` sebagai format:
  username,name,division,password,role,angkatan
- Jika Anda punya daftar di Excel:
  - Buka file Excel → File → Save As → pilih CSV UTF-8 (*.csv)
- Jika Anda punya daftar di Word (table):
  - Salin tabel → paste ke Excel → simpan sebagai CSV
  - Atau gunakan script Python di bawah untuk ekstraksi (opsional).

3) Menjalankan skrip create-users
- Install Node.js (v14+).
- Di folder repo, jalankan:
  npm install
- Jalankan skrip:
  node create-users.js penilai.csv serviceAccount.json users-created.csv
- Output: `users-created.csv` berisi uid,username,email,password untuk distribusi ke penilai.

4) Mengisi koleksi participants
- Gunakan `participants_template.csv`. Anda bisa import CSV ke Firestore via console (Firestore → Import data) atau via script admin (saya bisa sediakan bila perlu).

5) Konversi Word / Excel → CSV (opsional)
- Manual (Excel): File → Save As → pilih CSV (UTF-8).
- Python (pandas) — untuk .xlsx:
```python
import pandas as pd
df = pd.read_excel('penilai.xlsx')
df.to_csv('penilai.csv', index=False)
```
- Untuk Word (.docx) yang berisi table (python-docx):
```python
from docx import Document
import csv

doc = Document('penilai.docx')
table = doc.tables[0]  # asumsikan table pertama adalah data
rows = []
for r in table.rows:
    rows.append([c.text.strip() for c in r.cells])

with open('penilai.csv','w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerows(rows)
```

6) Keamanan distribusi password
- Setelah `users-created.csv` dibuat, bagikan password secara aman (mis. via pesan pribadi, Google Drive terbatas, atau print pribadi).
- Sarankan penilai mengganti password setelah login pertama via Firebase Authentication → Account settings (fitur penggantian password tersedia di implementasi frontend jika Anda tambahkan fitur change password).

7) Jika terjadi error
- Jika akun gagal dibuat karena email sudah ada: cek Firebase Console → Authentication → Users.
- Jika Firestore write gagal: periksa aturan Firestore (rules) dan pastikan service account yang digunakan punya akses (default service account memiliki akses penuh).

Jika Anda butuh, saya juga bisa:
- Buatkan script import participants ke Firestore.
- Menyediakan instruksi distribusi aman untuk password.
- Menyediakan UI awal untuk penilai mengganti password pada login pertama.
