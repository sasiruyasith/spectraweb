// confirm before any delete form submits
document.querySelectorAll('form[data-confirm]').forEach(f => {
  f.addEventListener('submit', e => {
    if (!confirm(f.dataset.confirm)) e.preventDefault();
  });
});

// client side validation (server checks again anyway)
function showErrors(form, errors) {
  const box = form.querySelector('#clientErrors');
  if (!errors.length) { box.hidden = true; return true; }
  box.innerHTML = '<strong>Please fix the following:</strong><ul>' +
    errors.map(e => '<li>' + e + '</li>').join('') + '</ul>';
  box.hidden = false;
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return false;
}

const scanForm = document.getElementById('scanForm');
if (scanForm) {
  scanForm.addEventListener('submit', e => {
    const v = name => scanForm.elements[name].value.trim();
    const n = name => parseFloat(v(name));
    const errors = [];

    if (v('title').length < 3) errors.push('Title must be at least 3 characters.');
    if (!v('device_id')) errors.push('Pick a device.');
    if (!v('band')) errors.push('Pick a band.');
    if (isNaN(n('start_freq_mhz')) || isNaN(n('stop_freq_mhz'))) errors.push('Start and stop frequency are required.');
    else if (n('stop_freq_mhz') <= n('start_freq_mhz')) errors.push('Stop frequency must be greater than start.');
    if (isNaN(n('peak_freq_mhz')) || n('peak_freq_mhz') < n('start_freq_mhz') || n('peak_freq_mhz') > n('stop_freq_mhz'))
      errors.push('Peak frequency must be inside the start-stop range.');
    if (isNaN(n('peak_power_dbm'))) errors.push('Peak power is required.');
    if (isNaN(n('noise_floor_dbm'))) errors.push('Noise floor is required.');
    else if (n('peak_power_dbm') <= n('noise_floor_dbm')) errors.push('Peak power should be above the noise floor.');
    if (!v('location')) errors.push('Location is required.');
    if (!v('scanned_at')) errors.push('Scan date/time is required.');

    if (!showErrors(scanForm, errors)) e.preventDefault();
  });
}

const deviceForm = document.getElementById('deviceForm');
if (deviceForm) {
  deviceForm.addEventListener('submit', e => {
    const v = name => deviceForm.elements[name].value.trim();
    const errors = [];
    if (v('name').length < 2) errors.push('Name must be at least 2 characters.');
    if (!v('model')) errors.push('Model is required.');
    const min = parseFloat(v('min_freq_mhz')), max = parseFloat(v('max_freq_mhz'));
    if (isNaN(min) || min < 0) errors.push('Min frequency must be a positive number.');
    if (isNaN(max) || max <= min) errors.push('Max frequency must be greater than min.');
    if (!showErrors(deviceForm, errors)) e.preventDefault();
  });
}

// simple spectrum plot on the details page
const canvas = document.getElementById('spectrum');
if (canvas) drawSpectrum(canvas);

function drawSpectrum(c) {
  const start = +c.dataset.start, stop = +c.dataset.stop;
  const peakF = +c.dataset.peak, peakP = +c.dataset.power, noise = +c.dataset.noise;

  c.width = c.clientWidth * devicePixelRatio;
  c.height = 260 * devicePixelRatio;
  const ctx = c.getContext('2d');
  ctx.scale(devicePixelRatio, devicePixelRatio);
  const W = c.clientWidth, H = 260, pad = 40;

  const top = Math.ceil((peakP + 10) / 10) * 10;
  const bottom = Math.floor((noise - 10) / 10) * 10;
  const x = f => pad + (f - start) / (stop - start) * (W - pad - 10);
  const y = p => 10 + (top - p) / (top - bottom) * (H - pad - 10);

  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, W, H);

  // grid + labels
  ctx.strokeStyle = '#1f2a3d';
  ctx.fillStyle = '#8aa0bf';
  ctx.font = '11px sans-serif';
  for (let p = top; p >= bottom; p -= 10) {
    ctx.beginPath(); ctx.moveTo(pad, y(p)); ctx.lineTo(W - 10, y(p)); ctx.stroke();
    ctx.fillText(p, 4, y(p) + 4);
  }
  for (let i = 0; i <= 4; i++) {
    const f = start + (stop - start) * i / 4;
    ctx.beginPath(); ctx.moveTo(x(f), 10); ctx.lineTo(x(f), H - pad); ctx.stroke();
    ctx.fillText(+f.toFixed(2), x(f) - 14, H - pad + 16);
  }
  ctx.fillText('MHz', W - 34, H - 6);
  ctx.fillText('dBm', 4, H - 6);

  // trace = noise + gaussian peak, seeded so it looks the same each load
  let seed = Math.round(peakF * 1000) || 1;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const width = (stop - start) * 0.03;
  const pts = 400;

  ctx.strokeStyle = '#38e0a0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= pts; i++) {
    const f = start + (stop - start) * i / pts;
    const g = Math.exp(-((f - peakF) ** 2) / (2 * width * width));
    const p = noise + (peakP - noise) * g + (rand() - 0.5) * 4;
    i === 0 ? ctx.moveTo(x(f), y(p)) : ctx.lineTo(x(f), y(p));
  }
  ctx.stroke();

  // peak marker
  ctx.fillStyle = '#ff6b6b';
  ctx.beginPath(); ctx.arc(x(peakF), y(peakP), 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillText(`${peakP} dBm @ ${peakF} MHz`, Math.min(x(peakF) + 8, W - 150), y(peakP) + 4);
}
