const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');

// 1. Tampilkan Halaman Login
router.get('/login', (req, res) => {
    res.render('login', { error: req.query.error });
});

// 2. Proses Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Query menggunakan Prepared Statement (Aman dari SQL Injection)
        const [rows] = await db.execute('SELECT * FROM petugas WHERE username = ?', [username]);

        if (rows.length === 1) {
            const petugas = rows[0];
            
            // Cek Password Hash dengan bcrypt
            const isMatch = await bcrypt.compare(password, petugas.password);

            if (isMatch) {
                // Simpan data ke session
                req.session.id_petugas = petugas.id_petugas;
                req.session.nama_petugas = petugas.nama_petugas;

                return res.redirect('/dashboard');
            }
        }

        // Jika username / password salah
        res.redirect('/login?error=1');
    } catch (error) {
        console.error(error);
        res.status(500).send('Terjadi kesalahan pada server');
    }
});

// 3. Process Logout
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

module.exports = router;