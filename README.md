# Sistem Pengelolaan Paket Santri

Aplikasi web untuk petugas pondok dalam mengelola informasi paket yang diterima santri.
Petugas login, melihat daftar paket beserta santri pemilik, ekspedisi, tanggal penerimaan,
status pengambilan, serta melakukan tambah/ubah/hapus paket dan pengambilan.

## Teknologi

- **Backend:** Node.js + Express 5 (CommonJS)
- **View:** EJS
- **Database:** MySQL/MariaDB (`mysql2`)
- **Login:** `bcryptjs` + `express-session`
- **Konfigurasi:** `dotenv`

## Persyaratan

- Node.js (versi yang mendukung Express 5)
- MySQL/MariaDB (misalnya via XAMPP)

## Langkah Instalasi

1. **Buat & impor database**

   ```bash
   mysql -u root -p < database/schema.sql
   ```

   Skema juga tersedia di `database/schema.sql` (8 tabel).

2. **Install dependensi**

   ```bash
   npm install
   ```

3. **Siapkan variabel lingkungan**

   ```bash
   cp .env.example .env
   ```

   Lalu sesuaikan nilai `DB_*` sesuai konfigurasi MySQL kamu, dan ganti
   `SESSION_SECRET` dengan string acak (contoh: hasil dari
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).

4. **Buat akun petugas pertama**

   ```bash
   node reset_password.js <username> <password> <nama_petugas>
   # contoh:
   node reset_password.js Davin 123456 "Muhammad Davin Ali Fikri"
   ```

5. **Jalankan aplikasi**

   ```bash
   npm start
   # atau
   node app.js
   ```

   Buka `http://localhost:3000`.

## Fitur

- Login & logout petugas (sesi + bcrypt)
- Dashboard daftar paket masuk dengan status pengambilan
- Tambah / ubah / hapus paket
- Tandai paket sudah diambil (mandiri / diwakilkan)
- Kelola data santri
- Pencatatan riwayat aktivitas petugas (`riwayat_aktivitas`)

## Struktur Utama

```
app.js                  Entry point & konfigurasi Express
config/database.js      Koneksi MySQL (dibaca dari .env)
middleware/auth.js      Middleware proteksi halaman (requireLogin)
routes/auth.js          Login & logout
routes/paket.js         CRUD paket + tandai pengambilan
routes/santri.js        CRUD santri
utils/aktivitas.js      Pencatat riwayat aktivitas
views/                  Template EJS
database/schema.sql     Skema database
```