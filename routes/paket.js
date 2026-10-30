const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireLogin } = require('../middleware/auth');
const { logAktivitas } = require('../utils/aktivitas');

// Semua route paket hanya boleh diakses setelah login
router.use(requireLogin);

const JENIS_PENGAMBILAN = ['AMBIL_SENDIRI', 'DIWAKILKAN'];

// Data pendukung untuk form: daftar santri & daftar ekspedisi (tabel master)
async function dataForm() {
    const [santri] = await db.execute(`
        SELECT s.id_santri, s.nama_santri, a.nama_asrama
        FROM santri s
        LEFT JOIN asrama a ON s.id_asrama = a.id_asrama
        ORDER BY s.nama_santri ASC
    `);
    const [ekspedisi] = await db.execute(
        'SELECT id_ekspedisi, nama_ekspedisi FROM ekspedisi ORDER BY nama_ekspedisi ASC'
    );
    return { santri, ekspedisi };
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
    if (!nilai.ekspedisi) return 'Ekspedisi wajib diisi.';
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
    const idEkspedisi = Number(nilai.ekspedisi);
    const [hasil] = await db.execute(
        `INSERT INTO paket (no_resi, nama_pada_paket, id_santri, id_petugas, id_ekspedisi, tanggal_diterima, keterangan)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            nilai.no_resi || null,
            nilai.nama_pada_paket,
            idSantri,
            req.session.id_petugas,
            idEkspedisi,
            nilai.tanggal_diterima,
            nilai.keterangan || null
        ]
    );

    await logAktivitas(req.session.id_petugas, 'TAMBAH_PAKET', `Menambahkan paket #${hasil.insertId} untuk "${nilai.nama_pada_paket}"`, 'PAKET');
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
    const idEkspedisi = Number(nilai.ekspedisi);
    await db.execute(
        `UPDATE paket
         SET no_resi = ?, nama_pada_paket = ?, id_santri = ?, id_ekspedisi = ?, tanggal_diterima = ?, keterangan = ?
         WHERE id_paket = ?`,
        [
            nilai.no_resi || null,
            nilai.nama_pada_paket,
            idSantri,
            idEkspedisi,
            nilai.tanggal_diterima,
            nilai.keterangan || null,
            id
        ]
    );

    await logAktivitas(req.session.id_petugas, 'UBAH_PAKET', `Mengubah paket #${id}`, 'PAKET');
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
            `INSERT INTO pengambilan (id_paket, id_petugas, nama_pengambil, jenis_pengambilan, tanggal_diambil)
             VALUES (?, ?, ?, ?, NOW())`,
            [id, req.session.id_petugas, namaPengambil, jenisPengambilan]
        );
        await logAktivitas(req.session.id_petugas, 'TANDAI_DIAMBIL', `Paket #${id} diambil oleh ${namaPengambil} (${jenisPengambilan})`, 'PENGAMBILAN');
        res.redirect('/dashboard?msg=' + encodeURIComponent('Paket berhasil ditandai sudah diambil.'));
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.redirect('/dashboard?msg=' + encodeURIComponent('Paket ini sudah tercatat diambil.'));
        }
        throw error;
    }
});

// Proses Identifikasi Penerima (menghubungkan paket ke santri pemilik)
router.post('/paket/:id/identifikasi', async (req, res) => {
    const id = Number(req.params.id);
    const idSantri = req.body.id_santri ? Number(req.body.id_santri) || null : null;

    if (!Number.isInteger(id) || !idSantri) {
        return res.redirect('/dashboard?msg=' + encodeURIComponent('Pilih santri terlebih dahulu.'));
    }

    await db.execute('UPDATE paket SET id_santri = ? WHERE id_paket = ?', [idSantri, id]);
    await logAktivitas(req.session.id_petugas, 'IDENTIFIKASI_PENERIMA', `Paket #${id} dihubungkan ke santri #${idSantri}`, 'PAKET');
    res.redirect('/dashboard?msg=' + encodeURIComponent('Paket berhasil dihubungkan ke santri.'));
});

// Proses Batal Pengambilan (DEViasi dari Business Rule 10, keputusan pengguna)
router.post('/paket/:id/batal-ambil', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.redirect('/dashboard');

    const [hasil] = await db.execute('DELETE FROM pengambilan WHERE id_paket = ?', [id]);
    await logAktivitas(req.session.id_petugas, 'BATAL_DIAMBIL', `Membatalkan status diambil paket #${id}`, 'PENGAMBILAN');

    if (hasil.affectedRows === 0) {
        return res.redirect('/dashboard?msg=' + encodeURIComponent('Paket tidak punya catatan diambil.'));
    }
    res.redirect('/dashboard?msg=' + encodeURIComponent('Status pengambilan paket dibatalkan.'));
});

// Proses Hapus Paket (hapus pengambilan terlebih dahulu karena FK tanpa CASCADE)
router.post('/paket/:id/hapus', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.redirect('/dashboard');

    await db.execute('DELETE FROM pengambilan WHERE id_paket = ?', [id]);
    const [hasil] = await db.execute('DELETE FROM paket WHERE id_paket = ?', [id]);

    await logAktivitas(req.session.id_petugas, 'HAPUS_PAKET', `Menghapus paket #${id}`, 'PAKET');
    if (hasil.affectedRows === 0) {
        return res.redirect('/dashboard?msg=' + encodeURIComponent('Paket tidak ditemukan.'));
    }
    res.redirect('/dashboard?msg=' + encodeURIComponent('Paket berhasil dihapus.'));
});

module.exports = router;