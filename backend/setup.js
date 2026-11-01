// creates the database + tables and loads sample data
// run with: npm run setup   (WARNING: drops existing tables)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  const schema = fs.readFileSync(path.join(__dirname, 'config', 'schema.sql'), 'utf8');
  await conn.query(schema);
  console.log('tables created');

  const hash = await bcrypt.hash('password123', 10);
  await conn.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES ?',
    [[
      ['Admin User', 'admin@spectraweb.lk', hash, 'admin'],
      ['Nimal Analyst', 'analyst@spectraweb.lk', hash, 'analyst'],
      ['Guest Viewer', 'viewer@spectraweb.lk', hash, 'viewer'],
    ]]
  );

  await conn.query(
    'INSERT INTO devices (name, model, min_freq_mhz, max_freq_mhz) VALUES ?',
    [[
      ['Lab SDR 1', 'RTL-SDR v3', 24, 1766],
      ['Bench Analyzer', 'Rigol DSA815', 0.009, 1500],
      ['Field Unit', 'HackRF One', 1, 6000],
    ]]
  );

  await conn.query(
    `INSERT INTO scans (title, device_id, created_by, band, start_freq_mhz, stop_freq_mhz, peak_freq_mhz,
      peak_power_dbm, noise_floor_dbm, location, scanned_at, notes) VALUES ?`,
    [[
      ['FM broadcast sweep', 1, 2, 'VHF', 88, 108, 97.4, -32.5, -95, 'EIE Lab 2', '2026-10-20 10:15:00', 'Strong local FM station'],
      ['Airband check', 1, 2, 'VHF', 118, 137, 124.8, -61.2, -102, 'Rooftop', '2026-10-21 14:40:00', null],
      ['GSM 900 downlink', 2, 1, 'UHF', 935, 960, 947.6, -48.9, -98.5, 'EIE Lab 2', '2026-10-22 09:05:00', 'Several carriers visible'],
      ['ISM 433 band', 3, 2, 'UHF', 430, 440, 433.92, -55.1, -104, 'Car park', '2026-10-23 16:30:00', 'Key fob bursts'],
      ['WiFi 2.4 GHz', 3, 1, 'SHF', 2400, 2500, 2437, -41.3, -92, 'Library', '2026-10-24 11:20:00', 'Channel 6 busiest'],
      ['40m amateur band', 2, 2, 'HF', 7, 7.3, 7.074, -70.4, -110, 'EIE Lab 2', '2026-10-25 19:00:00', 'FT8 activity'],
    ]]
  );

  console.log('sample data loaded');
  console.log('logins (password123): admin@spectraweb.lk / analyst@spectraweb.lk / viewer@spectraweb.lk');
  await conn.end();
}

run().catch(err => {
  console.error('setup failed:', err.message);
  process.exit(1);
});
