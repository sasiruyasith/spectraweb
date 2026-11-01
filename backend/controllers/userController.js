const db = require('../config/db');
const { ROLES } = require('../middleware/validate');

// admin only
exports.list = async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.id, u.name, u.email, u.role, u.created_at, COUNT(s.id) AS scan_count
     FROM users u LEFT JOIN scans s ON s.created_by = u.id
     GROUP BY u.id ORDER BY u.name`
  );
  res.json(rows);
};

exports.updateRole = async (req, res) => {
  const { role } = req.body;
  if (!ROLES.includes(role)) return res.status(400).json({ message: 'Invalid role' });
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ message: 'You cannot change your own role' });

  const [r] = await db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'Role updated' });
};

exports.remove = async (req, res) => {
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ message: 'You cannot delete yourself' });
  // their scans stay, created_by becomes NULL (ON DELETE SET NULL)
  const [r] = await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'User deleted' });
};
