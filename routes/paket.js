const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireLogin } = require('../middleware/auth');
const { logAktivitas } = require('../utils/aktivitas');

// Semua route paket hanya boleh diakses setelah login
router.use(requireLogin);

const JENIS_PENGAMBILAN = ['AMBIL_SENDIRI', 'DIWAKILKAN'];

// Data pendukung untuk form: daftar santri & ekspedisi yang pernah dipakai
async function dataForm() {
    const [santri] = await db.execute(
        'SELECT id_santri, nama_santri, asrama FROM santri ORDER BY nama_santri ASC'
    );
    const [daftarEkspedisi] = await db.execute(
        'SELECT DISTINCT ekspedisi FROM paket ORDER BY ekspedisi ASC'
    );
    return {
        santri,
        ekspedisi: daftarEkspedisi.map((r) => r.ekspedisi)
    };
}

function ambilNilai(body) {
    return {
        no_resi: (body.no_resi || '').trim(),
        nama_pada_paket: (body.nama_pada_paket || '').trim(),
        ekspedisi: (body.ekspedisi || '').trim(),
        tanggal_diterima: (body.tanggal_diterima || '').trim(),
        keterangan: (body.keterangan || '').trim(),
        id_santri: body.id_santri || ''
    };
}

function cekValidasi(nilai) {
    if (!nilai.nama_pada_paket) return 'Nama pada paket wajib diisi.';
    if (!nilai.ekspedisi) return 'Nama ekspedisi wajib diisi.';
    if (!nilai.tanggal_diterima) return 'Tanggal diterima wajib diisi.';
    return null;
}

// Form Tambah Paket
router.get('/paket/tambah', async (req, res) => {
    const { santri, ekspedisi } = await dataForm();
    res.render('paket/form', { mode: 'tambah', paket: null, santri, ekspedisi, error: null, nilai: null });
});

// Simpan Paket Baru
router.post('/paket', async (req, res) => {
    const nilai = ambilNilai(req.body);
    const error = cekValidasi(nilai);

    if (error) {
        const { santri, ekspedisi } = await dataForm();
        return res.status(400).render('paket/form', {
            mode: 'tambah', paket: null, santri, ekspedisi, error, nilai
        });
    }

    const idSantri = nilai.id_santri ? Number(nilai.id_santri) || null : null;
    const [hasil] = await db.execute(
        `INSERT INTO paket (no_resi, nama_pada_paket, id_santri, id_petugas, ekspedisi, tanggal_diterima, keterangan)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            nilai.no_resi || null,
            nilai.nama_pada_paket,
            idSantri,
            req.session.id_petugas,
            nilai.ekspedisi,
            nilai.tanggal_diterima,
            nilai.keterangan || null
        ]
    );

    await logAktivitas(req.session.id_petugas, 'TAMBAH_PAKET',
        `Menambahkan paket #${hasil.insertId} untuk "${nilai.nama_pada_paket}" (${nilai.ekspedisi})`);
    res.redirect('/dashboard?msg=' + encodeURIComponent('Paket berhasil ditambahkan.'));
});

// Form Edit Paket
router.get('/paket/:id/edit', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.redirect('/dashboard');

    const [rows] = await db.execute('SELECT * FROM paket WHERE id_paket = ?', [id]);
    if (rows.length === 0) return res.status(404).send('Paket tidak ditemukan.');

    const { santri, ekspedisi } = await dataForm();
    res.render('paket/form', { mode: 'edit', paket: rows[0], santri, ekspedisi, error: null, nilai: null });
});

// Proses Ubah Paket
router.post('/paket/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.redirect('/dashboard');

    const nilai = ambilNilai(req.body);
    const error = cekValidasi(nilai);

    if (error) {
        const { santri, ekspedisi } = await dataForm();
        return res.status(400).render('paket/form', {
            mode: 'edit',
            paket: { id_paket: id, ...nilai },
            santri, ekspedisi, error, nilai
        });
    }

    const idSantri = nilai.id_santri ? Number(nilai.id_santri) || null : null;
    await db.execute(
        `UPDATE paket
         SET no_resi = ?, nama_pada_paket = ?, id_santri = ?, ekspedisi = ?, tanggal_diterima = ?, keterangan = ?
         WHERE id_paket = ?`,
        [
            nilai.no_resi || null,
            nilai.nama_pada_paket,
            idSantri,
            nilai.ekspedisi,
            nilai.tanggal_diterima,
            nilai.keterangan || null,
            id
        ]
    );

    await logAktivitas(req.session.id_petugas, 'UBAH_PAKET', `Mengubah paket #${id}`);
    res.redirect('/dashboard?msg=' + encodeURIComponent('Paket berhasil diubah.'));
});

// Proses Tandai Paket Sudah Diambil
router.post('/paket/:id/ambil', async (req, res) => {
    const id = Number(req.params.id);
    const namaPengambil = (req.body.nama_pengambil || '').trim();
    const jenisPengambilan = (req.body.jenis_pengambilan || '').trim();

    if (!Number.isInteger(id) || !namaPengambil || !JENIS_PENGAMBILAN.includes(jenisPengambilan)) {
        return res.redirect('/dashboard?msg=' + encodeURIComponent('Data pengambilan tidak lengkap.'));
    }

    try {
        await db.execute(
            `INSERT INTO pengambilan (id_paket, nama_pengambil, jenis_pengambilan, tanggal_diambil)
             VALUES (?, ?, ?, NOW())`,
            [id, namaPengambil, jenisPengambilan]
        );
        await logAktivitas(req.session.id_petugas, 'TANDAI_DIAMBIL',
            `Paket #${id} diambil oleh ${namaPengambil} (${jenisPengambilan})`);
        res.redirect('/dashboard?msg=' + encodeURIComponent('Paket berhasil ditandai sudah diambil.'));
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.redirect('/dashboard?msg=' + encodeURIComponent('Paket ini sudah tercatat diambil.'));
        }
        throw error;
    }
});

// Proses Hapus Paket (hapus pengambilan terlebih dahulu karena FK tanpa CASCADE)
router.post('/paket/:id/hapus', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.redirect('/dashboard');

    await db.execute('DELETE FROM pengambilan WHERE id_paket = ?', [id]);
    const [hasil] = await db.execute('DELETE FROM paket WHERE id_paket = ?', [id]);

    await logAktivitas(req.session.id_petugas, 'HAPUS_PAKET', `Menghapus paket #${id}`);
    if (hasil.affectedRows === 0) {
        return res.redirect('/dashboard?msg=' + encodeURIComponent('Paket tidak ditemukan.'));
    }
    res.redirect('/dashboard?msg=' + encodeURIComponent('Paket berhasil dihapus.'));
});

module.exports = router;