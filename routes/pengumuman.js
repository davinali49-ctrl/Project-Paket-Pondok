const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireLogin } = require('../middleware/auth');

// Semua route pengumuman hanya boleh diakses setelah login
router.use(requireLogin);

// Format tanggal ringkas untuk teks WhatsApp: DD/MM/YYYY HH:MM
function formatTanggalSingkat(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Halaman Pengumuman: daftar otomatis paket yang masuk & BELUM diambil
router.get('/pengumuman', async (req, res) => {
    const q = (req.query.q || '').trim();

    let sql = `
        SELECT
            p.id_paket,
            p.no_resi,
            p.nama_pada_paket,
            s.nama_santri,
            a.nama_asrama,
            e.nama_ekspedisi,
            p.tanggal_diterima
        FROM paket p
        LEFT JOIN santri s ON p.id_santri = s.id_santri
        LEFT JOIN asrama a ON s.id_asrama = a.id_asrama
        LEFT JOIN ekspedisi e ON p.id_ekspedisi = e.id_ekspedisi
        LEFT JOIN pengambilan pg ON p.id_paket = pg.id_paket
        WHERE pg.id_pengambilan IS NULL
    `;
    const params = [];

    if (q) {
        const kata = '%' + q.replace(/[\\%_]/g, (m) => '\\' + m) + '%';
        sql += ' AND (p.no_resi LIKE ? OR p.nama_pada_paket LIKE ? OR s.nama_santri LIKE ?)';
        params.push(kata, kata, kata);
    }

    sql += ' ORDER BY p.tanggal_diterima DESC';

    const [daftarPaket] = await db.execute(sql, params);

    // Susun teks siap-salin untuk grup WhatsApp
    const waktuUpdate = formatTanggalSingkat(new Date());
    const baris = daftarPaket.map((item, i) => {
        const nama = item.nama_santri
            ? `${item.nama_santri}${item.nama_asrama ? ` (${item.nama_asrama})` : ''}`
            : item.nama_pada_paket;
        const bagian = [`${i + 1}. *${nama}*`];
        if (item.no_resi) bagian.push(`Resi: ${item.no_resi}`);
        if (item.nama_ekspedisi) bagian.push(item.nama_ekspedisi);
        bagian.push(formatTanggalSingkat(item.tanggal_diterima));
        return bagian.join(' — ');
    });

    const teksWhatsapp = daftarPaket.length > 0
        ? [
            '📦 *PENGUMUMAN PAKET SANTRI*',
            'Berikut paket yang sudah datang dan *belum diambil*',
            `(update: ${waktuUpdate}):`,
            '',
            ...baris,
            '',
            `Total: ${daftarPaket.length} paket`,
            'Silakan diambil di sekretariat. Terima kasih.'
        ].join('\n')
        : '';

    res.render('pengumuman/index', {
        paket: daftarPaket,
        q,
        teksWhatsapp,
        msg: req.query.msg
    });
});

module.exports = router;