const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireLogin } = require('../middleware/auth');
const { logAktivitas } = require('../utils/aktivitas');

// Semua route santri hanya boleh diakses setelah login
router.use(requireLogin);

function ambilNilai(body) {
    return {
        nama_santri: (body.nama_santri || '').trim(),
        asrama: (body.asrama || '').trim(),
        no_hp: (body.no_hp || '').trim(),
        jenis_kelamin: (body.jenis_kelamin || '').trim(),
        keterangan: (body.keterangan || '').trim()
    };
}

// Daftar Santri (dengan asrama dari tabel master)
router.get('/santri', async (req, res) => {
    const [santri] = await db.execute(`
        SELECT
            s.id_santri,
            s.nama_santri,
            a.nama_asrama,
            COUNT(p.id_paket) AS jumlah_paket,
            COALESCE(SUM(CASE WHEN pg.id_pengambilan IS NOT NULL THEN 1 ELSE 0 END), 0) AS paket_diambil
        FROM santri s
        LEFT JOIN asrama a ON s.id_asrama = a.id_asrama
        LEFT JOIN paket p ON p.id_santri = s.id_santri
        LEFT JOIN pengambilan pg ON pg.id_paket = p.id_paket
        GROUP BY s.id_santri, s.nama_santri, a.nama_asrama
        ORDER BY s.nama_santri ASC
    `);

    res.render('santri/index', {
        santri,
        msg: req.query.msg,
        error: req.query.error
    });
});

// Form Tambah Santri
router.get('/santri/tambah', async (req, res) => {
    const [asrama] = await db.execute('SELECT id_asrama, nama_asrama FROM asrama ORDER BY nama_asrama ASC');
    res.render('santri/form', {
        mode: 'tambah',
        santri: null,
        daftarAsrama: asrama,
        error: null,
        nilai: null
    });
});

// Simpan Santri Baru
router.post('/santri', async (req, res) => {
    const nilai = ambilNilai(req.body);
    const idAsrama = nilai.asrama ? Number(nilai.asrama) || null : null;

    if (!nilai.nama_santri || !idAsrama) {
        const [asrama] = await db.execute('SELECT id_asrama, nama_asrama FROM asrama ORDER BY nama_asrama ASC');
        return res.status(400).render('santri/form', {
            mode: 'tambah',
            santri: null,
            daftarAsrama: asrama,
            error: 'Nama santri dan asrama wajib diisi.',
            nilai
        });
    }

    const [hasil] = await db.execute(
        'INSERT INTO santri (nama_santri, id_asrama, no_hp, jenis_kelamin, keterangan) VALUES (?, ?, ?, ?, ?)',
        [nilai.nama_santri, idAsrama, nilai.no_hp || null, nilai.jenis_kelamin || null, nilai.keterangan || null]
    );

    await logAktivitas(req.session.id_petugas, 'TAMBAH_SANTRI', `Menambahkan santri "${nilai.nama_santri}" (#${hasil.insertId})`, 'SANTRI');
    res.redirect('/santri?msg=' + encodeURIComponent('Santri berhasil ditambahkan.'));
});

// Form Edit Santri
router.get('/santri/:id/edit', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.redirect('/santri');

    const [rows] = await db.execute('SELECT * FROM santri WHERE id_santri = ?', [id]);
    if (rows.length === 0) return res.status(404).send('Santri tidak ditemukan.');

    const [asrama] = await db.execute('SELECT id_asrama, nama_asrama FROM asrama ORDER BY nama_asrama ASC');
    res.render('santri/form', {
        mode: 'edit',
        santri: rows[0],
        daftarAsrama: asrama,
        error: null,
        nilai: null
    });
});

// Proses Ubah Santri
router.post('/santri/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.redirect('/santri');

    const nilai = ambilNilai(req.body);
    const idAsrama = nilai.asrama ? Number(nilai.asrama) || null : null;

    if (!nilai.nama_santri || !idAsrama) {
        const [asrama] = await db.execute('SELECT id_asrama, nama_asrama FROM asrama ORDER BY nama_asrama ASC');
        return res.status(400).render('santri/form', {
            mode: 'edit',
            santri: { id_santri: id, ...nilai },
            daftarAsrama: asrama,
            error: 'Nama santri dan asrama wajib diisi.',
            nilai
        });
    }

    await db.execute(
        'UPDATE santri SET nama_santri = ?, id_asrama = ?, no_hp = ?, jenis_kelamin = ?, keterangan = ? WHERE id_santri = ?',
        [nilai.nama_santri, idAsrama, nilai.no_hp || null, nilai.jenis_kelamin || null, nilai.keterangan || null, id]
    );

    await logAktivitas(req.session.id_petugas, 'UBAH_SANTRI', `Mengubah santri #${id}`, 'SANTRI');
    res.redirect('/santri?msg=' + encodeURIComponent('Santri berhasil diubah.'));
});

// Proses Hapus Santri (ditolak jika masih terpaut paket)
router.post('/santri/:id/hapus', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.redirect('/santri');

    const [paketTerkait] = await db.execute(
        'SELECT COUNT(*) AS jumlah FROM paket WHERE id_santri = ?',
        [id]
    );

    if (paketTerkait[0].jumlah > 0) {
        return res.redirect('/santri?error=' + encodeURIComponent(
            `Santri ini masih memiliki ${paketTerkait[0].jumlah} paket. Hapus/hubungkan paketnya terlebih dahulu.`
        ));
    }

    await db.execute('DELETE FROM santri WHERE id_santri = ?', [id]);
    await logAktivitas(req.session.id_petugas, 'HAPUS_SANTRI', `Menghapus santri #${id}`, 'SANTRI');
    res.redirect('/santri?msg=' + encodeURIComponent('Santri berhasil dihapus.'));
});

module.exports = router;