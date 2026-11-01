// client side checks - same rules as backend/middleware/validate.js

export function validateScan(f) {
  const errors = [];
  const n = k => (String(f[k]).trim() === '' ? NaN : Number(f[k]));

  if (f.title.trim().length < 3) errors.push('Title must be at least 3 characters');
  if (!f.device_id) errors.push('Pick a device');
  if (!f.band) errors.push('Pick a band');
  if (isNaN(n('start_freq_mhz')) || n('start_freq_mhz') < 0) errors.push('Start frequency must be a positive number');
  if (isNaN(n('stop_freq_mhz')) || n('stop_freq_mhz') <= n('start_freq_mhz')) errors.push('Stop frequency must be greater than start');
  if (isNaN(n('peak_freq_mhz')) || n('peak_freq_mhz') < n('start_freq_mhz') || n('peak_freq_mhz') > n('stop_freq_mhz'))
    errors.push('Peak frequency must be inside the start-stop range');
  if (isNaN(n('peak_power_dbm')) || n('peak_power_dbm') < -150 || n('peak_power_dbm') > 30)
    errors.push('Peak power must be between -150 and 30 dBm');
  if (isNaN(n('noise_floor_dbm')) || n('noise_floor_dbm') < -180 || n('noise_floor_dbm') > 0)
    errors.push('Noise floor must be between -180 and 0 dBm');
  else if (n('peak_power_dbm') <= n('noise_floor_dbm')) errors.push('Peak power should be above the noise floor');
  if (!f.location.trim()) errors.push('Location is required');
  if (!f.scanned_at) errors.push('Scan date/time is required');
  return errors;
}

export function validateDevice(f) {
  const errors = [];
  const min = parseFloat(f.min_freq_mhz), max = parseFloat(f.max_freq_mhz);
  if (f.name.trim().length < 2) errors.push('Name must be at least 2 characters');
  if (!f.model.trim()) errors.push('Model is required');
  if (isNaN(min) || min < 0) errors.push('Min frequency must be a positive number');
  if (isNaN(max) || max <= min) errors.push('Max frequency must be greater than min');
  return errors;
}

export const fmtDate = s => (s ? s.slice(0, 16).replace('T', ' ') : '');
