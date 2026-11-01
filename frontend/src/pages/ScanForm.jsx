import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errorList } from '../api';
import ErrorList from '../components/ErrorList';
import { validateScan } from '../utils/validate';

const EMPTY = {
  title: '', device_id: '', band: '', start_freq_mhz: '', stop_freq_mhz: '', peak_freq_mhz: '',
  peak_power_dbm: '', noise_floor_dbm: '', location: '', scanned_at: '', notes: '',
};
const BANDS = ['HF', 'VHF', 'UHF', 'SHF'];

export default function ScanForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [devices, setDevices] = useState([]);
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/devices').then(res => setDevices(res.data)).catch(err => setErrors(errorList(err)));
    if (editing) {
      api.get(`/scans/${id}`)
        .then(res => {
          const s = res.data;
          const filled = {};
          Object.keys(EMPTY).forEach(k => (filled[k] = s[k] ?? ''));
          filled.scanned_at = s.scanned_at.slice(0, 16).replace(' ', 'T'); // for datetime-local
          setForm(filled);
        })
        .catch(err => setErrors(errorList(err)));
    }
  }, [id]);

  const set = k => e => setForm({ ...form, [k]: e.target.value });

  // warn if the range is outside what the chosen device can do (just a hint)
  const dev = devices.find(d => String(d.id) === String(form.device_id));
  const outOfRange = dev && form.start_freq_mhz !== '' && form.stop_freq_mhz !== '' &&
    (Number(form.start_freq_mhz) < dev.min_freq_mhz || Number(form.stop_freq_mhz) > dev.max_freq_mhz);

  const submit = async e => {
    e.preventDefault();
    const errs = validateScan(form);
    if (errs.length) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await api.put(`/scans/${id}`, form);
        navigate(`/scans/${id}`, { state: { msg: 'Scan updated' } });
      } else {
        const res = await api.post('/scans', form);
        navigate(`/scans/${res.data.id}`, { state: { msg: 'Scan created' } });
      }
    } catch (err) {
      setErrors(errorList(err));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setBusy(false);
    }
  };

  return (
    <>
      <h1>{editing ? 'Edit scan' : 'New scan'}</h1>
      <ErrorList errors={errors} />

      <form className="card form" onSubmit={submit} noValidate>
        <label>Title
          <input value={form.title} onChange={set('title')} maxLength={80} placeholder="e.g. FM broadcast sweep" />
        </label>

        <div className="grid-2">
          <label>Device
            <select value={form.device_id} onChange={set('device_id')}>
              <option value="">-- choose --</option>
              {devices.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.min_freq_mhz}–{d.max_freq_mhz} MHz)</option>
              ))}
            </select>
          </label>
          <label>Band
            <select value={form.band} onChange={set('band')}>
              <option value="">-- choose --</option>
              {BANDS.map(b => <option key={b}>{b}</option>)}
            </select>
          </label>
        </div>

        <div className="grid-3">
          <label>Start freq (MHz)<input type="number" step="any" value={form.start_freq_mhz} onChange={set('start_freq_mhz')} /></label>
          <label>Stop freq (MHz)<input type="number" step="any" value={form.stop_freq_mhz} onChange={set('stop_freq_mhz')} /></label>
          <label>Peak freq (MHz)<input type="number" step="any" value={form.peak_freq_mhz} onChange={set('peak_freq_mhz')} /></label>
        </div>
        {outOfRange && <p className="hint">⚠ This range is outside what {dev.name} supports.</p>}

        <div className="grid-2">
          <label>Peak power (dBm)<input type="number" step="any" value={form.peak_power_dbm} onChange={set('peak_power_dbm')} /></label>
          <label>Noise floor (dBm)<input type="number" step="any" value={form.noise_floor_dbm} onChange={set('noise_floor_dbm')} /></label>
        </div>

        <div className="grid-2">
          <label>Location<input value={form.location} onChange={set('location')} maxLength={80} /></label>
          <label>Scanned at<input type="datetime-local" value={form.scanned_at} onChange={set('scanned_at')} /></label>
        </div>

        <label>Notes <small className="muted">(optional)</small>
          <textarea rows="3" maxLength={500} value={form.notes} onChange={set('notes')} />
        </label>

        <div className="btn-row">
          <button className="btn" disabled={busy}>{busy ? 'Saving...' : 'Save scan'}</button>
          <Link to={editing ? `/scans/${id}` : '/scans'} className="btn btn-ghost">Cancel</Link>
        </div>
      </form>
    </>
  );
}
