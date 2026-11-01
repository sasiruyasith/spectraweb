const db = require('../config/db');
const { BANDS } = require('../middleware/validate');

const SORTS = {
  newest: 's.scanned_at DESC',
  oldest: 's.scanned_at ASC',
  power: 's.peak_power_dbm DESC',
  freq: 's.start_freq_mhz ASC',
  title: 's.title ASC',
};

const BASE_SELECT = `SELECT s.*, d.name AS device_name, d.model AS device_model, u.name AS created_by_name
  FROM scans s
  JOIN devices d ON d.id = s.device_id
  LEFT JOIN users u ON u.id = s.created_by`;

// GET /api/scans?q=&band=&device=&sort=
exports.list = async (req, res) => {
  const { q, band, device } = req.query;
  const sort = SORTS[req.query.sort] ? req.query.sort : 'newest';

  let sql = BASE_SELECT + ' WHERE 1=1';
  const params = [];
  if (q) {
    sql += ' AND (s.title LIKE ? OR s.location LIKE ? OR s.notes LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like);
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

  const [rows] = await db.query(sql, params);
  res.json(rows);
};

exports.getOne = async (req, res) => {
  const [rows] = await db.query(BASE_SELECT + ' WHERE s.id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Scan not found' });
  res.json(rows[0]);
};

// dashboard numbers
exports.stats = async (req, res) => {
  const [[totals]] = await db.query(
    'SELECT COUNT(*) AS scans, MAX(peak_power_dbm) AS strongest, COUNT(DISTINCT location) AS locations FROM scans'
  );
  const [[devs]] = await db.query('SELECT COUNT(*) AS n FROM devices');
  const [byBand] = await db.query('SELECT band, COUNT(*) AS count FROM scans GROUP BY band');
  const [recent] = await db.query(BASE_SELECT + ' ORDER BY s.created_at DESC, s.id DESC LIMIT 5');
  res.json({ ...totals, devices: devs.n, byBand, recent });
};

async function deviceExists(id) {
  const [rows] = await db.query('SELECT id FROM devices WHERE id = ?', [id]);
  return rows.length > 0;
}

exports.create = async (req, res) => {
  const s = req.clean;
  if (!(await deviceExists(s.device_id))) return res.status(400).json({ message: 'Selected device does not exist' });

  const [r] = await db.query(
    `INSERT INTO scans (title, device_id, created_by, band, start_freq_mhz, stop_freq_mhz, peak_freq_mhz,
      peak_power_dbm, noise_floor_dbm, location, scanned_at, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [s.title, s.device_id, req.user.id, s.band, s.start_freq_mhz, s.stop_freq_mhz, s.peak_freq_mhz,
      s.peak_power_dbm, s.noise_floor_dbm, s.location, s.scanned_at, s.notes]
  );
  res.status(201).json({ id: r.insertId, message: 'Scan created' });
};

// analysts can only change their own scans, admin can change any
async function canModify(req, scanId) {
  const [rows] = await db.query('SELECT created_by FROM scans WHERE id = ?', [scanId]);
  if (!rows.length) return 404;
  if (req.user.role !== 'admin' && rows[0].created_by !== req.user.id) return 403;
  return 200;
}

exports.update = async (req, res) => {
  const check = await canModify(req, req.params.id);
  if (check === 404) return res.status(404).json({ message: 'Scan not found' });
  if (check === 403) return res.status(403).json({ message: 'You can only edit your own scans' });

  const s = req.clean;
  if (!(await deviceExists(s.device_id))) return res.status(400).json({ message: 'Selected device does not exist' });

  await db.query(
    `UPDATE scans SET title=?, device_id=?, band=?, start_freq_mhz=?, stop_freq_mhz=?, peak_freq_mhz=?,
      peak_power_dbm=?, noise_floor_dbm=?, location=?, scanned_at=?, notes=? WHERE id=?`,
    [s.title, s.device_id, s.band, s.start_freq_mhz, s.stop_freq_mhz, s.peak_freq_mhz,
      s.peak_power_dbm, s.noise_floor_dbm, s.location, s.scanned_at, s.notes, req.params.id]
  );
  res.json({ message: 'Scan updated' });
};

exports.remove = async (req, res) => {
  const check = await canModify(req, req.params.id);
  if (check === 404) return res.status(404).json({ message: 'Scan not found' });
  if (check === 403) return res.status(403).json({ message: 'You can only delete your own scans' });

  await db.query('DELETE FROM scans WHERE id = ?', [req.params.id]);
  res.json({ message: 'Scan deleted' });
};
