const express = require('express');
const db = require('../db');
const { validateScan, BANDS } = require('../validate');

const router = express.Router();

const SORTS = {
  newest: 's.scanned_at DESC',
  oldest: 's.scanned_at ASC',
  power: 's.peak_power_dbm DESC',
  freq: 's.start_freq_mhz ASC',
  title: 's.title COLLATE NOCASE ASC',
};

function getDevices() {
  return db.prepare('SELECT id, name, min_freq_mhz, max_freq_mhz FROM devices ORDER BY name').all();
}

// list + search + filter + sort
router.get('/', (req, res) => {
  const q = (req.query.q || '').trim();
  const band = req.query.band || '';
  const device = req.query.device || '';
  const sort = SORTS[req.query.sort] ? req.query.sort : 'newest';

  let sql = `SELECT s.*, d.name AS device_name FROM scans s JOIN devices d ON d.id = s.device_id WHERE 1=1`;
  const params = [];
  if (q) {
    sql += ' AND (s.title LIKE ? OR s.location LIKE ? OR s.notes LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (BANDS.includes(band)) {
    sql += ' AND s.band = ?';
    params.push(band);
  }
  if (device) {
    sql += ' AND s.device_id = ?';
    params.push(Number(device));
  }
  sql += ' ORDER BY ' + SORTS[sort];

  const scans = db.prepare(sql).all(...params);
  res.render('scans/index', {
    title: 'Scans', scans, devices: getDevices(), bands: BANDS,
    filters: { q, band, device, sort },
  });
});

router.get('/new', (req, res) => {
  res.render('scans/form', {
    title: 'New scan', scan: {}, devices: getDevices(), bands: BANDS, errors: [], action: '/scans',
  });
});

router.post('/', (req, res) => {
  const { data, errors } = validateScan(req.body);
  if (errors.length) {
    return res.status(400).render('scans/form', {
      title: 'New scan', scan: req.body, devices: getDevices(), bands: BANDS, errors, action: '/scans',
    });
  }
  try {
    const r = db.prepare(`INSERT INTO scans
      (title, device_id, band, start_freq_mhz, stop_freq_mhz, peak_freq_mhz, peak_power_dbm, noise_floor_dbm, location, scanned_at, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      data.title, data.device_id, data.band, data.start_freq_mhz, data.stop_freq_mhz, data.peak_freq_mhz,
      data.peak_power_dbm, data.noise_floor_dbm, data.location, data.scanned_at, data.notes);
    res.redirect(`/scans/${r.lastInsertRowid}?msg=Scan+created`);
  } catch (err) {
    res.status(400).render('scans/form', {
      title: 'New scan', scan: req.body, devices: getDevices(), bands: BANDS,
      errors: ['Could not save: ' + err.message], action: '/scans',
    });
  }
});

function findScan(id) {
  return db.prepare(`SELECT s.*, d.name AS device_name, d.model AS device_model
    FROM scans s JOIN devices d ON d.id = s.device_id WHERE s.id = ?`).get(id);
}

router.get('/:id', (req, res) => {
  const scan = findScan(req.params.id);
  if (!scan) return res.status(404).render('error', { title: 'Not found', message: 'Scan not found.' });
  res.render('scans/show', { title: scan.title, scan });
});

router.get('/:id/edit', (req, res) => {
  const scan = findScan(req.params.id);
  if (!scan) return res.status(404).render('error', { title: 'Not found', message: 'Scan not found.' });
  res.render('scans/form', {
    title: 'Edit scan', scan, devices: getDevices(), bands: BANDS, errors: [], action: `/scans/${scan.id}/edit`,
  });
});

router.post('/:id/edit', (req, res) => {
  const id = req.params.id;
  if (!findScan(id)) return res.status(404).render('error', { title: 'Not found', message: 'Scan not found.' });

  const { data, errors } = validateScan(req.body);
  const formArgs = { title: 'Edit scan', scan: { ...req.body, id }, devices: getDevices(), bands: BANDS, action: `/scans/${id}/edit` };
  if (errors.length) return res.status(400).render('scans/form', { ...formArgs, errors });

  try {
    db.prepare(`UPDATE scans SET title=?, device_id=?, band=?, start_freq_mhz=?, stop_freq_mhz=?, peak_freq_mhz=?,
      peak_power_dbm=?, noise_floor_dbm=?, location=?, scanned_at=?, notes=?, updated_at=datetime('now') WHERE id=?`).run(
      data.title, data.device_id, data.band, data.start_freq_mhz, data.stop_freq_mhz, data.peak_freq_mhz,
      data.peak_power_dbm, data.noise_floor_dbm, data.location, data.scanned_at, data.notes, id);
    res.redirect(`/scans/${id}?msg=Scan+updated`);
  } catch (err) {
    res.status(400).render('scans/form', { ...formArgs, errors: ['Could not save: ' + err.message] });
  }
});

router.post('/:id/delete', (req, res) => {
  const r = db.prepare('DELETE FROM scans WHERE id = ?').run(req.params.id);
  const msg = r.changes ? 'Scan+deleted' : 'Scan+was+already+removed';
  res.redirect('/scans?msg=' + msg);
});

module.exports = router;
