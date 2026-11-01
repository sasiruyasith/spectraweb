// server side validation, returns 400 with a list of errors
const BANDS = ['HF', 'VHF', 'UHF', 'SHF'];
const ROLES = ['admin', 'analyst', 'viewer'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function num(v) {
  if (v === undefined || v === null || String(v).trim() === '') return NaN;
  return Number(v);
}

function fail(res, errors) {
  return res.status(400).json({ message: 'Validation failed', errors });
}

function scan(req, res, next) {
  const b = req.body;
  const errors = [];
  const s = {
    title: String(b.title || '').trim(),
    device_id: parseInt(b.device_id, 10),
    band: b.band,
    start_freq_mhz: num(b.start_freq_mhz),
    stop_freq_mhz: num(b.stop_freq_mhz),
    peak_freq_mhz: num(b.peak_freq_mhz),
    peak_power_dbm: num(b.peak_power_dbm),
    noise_floor_dbm: num(b.noise_floor_dbm),
    location: String(b.location || '').trim(),
    scanned_at: String(b.scanned_at || '').trim().replace('T', ' '),
    notes: String(b.notes || '').trim() || null,
  };

  if (s.title.length < 3 || s.title.length > 80) errors.push('Title must be 3-80 characters');
  if (!Number.isInteger(s.device_id)) errors.push('Pick a device');
  if (!BANDS.includes(s.band)) errors.push('Pick a valid band');
  if (isNaN(s.start_freq_mhz) || s.start_freq_mhz < 0) errors.push('Start frequency must be a positive number');
  if (isNaN(s.stop_freq_mhz) || s.stop_freq_mhz <= s.start_freq_mhz) errors.push('Stop frequency must be greater than start');
  if (isNaN(s.peak_freq_mhz) || s.peak_freq_mhz < s.start_freq_mhz || s.peak_freq_mhz > s.stop_freq_mhz)
    errors.push('Peak frequency must be inside the start-stop range');
  if (isNaN(s.peak_power_dbm) || s.peak_power_dbm < -150 || s.peak_power_dbm > 30)
    errors.push('Peak power must be between -150 and 30 dBm');
  if (isNaN(s.noise_floor_dbm) || s.noise_floor_dbm < -180 || s.noise_floor_dbm > 0)
    errors.push('Noise floor must be between -180 and 0 dBm');
  else if (s.peak_power_dbm <= s.noise_floor_dbm) errors.push('Peak power should be above the noise floor');
  if (!s.location || s.location.length > 80) errors.push('Location is required (max 80 characters)');
  if (!s.scanned_at || isNaN(Date.parse(s.scanned_at.replace(' ', 'T')))) errors.push('Scan date/time is invalid');
  if (s.notes && s.notes.length > 500) errors.push('Notes can be max 500 characters');

  if (errors.length) return fail(res, errors);
  if (s.scanned_at.length === 16) s.scanned_at += ':00';
  req.clean = s;
  next();
}

function device(req, res, next) {
  const b = req.body;
  const errors = [];
  const d = {
    name: String(b.name || '').trim(),
    model: String(b.model || '').trim(),
    min_freq_mhz: num(b.min_freq_mhz),
    max_freq_mhz: num(b.max_freq_mhz),
  };
  if (d.name.length < 2 || d.name.length > 50) errors.push('Name must be 2-50 characters');
  if (!d.model || d.model.length > 50) errors.push('Model is required (max 50 characters)');
  if (isNaN(d.min_freq_mhz) || d.min_freq_mhz < 0) errors.push('Min frequency must be a positive number');
  if (isNaN(d.max_freq_mhz) || d.max_freq_mhz <= d.min_freq_mhz) errors.push('Max frequency must be greater than min');

  if (errors.length) return fail(res, errors);
  req.clean = d;
  next();
}

function register(req, res, next) {
  const b = req.body;
  const errors = [];
  const u = {
    name: String(b.name || '').trim(),
    email: String(b.email || '').trim().toLowerCase(),
    password: String(b.password || ''),
  };
  if (u.name.length < 2 || u.name.length > 60) errors.push('Name must be 2-60 characters');
  if (!EMAIL_RE.test(u.email)) errors.push('Enter a valid email');
  if (u.password.length < 6) errors.push('Password must be at least 6 characters');

  if (errors.length) return fail(res, errors);
  req.clean = u;
  next();
}

module.exports = { scan, device, register, BANDS, ROLES };
