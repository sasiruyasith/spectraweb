const db = require('../config/db');

exports.list = async (req, res) => {
  const [rows] = await db.query(
    `SELECT d.*, COUNT(s.id) AS scan_count
     FROM devices d LEFT JOIN scans s ON s.device_id = d.id
     GROUP BY d.id ORDER BY d.name`
  );
  res.json(rows);
};

exports.getOne = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM devices WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Device not found' });
  res.json(rows[0]);
};

exports.create = async (req, res) => {
  const d = req.clean;
  try {
    const [r] = await db.query(
      'INSERT INTO devices (name, model, min_freq_mhz, max_freq_mhz) VALUES (?, ?, ?, ?)',
      [d.name, d.model, d.min_freq_mhz, d.max_freq_mhz]
    );
    res.status(201).json({ id: r.insertId, message: 'Device added' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'A device with that name already exists' });
    throw err;
  }
};

exports.update = async (req, res) => {
  const d = req.clean;
  try {
    const [r] = await db.query(
      'UPDATE devices SET name=?, model=?, min_freq_mhz=?, max_freq_mhz=? WHERE id=?',
      [d.name, d.model, d.min_freq_mhz, d.max_freq_mhz, req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ message: 'Device not found' });
    res.json({ message: 'Device updated' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'A device with that name already exists' });
    throw err;
  }
};

exports.remove = async (req, res) => {
  // FK is ON DELETE RESTRICT, check first so we can give a nice message
  const [[used]] = await db.query('SELECT COUNT(*) AS n FROM scans WHERE device_id = ?', [req.params.id]);
  if (used.n > 0) {
    return res.status(409).json({ message: `Cannot delete: this device has ${used.n} scan(s). Delete or move them first.` });
  }
  const [r] = await db.query('DELETE FROM devices WHERE id = ?', [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ message: 'Device not found' });
  res.json({ message: 'Device deleted' });
};
