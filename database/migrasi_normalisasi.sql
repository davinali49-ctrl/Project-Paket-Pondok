-- ============================================================
-- Migrasi Normalisasi Skema
-- Tujuan : selaras dengan laporan analisis kebutuhan:
--          - santri.asrama (varchar)  ->  santri.id_asrama (FK ke asrama)
--          - paket.ekspedisi (varchar)->  paket.id_ekspedisi (FK ke ekspedisi)
--
-- Catatan : jalankan SEKALI pada database dengan data lama.
--           Sebelum menjalankan, pastikan backup sudah dibuat:
--           mysqldump -u root --databases db_paket_santri > backup.sql
-- ============================================================

USE `db_paket_santri`;

-- 1. Isi tabel master asrama dari nilai DISTINCT kolom santri.asrama
INSERT INTO `asrama` (`nama_asrama`, `keterangan`)
SELECT DISTINCT s.`asrama`, NULL
FROM `santri` s
WHERE s.`asrama` IS NOT NULL AND s.`asrama` <> ''
  AND s.`asrama` NOT IN (SELECT `nama_asrama` FROM `asrama`);

-- 2. Isi tabel master ekspedisi dari nilai DISTINCT kolom paket.ekspedisi
INSERT INTO `ekspedisi` (`nama_ekspedisi`, `keterangan`)
SELECT DISTINCT p.`ekspedisi`, NULL
FROM `paket` p
WHERE p.`ekspedisi` IS NOT NULL AND p.`ekspedisi` <> ''
  AND p.`ekspedisi` NOT IN (SELECT `nama_ekspedisi` FROM `ekspedisi`);

-- 3. Tambah kolom relasi pada santri
ALTER TABLE `santri`
    ADD COLUMN IF NOT EXISTS `id_asrama` int(11) DEFAULT NULL,
    ADD KEY IF NOT EXISTS `id_asrama` (`id_asrama`);

-- 4. Petakan santri ke asrama berdasarkan nama asrama
UPDATE `santri` s
JOIN `asrama` a ON s.`asrama` = a.`nama_asrama`
SET s.`id_asrama` = a.`id_asrama`;

-- 5. Tambah kolom relasi pada paket
ALTER TABLE `paket`
    ADD COLUMN IF NOT EXISTS `id_ekspedisi` int(11) DEFAULT NULL,
    ADD KEY IF NOT EXISTS `id_ekspedisi` (`id_ekspedisi`);

-- 6. Petakan paket ke ekspedisi berdasarkan nama ekspedisi
UPDATE `paket` p
JOIN `ekspedisi` e ON p.`ekspedisi` = e.`nama_ekspedisi`
SET p.`id_ekspedisi` = e.`id_ekspedisi`;

-- 7. Pastikan tidak ada baris yang gagal dipetakan (harus menghasilkan 0 baris)
SELECT 'santri tanpa asrama' AS cek, COUNT(*) AS jumlah FROM `santri` WHERE `id_asrama` IS NULL
UNION ALL
SELECT 'paket tanpa ekspedisi', COUNT(*) FROM `paket` WHERE `id_ekspedisi` IS NULL;

-- 8. Jadikan NOT NULL + pasang foreign key
ALTER TABLE `santri`
    MODIFY COLUMN `id_asrama` int(11) NOT NULL,
    ADD CONSTRAINT `santri_ibfk_asrama` FOREIGN KEY (`id_asrama`) REFERENCES `asrama` (`id_asrama`);

ALTER TABLE `paket`
    MODIFY COLUMN `id_ekspedisi` int(11) NOT NULL,
    ADD CONSTRAINT `paket_ibfk_ekspedisi` FOREIGN KEY (`id_ekspedisi`) REFERENCES `ekspedisi` (`id_ekspedisi`);

-- 9. Hapus kolom teks lama
ALTER TABLE `santri` DROP COLUMN IF EXISTS `asrama`;
ALTER TABLE `paket` DROP COLUMN IF EXISTS `ekspedisi`;

-- ============================================================
-- Verifikasi akhir
-- ============================================================
SELECT 'master asrama' AS tabel, COUNT(*) AS jumlah FROM `asrama`
UNION ALL SELECT 'master ekspedisi', COUNT(*) FROM `ekspedisi`
UNION ALL SELECT 'santri', COUNT(*) FROM `santri`
UNION ALL SELECT 'paket', COUNT(*) FROM `paket`;