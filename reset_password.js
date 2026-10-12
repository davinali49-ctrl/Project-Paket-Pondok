const bcrypt = require('bcryptjs');
const db = require('./config/database');

/*
 * Skrip untuk membuat atau memperbarui akun petugas.
 *
 * Penggunaan (jalankan dari folder proyek):
 *   node reset_password.js <username> <password> <nama_petugas>
 *
 * Contoh:
 *   node reset_password.js Davin 123456 "Muhammad Davin Ali Fikri"
 *
 * Jika username sudah ada, hanya password dan nama yang diperbarui.
 * Jika belum ada, akun baru dibuat.
 */
async function buatAtauUpdatePetugas() {
    const [, , username, password, namaPetugas] = process.argv;

    if (!username || !password || !namaPetugas) {
        console.error('❌ Penggunaan: node reset_password.js <username> <password> <nama_petugas>');
        process.exit(1);
    }

    try {
        // Enkripsi password
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        // Cek apakah username sudah ada
        const [rows] = await db.execute(
            'SELECT id_petugas FROM petugas WHERE username = ? LIMIT 1',
            [username]
        );

        if (rows.length > 0) {
            await db.execute(
                'UPDATE petugas SET password = ?, nama_petugas = ? WHERE username = ?',
                [hashPassword, namaPetugas, username]
            );
            console.log(`✅ Akun petugas "${username}" berhasil diperbarui.`);
        } else {
            await db.execute(
                'INSERT INTO petugas (username, password, nama_petugas) VALUES (?, ?, ?)',
                [username, hashPassword, namaPetugas]
            );
            console.log(`✅ Akun petugas baru "${username}" berhasil dibuat.`);
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exitCode = 1;
    } finally {
        await db.end().catch(() => {});
        process.exit();
    }
}

buatAtauUpdatePetugas();