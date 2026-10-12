require('dotenv').config({ quiet: true });
const mysql = require('mysql2');

// Konfigurasi koneksi MySQL dari variabel lingkungan (dengan nilai default lokal)
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_paket_santri',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Cek koneksi saat aplikasi dimulai
db.getConnection((err, connection) => {
    if (err) {
        console.error('Koneksi MySQL gagal: ', err.message || err);
        return;
    }
    // Kembalikan koneksi ke pool setelah berhasil terhubung
    connection.release();
    console.log(`Terhubung ke database MySQL (${process.env.DB_NAME || 'db_paket_santri'})`);
});

// Ekspor versi promise dari pool untuk dipakai dengan async/await
module.exports = db.promise();