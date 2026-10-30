const db = require('../config/database');

// Mencatat aktivitas petugas ke tabel riwayat_aktivitas
async function logAktivitas(idPetugas, aktivitas, keterangan = null, modul = null) {
    try {
        await db.execute(
            'INSERT INTO riwayat_aktivitas (id_petugas, modul, aktivitas, keterangan) VALUES (?, ?, ?, ?)',
            [idPetugas, modul, aktivitas, keterangan]
        );
    } catch (error) {
        console.error('Gagal mencatat riwayat aktivitas:', error.message);
    }
}

module.exports = { logAktivitas };