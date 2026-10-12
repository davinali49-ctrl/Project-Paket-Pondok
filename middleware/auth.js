// Middleware untuk melindungi halaman yang hanya boleh diakses setelah login
const requireLogin = (req, res, next) => {
    if (!req.session || !req.session.id_petugas) {
        return res.redirect('/login?error=2');
    }
    next();
};

module.exports = { requireLogin };