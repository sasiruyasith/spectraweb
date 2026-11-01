const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

function makeToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

exports.register = async (req, res) => {
  const { name, email, password } = req.clean;
  const [exists] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (exists.length) return res.status(409).json({ message: 'That email is already registered' });

  const hash = await bcrypt.hash(password, 10);
  // new accounts start as analyst, admin can change it later
  const [r] = await db.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, hash, 'analyst']
  );
  const user = { id: r.insertId, name, email, role: 'analyst' };
  res.status(201).json({ token: makeToken(user), user });
};

exports.login = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ message: 'Wrong email or password' });
  }
  const { password_hash, ...safe } = user;
  res.json({ token: makeToken(safe), user: safe });
};

exports.me = async (req, res) => {
  const [rows] = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
  if (!rows.length) return res.status(404).json({ message: 'User not found' });
  res.json(rows[0]);
};
