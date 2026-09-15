const mysql = require('mysql2');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_paket_santri',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('Koneksi Mysql gagal: ', err);
    } else {
        console.log('Terhubung ke database MySQL (db_paket_santri)');
        conn.release();
    }
});

module.exports = db.promise();