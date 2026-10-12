require('dotenv').config({ quiet: true });
const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./config/database'); // Import koneksi MySQL

const authRoutes = require('./routes/auth');
const paketRoutes = require('./routes/paket');
const santriRoutes = require('./routes/santri');
const { requireLogin } = require('./middleware/auth');

const app = express();

// Konfigurasi View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Helper tanggal untuk digunakan di dalam view EJS
app.locals.toDatetimeLocal = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
app.locals.formatTanggalWaktu = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString('id-ID');
};

// Middleware Parse Form Data & Folder Statis
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'asset')));

// Konfigurasi Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'ganti_dengan_secret_di_env',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 8 // sesi berlaku 8 jam
    }
}));

// Route Utama (Otomatis Lempar ke Dashboard)
app.get('/', (req, res) => {
    res.redirect('/dashboard');
});

// Route Auth (Login & Logout)
app.use('/', authRoutes);

// Route Modul Paket & Santri
app.use('/', paketRoutes);
app.use('/', santriRoutes);

// Route Dashboard - Menampilkan Daftar Paket Masuk
app.get('/dashboard', requireLogin, async (req, res) => {
    try {
        // Query paket disertai status pengambilan
        const [daftarPaket] = await db.execute(`
            SELECT
                p.id_paket,
                p.no_resi,
                p.nama_pada_paket,
                s.id_santri,
                s.nama_santri,
                p.ekspedisi AS nama_ekspedisi,
                p.tanggal_diterima,
                p.keterangan,
                pg.nama_pengambil,
                pg.jenis_pengambilan,
                pg.tanggal_diambil,
                CASE
                    WHEN pg.id_pengambilan IS NOT NULL THEN 'SUDAH DIAMBIL'
                    ELSE 'BELUM DIAMBIL'
                END AS status_paket
            FROM paket p
            LEFT JOIN santri s ON p.id_santri = s.id_santri
            LEFT JOIN pengambilan pg ON p.id_paket = pg.id_paket
            ORDER BY p.tanggal_diterima DESC
        `);

        // Render views/dashboard.ejs
        res.render('dashboard', {
            nama: req.session.nama_petugas,
            paket: daftarPaket,
            msg: req.query.msg
        });
    } catch (error) {
        console.error('Error mengambil data paket:', error);
        res.status(500).send(`
            <h3>Terjadi Kesalahan Database:</h3>
            <pre>${error.message}</pre>
        `);
    }
});

// Halaman tidak ditemukan
app.use((req, res) => {
    res.status(404).send('<h3>404 - Halaman tidak ditemukan</h3>');
});

// Penanganan error global
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send(`
        <h3>Terjadi Kesalahan Server:</h3>
        <pre>${err.message || err}</pre>
    `);
});

// Jalankan Server
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});