const bcrypt = require('bcryptjs');
const db = require('./config/database');

async function updateAtauTambahPetugas() {
    try {
        const usernameBaru = 'Davin';
        const passwordBaru = '123456';
        const namaPetugas = 'Muhammad Davin Ali Fikri'; // Bisa disesuaikan nama lengkapnya

        // Enkripsi password
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(passwordBaru, salt);

        // Cek apakah username 'ahmad' ada untuk di-update, atau insert 'Davin' baru
        const [petugasLama] = await db.execute('SELECT id_petugas FROM petugas WHERE username = "ahmad" LIMIT 1');

        if (petugasLama.length > 0) {
            // Update petugas 'ahmad' menjadi 'Davin'
            await db.execute(
                'UPDATE petugas SET username = ?, password = ?, nama_petugas = ? WHERE username = "ahmad"',
                [usernameBaru, hashPassword, namaPetugas]
            );
            console.log(`✅ BERHASIL! Akun petugas 'ahmad' diubah menjadi username: "${usernameBaru}" dan password: "${passwordBaru}"`);
        } else {
            // Tambahkan petugas baru 'Davin' jika 'ahmad' tidak ada
            await db.execute(
                'INSERT INTO petugas (username, password, nama_petugas) VALUES (?, ?, ?)',
                [usernameBaru, hashPassword, namaPetugas]
            );
            console.log(`✅ BERHASIL! Akun petugas baru ditambahkan: username: "${usernameBaru}" dan password: "${passwordBaru}"`);
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        process.exit();
    }
}

updateAtauTambahPetugas();