const jwt = require('jsonwebtoken');

// checks the Bearer token and puts the user on req.user
function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please log in first' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Session expired, log in again' });
  }
}

// allow only some roles e.g. allow('admin', 'analyst')
function allow(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to do that' });
    }
    next();
  };
}

module.exports = { protect, allow };
