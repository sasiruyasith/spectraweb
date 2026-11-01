const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'spectraweb.db'));

db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS devices (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL UNIQUE,
  model        TEXT    NOT NULL,
  min_freq_mhz REAL    NOT NULL CHECK (min_freq_mhz >= 0),
  max_freq_mhz REAL    NOT NULL,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  CHECK (max_freq_mhz > min_freq_mhz)
);

CREATE TABLE IF NOT EXISTS scans (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT    NOT NULL,
  device_id       INTEGER NOT NULL REFERENCES devices(id) ON DELETE RESTRICT,
  band            TEXT    NOT NULL CHECK (band IN ('HF','VHF','UHF','SHF')),
  start_freq_mhz  REAL    NOT NULL,
  stop_freq_mhz   REAL    NOT NULL,
  peak_freq_mhz   REAL    NOT NULL,
  peak_power_dbm  REAL    NOT NULL,
  noise_floor_dbm REAL    NOT NULL,
  location        TEXT    NOT NULL,
  scanned_at      TEXT    NOT NULL,
  notes           TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  CHECK (stop_freq_mhz > start_freq_mhz),
  CHECK (peak_freq_mhz BETWEEN start_freq_mhz AND stop_freq_mhz)
);

CREATE INDEX IF NOT EXISTS idx_scans_device ON scans(device_id);
`);

// sample data so the app isn't empty on first run
const count = db.prepare('SELECT COUNT(*) AS n FROM devices').get().n;
if (count === 0) {
  const addDev = db.prepare('INSERT INTO devices (name, model, min_freq_mhz, max_freq_mhz) VALUES (?, ?, ?, ?)');
  addDev.run('Lab SDR 1', 'RTL-SDR v3', 24, 1766);
  addDev.run('Bench Analyzer', 'Rigol DSA815', 0.009, 1500);
  addDev.run('Field Unit', 'HackRF One', 1, 6000);

  const addScan = db.prepare(`INSERT INTO scans
    (title, device_id, band, start_freq_mhz, stop_freq_mhz, peak_freq_mhz, peak_power_dbm, noise_floor_dbm, location, scanned_at, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  addScan.run('FM broadcast sweep', 1, 'VHF', 88, 108, 97.4, -32.5, -95, 'EIE Lab 2', '2026-10-20T10:15', 'Strong local FM station');
  addScan.run('Airband check', 1, 'VHF', 118, 137, 124.8, -61.2, -102, 'Rooftop', '2026-10-21T14:40', null);
  addScan.run('GSM 900 downlink', 2, 'UHF', 935, 960, 947.6, -48.9, -98.5, 'EIE Lab 2', '2026-10-22T09:05', 'Several carriers visible');
  addScan.run('ISM 433 band', 3, 'UHF', 430, 440, 433.92, -55.1, -104, 'Car park', '2026-10-23T16:30', 'Key fob bursts');
  addScan.run('WiFi 2.4 GHz', 3, 'SHF', 2400, 2500, 2437, -41.3, -92, 'Library', '2026-10-24T11:20', 'Channel 6 busiest');
}

module.exports = db;
