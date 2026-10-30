-- ============================================
-- Skema Database Sistem Penerimaan dan Pengambilan Paket Santri
-- Database  : db_paket_santri
-- DBMS      : MySQL / MariaDB
-- Struktur mengikuti Laporan Analisis Kebutuhan Data Akademik
-- ============================================

CREATE DATABASE IF NOT EXISTS `db_paket_santri`
    DEFAULT CHARACTER SET utf8mb4
    COLLATE utf8mb4_general_ci;

USE `db_paket_santri`;

-- ------------------------------------------------------------
-- Entitas master
-- ------------------------------------------------------------

CREATE TABLE `asrama` (
  `id_asrama` int(11) NOT NULL AUTO_INCREMENT,
  `nama_asrama` varchar(100) NOT NULL,
  `pembimbing_asrama` varchar(100) DEFAULT NULL,
  `no_hp_pembimbing` varchar(20) DEFAULT NULL,
  `kapasitas` int(11) DEFAULT NULL,
  `keterangan` text DEFAULT NULL,
  PRIMARY KEY (`id_asrama`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ekspedisi` (
  `id_ekspedisi` int(11) NOT NULL AUTO_INCREMENT,
  `nama_ekspedisi` varchar(100) NOT NULL,
  `no_telepon` varchar(20) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `keterangan` text DEFAULT NULL,
  `status_aktif` enum('AKTIF','NONAKTIF') NOT NULL DEFAULT 'AKTIF',
  PRIMARY KEY (`id_ekspedisi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `petugas` (
  `id_petugas` int(11) NOT NULL AUTO_INCREMENT,
  `nama_petugas` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `no_hp` varchar(20) DEFAULT NULL,
  `status_aktif` enum('AKTIF','NONAKTIF') NOT NULL DEFAULT 'AKTIF',
  PRIMARY KEY (`id_petugas`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- Entitas transaksi
-- ------------------------------------------------------------

CREATE TABLE `santri` (
  `id_santri` int(11) NOT NULL AUTO_INCREMENT,
  `nama_santri` varchar(100) NOT NULL,
  `id_asrama` int(11) NOT NULL,
  `no_hp` varchar(20) DEFAULT NULL,
  `jenis_kelamin` enum('L','P') DEFAULT NULL,
  `keterangan` text DEFAULT NULL,
  PRIMARY KEY (`id_santri`),
  KEY `id_asrama` (`id_asrama`),
  CONSTRAINT `santri_ibfk_1` FOREIGN KEY (`id_asrama`) REFERENCES `asrama` (`id_asrama`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `paket` (
  `id_paket` int(11) NOT NULL AUTO_INCREMENT,
  `no_resi` varchar(100) DEFAULT NULL,
  `nama_pada_paket` varchar(100) NOT NULL,
  `id_santri` int(11) DEFAULT NULL,
  `id_petugas` int(11) NOT NULL,
  `id_ekspedisi` int(11) NOT NULL,
  `tanggal_diterima` datetime NOT NULL,
  `keterangan` text DEFAULT NULL,
  PRIMARY KEY (`id_paket`),
  KEY `id_santri` (`id_santri`),
  KEY `id_petugas` (`id_petugas`),
  KEY `id_ekspedisi` (`id_ekspedisi`),
  CONSTRAINT `paket_ibfk_1` FOREIGN KEY (`id_santri`) REFERENCES `santri` (`id_santri`),
  CONSTRAINT `paket_ibfk_2` FOREIGN KEY (`id_petugas`) REFERENCES `petugas` (`id_petugas`),
  CONSTRAINT `paket_ibfk_3` FOREIGN KEY (`id_ekspedisi`) REFERENCES `ekspedisi` (`id_ekspedisi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `pengambilan` (
  `id_pengambilan` int(11) NOT NULL AUTO_INCREMENT,
  `id_paket` int(11) NOT NULL,
  `id_petugas` int(11) DEFAULT NULL,
  `nama_pengambil` varchar(100) NOT NULL,
  `jenis_pengambilan` enum('AMBIL_SENDIRI','DIWAKILKAN') NOT NULL,
  `tanggal_diambil` datetime NOT NULL,
  PRIMARY KEY (`id_pengambilan`),
  UNIQUE KEY `id_paket` (`id_paket`),
  KEY `id_petugas` (`id_petugas`),
  CONSTRAINT `pengambilan_ibfk_1` FOREIGN KEY (`id_paket`) REFERENCES `paket` (`id_paket`),
  CONSTRAINT `pengambilan_ibfk_2` FOREIGN KEY (`id_petugas`) REFERENCES `petugas` (`id_petugas`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `pengumuman` (
  `id_pengumuman` int(11) NOT NULL AUTO_INCREMENT,
  `id_paket` int(11) NOT NULL,
  `id_petugas` int(11) DEFAULT NULL,
  `isi_pengumuman` text NOT NULL,
  `tanggal_pengumuman` datetime DEFAULT current_timestamp(),
  `status_pengumuman` enum('TERKIRIM','SELESAI') NOT NULL DEFAULT 'TERKIRIM',
  PRIMARY KEY (`id_pengumuman`),
  KEY `id_paket` (`id_paket`),
  KEY `id_petugas` (`id_petugas`),
  CONSTRAINT `pengumuman_ibfk_1` FOREIGN KEY (`id_paket`) REFERENCES `paket` (`id_paket`) ON DELETE CASCADE,
  CONSTRAINT `pengumuman_ibfk_2` FOREIGN KEY (`id_petugas`) REFERENCES `petugas` (`id_petugas`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `riwayat_aktivitas` (
  `id_riwayat` int(11) NOT NULL AUTO_INCREMENT,
  `id_petugas` int(11) NOT NULL,
  `modul` varchar(50) DEFAULT NULL,
  `aktivitas` varchar(255) NOT NULL,
  `tanggal_aktivitas` datetime DEFAULT current_timestamp(),
  `keterangan` text DEFAULT NULL,
  PRIMARY KEY (`id_riwayat`),
  KEY `id_petugas` (`id_petugas`),
  CONSTRAINT `riwayat_aktivitas_ibfk_1` FOREIGN KEY (`id_petugas`) REFERENCES `petugas` (`id_petugas`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
