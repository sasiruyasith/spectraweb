const express = require('express');
const db = require('../db');
const { validateDevice } = require('../validate');

const router = express.Router();

router.get('/', (req, res) => {
  const devices = db.prepare(`SELECT d.*, COUNT(s.id) AS scan_count
    FROM devices d LEFT JOIN scans s ON s.device_id = d.id
    GROUP BY d.id ORDER BY d.name`).all();
  res.render('devices/index', { title: 'Devices', devices });
});

router.get('/new', (req, res) => {
  res.render('devices/form', { title: 'New device', device: {}, errors: [], action: '/devices' });
});

router.post('/', (req, res) => {
  const { data, errors } = validateDevice(req.body);
  if (!errors.length) {
    try {
      db.prepare('INSERT INTO devices (name, model, min_freq_mhz, max_freq_mhz) VALUES (?, ?, ?, ?)')
        .run(data.name, data.model, data.min_freq_mhz, data.max_freq_mhz);
      return res.redirect('/devices?msg=Device+added');
    } catch (err) {
      errors.push(err.message.includes('UNIQUE') ? 'A device with that name already exists.' : err.message);
    }
  }
  res.status(400).render('devices/form', { title: 'New device', device: req.body, errors, action: '/devices' });
});

router.get('/:id/edit', (req, res) => {
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
  if (!device) return res.status(404).render('error', { title: 'Not found', message: 'Device not found.' });
  res.render('devices/form', { title: 'Edit device', device, errors: [], action: `/devices/${device.id}/edit` });
});

router.post('/:id/edit', (req, res) => {
  const id = req.params.id;
  const { data, errors } = validateDevice(req.body);
  if (!errors.length) {
    try {
      const r = db.prepare('UPDATE devices SET name=?, model=?, min_freq_mhz=?, max_freq_mhz=? WHERE id=?')
        .run(data.name, data.model, data.min_freq_mhz, data.max_freq_mhz, id);
      if (!r.changes) return res.status(404).render('error', { title: 'Not found', message: 'Device not found.' });
      return res.redirect('/devices?msg=Device+updated');
    } catch (err) {
      errors.push(err.message.includes('UNIQUE') ? 'A device with that name already exists.' : err.message);
    }
  }
  res.status(400).render('devices/form', {
    title: 'Edit device', device: { ...req.body, id }, errors, action: `/devices/${id}/edit`,
  });
});

router.post('/:id/delete', (req, res) => {
  // FK is ON DELETE RESTRICT, so devices that still have scans can't be removed
  const used = db.prepare('SELECT COUNT(*) AS n FROM scans WHERE device_id = ?').get(req.params.id).n;
  if (used > 0) {
    return res.redirect('/devices?msg=' + encodeURIComponent(`Cannot delete: device has ${used} scan(s). Delete or move them first.`));
  }
  db.prepare('DELETE FROM devices WHERE id = ?').run(req.params.id);
  res.redirect('/devices?msg=Device+deleted');
});

module.exports = router;
