const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireLogin } = require('../middleware/auth');
const { logAktivitas } = require('../utils/aktivitas');

// Semua route pengumuman hanya boleh diakses setelah login
router.use(requireLogin);

// Daftar Pengumuman
router.get('/pengumuman', async (req, res) => {
    const [pengumuman] = await db.execute(`
        SELECT
            pg.id_pengumuman,
            pg.id_paket,
            pg.isi_pengumuman,
            pg.tanggal_pengumuman,
            p.no_resi,
            p.nama_pada_paket,
            s.nama_santri,
            a.nama_asrama
        FROM pengumuman pg
        JOIN paket p ON pg.id_paket = p.id_paket
        LEFT JOIN santri s ON p.id_santri = s.id_santri
        LEFT JOIN asrama a ON s.id_asrama = a.id_asrama
        ORDER BY pg.tanggal_pengumuman DESC
    `);

    res.render('pengumuman/index', {
        pengumuman,
        msg: req.query.msg,
        error: req.query.error
    });
});

// Form Tambah Pengumuman
router.get('/pengumuman/tambah', async (req, res) => {
    const [paket] = await db.execute(`
        SELECT p.id_paket, p.nama_pada_paket, p.no_resi, s.nama_santri
        FROM paket p
        LEFT JOIN santri s ON p.id_santri = s.id_santri
        ORDER BY p.tanggal_diterima DESC
    `);
    res.render('pengumuman/form', { mode: 'tambah', pengumuman: null, paket, error: null, nilai: null });
});

// Simpan Pengumuman Baru
router.post('/pengumuman', async (req, res) => {
    const isi = (req.body.isi_pengumuman || '').trim();
    const idPaket = req.body.id_paket ? Number(req.body.id_paket) || null : null;

    if (!isi || !idPaket) {
        const [paket] = await db.execute(`
            SELECT p.id_paket, p.nama_pada_paket, p.no_resi, s.nama_santri
            FROM paket p
            LEFT JOIN santri s ON p.id_santri = s.id_santri
            ORDER BY p.tanggal_diterima DESC
        `);
        return res.status(400).render('pengumuman/form', {
            mode: 'tambah',
            pengumuman: null,
            paket,
            error: 'Isi pengumuman dan paket wajib diisi.',
            nilai: { isi_pengumuman: isi, id_paket: idPaket || '' }
        });
    }

    const [hasil] = await db.execute(
        'INSERT INTO pengumuman (id_paket, isi_pengumuman) VALUES (?, ?)',
        [idPaket, isi]
    );

    await logAktivitas(req.session.id_petugas, 'TAMBAH_PENGUMUMAN',
        `Menambahkan pengumuman untuk paket #${idPaket}`);
    res.redirect('/pengumuman?msg=' + encodeURIComponent('Pengumuman berhasil ditambahkan.'));
});

// Proses Hapus Pengumuman (FK CASCADE ke paket, bebas aman)
router.post('/pengumuman/:id/hapus', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.redirect('/pengumuman');

    const [hasil] = await db.execute('DELETE FROM pengumuman WHERE id_pengumuman = ?', [id]);
    if (hasil.affectedRows === 0) {
        return res.redirect('/pengumuman?msg=' + encodeURIComponent('Pengumuman tidak ditemukan.'));
    }

    await logAktivitas(req.session.id_petugas, 'HAPUS_PENGUMUMAN', `Menghapus pengumuman #${id}`);
    res.redirect('/pengumuman?msg=' + encodeURIComponent('Pengumuman berhasil dihapus.'));
});

module.exports = router;