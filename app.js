const express = require('express');
const session = require('express-session');
const path = require('path');

const authRoutes = require('./routes/auth');

const app = express();

// Konfigurasi View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware Parse Form Data & Public Folder
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Konfigurasi Session
app.use(session({
    secret: 'rahasia_paket_santri_123',
    resave: false,
    saveUninitialized: false
}));

// Route Utama
app.use('/', authRoutes);

// Route Dashboard
app.get('/dashboard', (req, res) => {
    if (!req.session.id_petugas) {
        return res.redirect('/login');
    }
    res.render('dashboard', { nama: req.session.nama_petugas });
});

// Jalankan Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});