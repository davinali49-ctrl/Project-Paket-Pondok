const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireLogin } = require('../middleware/auth');

// Semua route riwayat hanya boleh diakses setelah login
router.use(requireLogin);

// Riwayat Aktivitas Petugas (hanya baca, data diisi otomatis oleh logAktivitas)
router.get('/riwayat', async (req, res) => {
    const q = (req.query.q || '').trim();

    let sql = `
        SELECT
            r.id_riwayat,
            r.aktivitas,
            r.tanggal_aktivitas,
            r.keterangan,
            u.nama_petugas
        FROM riwayat_aktivitas r
        JOIN petugas u ON r.id_petugas = u.id_petugas
    `;
    const params = [];

    if (q) {
        const kata = '%' + q.replace(/[\\%_]/g, (m) => '\\' + m) + '%';
        sql += ' WHERE (r.aktivitas LIKE ? OR r.keterangan LIKE ? OR u.nama_petugas LIKE ?)';
        params.push(kata, kata, kata);
    }

    sql += ' ORDER BY r.id_riwayat DESC LIMIT 500';

    const [riwayat] = await db.execute(sql, params);

    res.render('riwayat/index', {
        riwayat,
        q,
        error: req.query.error
    });
});

module.exports = router;