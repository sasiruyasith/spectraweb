-- SpectraWeb database schema (MySQL 8)
CREATE DATABASE IF NOT EXISTS spectraweb;
USE spectraweb;

DROP TABLE IF EXISTS scans;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(60)  NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  role          ENUM('admin','analyst','viewer') NOT NULL DEFAULT 'analyst',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE devices (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(50) NOT NULL UNIQUE,
  model        VARCHAR(50) NOT NULL,
  min_freq_mhz DECIMAL(10,4) NOT NULL,
  max_freq_mhz DECIMAL(10,4) NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_dev_range CHECK (max_freq_mhz > min_freq_mhz AND min_freq_mhz >= 0)
);

CREATE TABLE scans (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(80) NOT NULL,
  device_id       INT NOT NULL,
  created_by      INT NULL,
  band            ENUM('HF','VHF','UHF','SHF') NOT NULL,
  start_freq_mhz  DECIMAL(10,4) NOT NULL,
  stop_freq_mhz   DECIMAL(10,4) NOT NULL,
  peak_freq_mhz   DECIMAL(10,4) NOT NULL,
  peak_power_dbm  DECIMAL(6,2)  NOT NULL,
  noise_floor_dbm DECIMAL(6,2)  NOT NULL,
  location        VARCHAR(80) NOT NULL,
  scanned_at      DATETIME NOT NULL,
  notes           VARCHAR(500) NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_scan_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE RESTRICT,
  CONSTRAINT fk_scan_user   FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_scan_range CHECK (stop_freq_mhz > start_freq_mhz),
  CONSTRAINT chk_scan_peak  CHECK (peak_freq_mhz BETWEEN start_freq_mhz AND stop_freq_mhz),
  INDEX idx_scan_band (band),
  INDEX idx_scan_date (scanned_at)
);
