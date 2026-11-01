// server side validation for form data

const BANDS = ['HF', 'VHF', 'UHF', 'SHF'];

function num(v) {
  if (v === undefined || v === null || String(v).trim() === '') return NaN;
  return Number(v);
}

function validateScan(body) {
  const errors = [];
  const s = {
    title: (body.title || '').trim(),
    device_id: parseInt(body.device_id, 10),
    band: body.band,
    start_freq_mhz: num(body.start_freq_mhz),
    stop_freq_mhz: num(body.stop_freq_mhz),
    peak_freq_mhz: num(body.peak_freq_mhz),
    peak_power_dbm: num(body.peak_power_dbm),
    noise_floor_dbm: num(body.noise_floor_dbm),
    location: (body.location || '').trim(),
    scanned_at: (body.scanned_at || '').trim(),
    notes: (body.notes || '').trim() || null,
  };

  if (s.title.length < 3 || s.title.length > 80) errors.push('Title must be 3-80 characters.');
  if (!Number.isInteger(s.device_id)) errors.push('Pick a device.');
  if (!BANDS.includes(s.band)) errors.push('Pick a valid band.');
  if (isNaN(s.start_freq_mhz) || s.start_freq_mhz < 0) errors.push('Start frequency must be a positive number.');
  if (isNaN(s.stop_freq_mhz)) errors.push('Stop frequency is required.');
  if (s.stop_freq_mhz <= s.start_freq_mhz) errors.push('Stop frequency must be greater than start frequency.');
  if (isNaN(s.peak_freq_mhz) || s.peak_freq_mhz < s.start_freq_mhz || s.peak_freq_mhz > s.stop_freq_mhz)
    errors.push('Peak frequency must be inside the start-stop range.');
  if (isNaN(s.peak_power_dbm) || s.peak_power_dbm < -150 || s.peak_power_dbm > 30)
    errors.push('Peak power must be between -150 and 30 dBm.');
  if (isNaN(s.noise_floor_dbm) || s.noise_floor_dbm < -180 || s.noise_floor_dbm > 0)
    errors.push('Noise floor must be between -180 and 0 dBm.');
  if (!isNaN(s.noise_floor_dbm) && s.peak_power_dbm <= s.noise_floor_dbm)
    errors.push('Peak power should be above the noise floor.');
  if (!s.location) errors.push('Location is required.');
  if (!s.scanned_at || isNaN(Date.parse(s.scanned_at))) errors.push('Scan date/time is invalid.');
  if (s.notes && s.notes.length > 500) errors.push('Notes can be max 500 characters.');

  return { data: s, errors };
}

function validateDevice(body) {
  const errors = [];
  const d = {
    name: (body.name || '').trim(),
    model: (body.model || '').trim(),
    min_freq_mhz: num(body.min_freq_mhz),
    max_freq_mhz: num(body.max_freq_mhz),
  };
  if (d.name.length < 2 || d.name.length > 50) errors.push('Name must be 2-50 characters.');
  if (!d.model) errors.push('Model is required.');
  if (isNaN(d.min_freq_mhz) || d.min_freq_mhz < 0) errors.push('Min frequency must be a positive number.');
  if (isNaN(d.max_freq_mhz) || d.max_freq_mhz <= d.min_freq_mhz) errors.push('Max frequency must be greater than min.');
  return { data: d, errors };
}

module.exports = { validateScan, validateDevice, BANDS };
