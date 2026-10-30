-- ============================================================
-- Migrasi Perubahan Sesuai Revisi Laporan
-- Tujuan : Menyesuaikan skema dengan hasil diskusi
--          - Petugas: tambah no_hp
--          - Santri: tambah no_hp, jenis_kelamin (hapus duplikasi jika ada)
--          - Asrama: ganti jadi pembimbing_asrama, tambah no_hp_pembimbing, kapasitas
--          - Ekspedisi: tambah no_telepon, alamat
--          - Pengambilan: tambah id_petugas
--          - Pengumuman: tambah id_petugas, status_pengumuman
--          - Riwayat Aktivitas: tambah modul
-- ============================================================

USE `db_paket_santri`;

-- 1. Petugas
ALTER TABLE `petugas`
  ADD COLUMN IF NOT EXISTS `no_hp` varchar(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `status_aktif` enum('AKTIF','NONAKTIF') NOT NULL DEFAULT 'AKTIF';

-- 2. Asrama (ganti nama_wali_asrama jadi pembimbing_asrama)
ALTER TABLE `asrama`
  CHANGE COLUMN IF EXISTS `keterangan` `keterangan` text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `pembimbing_asrama` varchar(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `no_hp_pembimbing` varchar(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `kapasitas` int(11) DEFAULT NULL;

-- 3. Santri
ALTER TABLE `santri`
  ADD COLUMN IF NOT EXISTS `no_hp` varchar(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `jenis_kelamin` enum('L','P') DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `keterangan` text DEFAULT NULL;

-- 4. Ekspedisi
ALTER TABLE `ekspedisi`
  ADD COLUMN IF NOT EXISTS `no_telepon` varchar(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `alamat` text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `status_aktif` enum('AKTIF','NONAKTIF') NOT NULL DEFAULT 'AKTIF';

-- 5. Pengambilan
ALTER TABLE `pengambilan`
  ADD COLUMN IF NOT EXISTS `id_petugas` int(11) DEFAULT NULL,
  ADD KEY IF NOT EXISTS `id_petugas` (`id_petugas`),
  ADD CONSTRAINT `pengambilan_ibfk_2` FOREIGN KEY (`id_petugas`) REFERENCES `petugas` (`id_petugas`);

-- 6. Pengumuman
ALTER TABLE `pengumuman`
  ADD COLUMN IF NOT EXISTS `id_petugas` int(11) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `status_pengumuman` enum('TERKIRIM','SELESAI') NOT NULL DEFAULT 'TERKIRIM',
  ADD KEY IF NOT EXISTS `id_petugas` (`id_petugas`),
  ADD CONSTRAINT `pengumuman_ibfk_2` FOREIGN KEY (`id_petugas`) REFERENCES `petugas` (`id_petugas`);

-- 7. Riwayat Aktivitas
ALTER TABLE `riwayat_aktivitas`
  ADD COLUMN IF NOT EXISTS `modul` varchar(50) DEFAULT NULL;

-- Verifikasi
SELECT 'petugas' as tabel, COUNT(*) as jumlah FROM petugas
UNION ALL SELECT 'santri', COUNT(*) FROM santri
UNION ALL SELECT 'asrama', COUNT(*) FROM asrama
UNION ALL SELECT 'ekspedisi', COUNT(*) FROM ekspedisi
UNION ALL SELECT 'paket', COUNT(*) FROM paket
UNION ALL SELECT 'pengambilan', COUNT(*) FROM pengambilan
UNION ALL SELECT 'pengumuman', COUNT(*) FROM pengumuman
UNION ALL SELECT 'riwayat_aktivitas', COUNT(*) FROM riwayat_aktivitas;
