const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireLogin } = require('../middleware/auth');
const { logAktivitas } = require('../utils/aktivitas');

// Semua route asrama hanya boleh diakses setelah login
router.use(requireLogin);

function ambilNilai(body) {
    return {
        nama_asrama: (body.nama_asrama || '').trim(),
        keterangan: (body.keterangan || '').trim()
    };
}

// Daftar Asrama (beserta jumlah santri)
router.get('/asrama', async (req, res) => {
    const [asrama] = await db.execute(`
        SELECT
            a.id_asrama,
            a.nama_asrama,
            a.keterangan,
            COUNT(s.id_santri) AS jumlah_santri
        FROM asrama a
        LEFT JOIN santri s ON s.id_asrama = a.id_asrama
        GROUP BY a.id_asrama, a.nama_asrama, a.keterangan
        ORDER BY a.nama_asrama ASC
    `);

    res.render('asrama/index', {
        asrama,
        msg: req.query.msg,
        error: req.query.error
    });
});

// Form Tambah Asrama
router.get('/asrama/tambah', (req, res) => {
    res.render('asrama/form', { mode: 'tambah', asrama: null, error: null, nilai: null });
});

// Simpan Asrama Baru
router.post('/asrama', async (req, res) => {
    const nilai = ambilNilai(req.body);

    if (!nilai.nama_asrama) {
        return res.status(400).render('asrama/form', {
            mode: 'tambah', asrama: null, error: 'Nama asrama wajib diisi.', nilai
        });
    }

    const [duplikat] = await db.execute(
        'SELECT id_asrama FROM asrama WHERE nama_asrama = ?',
        [nilai.nama_asrama]
    );
    if (duplikat.length > 0) {
        return res.status(400).render('asrama/form', {
            mode: 'tambah', asrama: null, error: 'Nama asrama sudah ada.', nilai
        });
    }

    const [hasil] = await db.execute(
        'INSERT INTO asrama (nama_asrama, keterangan) VALUES (?, ?)',
        [nilai.nama_asrama, nilai.keterangan || null]
    );

    await logAktivitas(req.session.id_petugas, 'TAMBAH_ASRAMA',
        `Menambahkan asrama "${nilai.nama_asrama}" (#${hasil.insertId})`);
    res.redirect('/asrama?msg=' + encodeURIComponent('Asrama berhasil ditambahkan.'));
});

// Form Edit Asrama
router.get('/asrama/:id/edit', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.redirect('/asrama');

    const [rows] = await db.execute('SELECT * FROM asrama WHERE id_asrama = ?', [id]);
    if (rows.length === 0) return res.status(404).send('Asrama tidak ditemukan.');

    res.render('asrama/form', { mode: 'edit', asrama: rows[0], error: null, nilai: null });
});

// Proses Ubah Asrama (ganti nama / keterangan)
router.post('/asrama/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.redirect('/asrama');

    const nilai = ambilNilai(req.body);

    if (!nilai.nama_asrama) {
        return res.status(400).render('asrama/form', {
            mode: 'edit', asrama: { id_asrama: id, ...nilai }, error: 'Nama asrama wajib diisi.', nilai
        });
    }

    const [duplikat] = await db.execute(
        'SELECT id_asrama FROM asrama WHERE nama_asrama = ? AND id_asrama <> ?',
        [nilai.nama_asrama, id]
    );
    if (duplikat.length > 0) {
        return res.status(400).render('asrama/form', {
            mode: 'edit', asrama: { id_asrama: id, ...nilai }, error: 'Nama asrama sudah dipakai.', nilai
        });
    }

    await db.execute(
        'UPDATE asrama SET nama_asrama = ?, keterangan = ? WHERE id_asrama = ?',
        [nilai.nama_asrama, nilai.keterangan || null, id]
    );

    await logAktivitas(req.session.id_petugas, 'UBAH_ASRAMA',
        `Mengubah asrama #${id} menjadi "${nilai.nama_asrama}"`);
    res.redirect('/asrama?msg=' + encodeURIComponent('Asrama berhasil diubah.'));
});

// Proses Hapus Asrama (ditolak jika masih ada santri)
router.post('/asrama/:id/hapus', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.redirect('/asrama');

    const [santriTerkait] = await db.execute(
        'SELECT COUNT(*) AS jumlah FROM santri WHERE id_asrama = ?',
        [id]
    );
    if (santriTerkait[0].jumlah > 0) {
        return res.redirect('/asrama?error=' + encodeURIComponent(
            `Asrama ini masih ditempati ${santriTerkait[0].jumlah} santri. Pindahkan/ubah asrama santri terlebih dahulu.`
        ));
    }

    const [hasil] = await db.execute('DELETE FROM asrama WHERE id_asrama = ?', [id]);
    if (hasil.affectedRows === 0) {
        return res.redirect('/asrama?error=' + encodeURIComponent('Asrama tidak ditemukan.'));
    }

    await logAktivitas(req.session.id_petugas, 'HAPUS_ASRAMA', `Menghapus asrama #${id}`);
    res.redirect('/asrama?msg=' + encodeURIComponent('Asrama berhasil dihapus.'));
});

module.exports = router;