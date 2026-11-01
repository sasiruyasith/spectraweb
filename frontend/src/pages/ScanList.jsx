import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { errorList } from '../api';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import ErrorList from '../components/ErrorList';
import { fmtDate } from '../utils/validate';

const BANDS = ['HF', 'VHF', 'UHF', 'SHF'];

export default function ScanList() {
  const { canWrite, canModify } = useAuth();
  const [params, setParams] = useSearchParams();
  const [scans, setScans] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [msg, setMsg] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  // filters live in the url so they survive refresh / back button
  const filters = {
    q: params.get('q') || '',
    band: params.get('band') || '',
    device: params.get('device') || '',
    sort: params.get('sort') || 'newest',
  };
  const [search, setSearch] = useState(filters.q);

  const load = () => {
    setLoading(true);
    api.get('/scans', { params: filters })
      .then(res => setScans(res.data))
      .catch(err => setErrors(errorList(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [params]);
  useEffect(() => {
    api.get('/devices').then(res => setDevices(res.data)).catch(() => {});
  }, []);

  const setFilter = (key, value) => {
    const next = { ...filters, [key]: value };
    // drop empty ones so the url stays clean
    Object.keys(next).forEach(k => !next[k] && delete next[k]);
    setParams(next);
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/scans/${toDelete.id}`);
      setMsg(`Deleted "${toDelete.title}"`);
      setToDelete(null);
      load();
    } catch (err) {
      setErrors(errorList(err));
      setToDelete(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>Spectrum scans</h1>
        {canWrite && <Link to="/scans/new" className="btn">+ New scan</Link>}
      </div>

      {msg && <div className="alert alert-ok">{msg}</div>}
      <ErrorList errors={errors} />

      <form className="filters card" onSubmit={e => { e.preventDefault(); setFilter('q', search.trim()); }}>
        <input type="search" placeholder="Search title, location, notes..." value={search}
          onChange={e => setSearch(e.target.value)} />
        <select value={filters.band} onChange={e => setFilter('band', e.target.value)}>
          <option value="">All bands</option>
          {BANDS.map(b => <option key={b}>{b}</option>)}
        </select>
        <select value={filters.device} onChange={e => setFilter('device', e.target.value)}>
          <option value="">All devices</option>
          {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={filters.sort} onChange={e => setFilter('sort', e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="power">Strongest peak</option>
          <option value="freq">Frequency</option>
          <option value="title">Title A-Z</option>
        </select>
        <button className="btn">Search</button>
        <button type="button" className="btn btn-ghost" onClick={() => { setSearch(''); setParams({}); }}>Reset</button>
      </form>

      <p className="muted">{loading ? 'Loading...' : `${scans.length} scan(s) found`}</p>

      {!loading && scans.length === 0 ? (
        <div className="card center empty">
          <p>No scans match your search.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Title</th><th>Band</th><th>Range (MHz)</th><th>Peak</th><th>Device</th><th>Location</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {scans.map(s => (
                <tr key={s.id}>
                  <td data-label="Title"><Link to={`/scans/${s.id}`}>{s.title}</Link></td>
                  <td data-label="Band"><span className={`tag tag-${s.band.toLowerCase()}`}>{s.band}</span></td>
                  <td data-label="Range">{s.start_freq_mhz} – {s.stop_freq_mhz}</td>
                  <td data-label="Peak">{s.peak_power_dbm} dBm @ {s.peak_freq_mhz}</td>
                  <td data-label="Device">{s.device_name}</td>
                  <td data-label="Location">{s.location}</td>
                  <td data-label="Date">{fmtDate(s.scanned_at)}</td>
                  <td className="actions">
                    <Link to={`/scans/${s.id}`} className="btn btn-sm btn-ghost">View</Link>
                    {canModify(s) && (
                      <>
                        <Link to={`/scans/${s.id}/edit`} className="btn btn-sm">Edit</Link>
                        <button className="btn btn-sm btn-danger" onClick={() => setToDelete(s)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={!!toDelete}
        title="Delete scan?"
        message={toDelete && `"${toDelete.title}" will be removed permanently.`}
        onConfirm={doDelete}
        onCancel={() => setToDelete(null)}
        busy={busy}
      />
    </>
  );
}
