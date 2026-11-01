import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorList } from '../api';
import { useAuth } from '../context/AuthContext';
import ErrorList from '../components/ErrorList';
import { fmtDate } from '../utils/validate';

const BANDS = ['HF', 'VHF', 'UHF', 'SHF'];

export default function Dashboard() {
  const { user, canWrite } = useAuth();
  const [stats, setStats] = useState(null);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    api.get('/scans/stats')
      .then(res => setStats(res.data))
      .catch(err => setErrors(errorList(err)));
  }, []);

  if (errors.length) return <ErrorList errors={errors} />;
  if (!stats) return <p className="muted">Loading...</p>;

  const max = Math.max(1, ...stats.byBand.map(b => b.count));
  const countFor = band => stats.byBand.find(b => b.band === band)?.count || 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Hi, {user.name.split(' ')[0]} 👋</h1>
          <p className="muted">Here's what's in the scan log.</p>
        </div>
        {canWrite && <Link to="/scans/new" className="btn">+ New scan</Link>}
      </div>

      <div className="stats">
        <div className="card stat"><span>Total scans</span><strong>{stats.scans}</strong></div>
        <div className="card stat"><span>Devices</span><strong>{stats.devices}</strong></div>
        <div className="card stat"><span>Locations</span><strong>{stats.locations}</strong></div>
        <div className="card stat"><span>Strongest peak</span><strong>{stats.strongest ?? '—'} <small>dBm</small></strong></div>
      </div>

      <div className="dash-grid">
        <div className="card">
          <h3>Scans per band</h3>
          {BANDS.map(b => (
            <Link to={`/scans?band=${b}`} className="bar-row" key={b}>
              <span className={`tag tag-${b.toLowerCase()}`}>{b}</span>
              <div className="bar"><div className={`bar-fill fill-${b.toLowerCase()}`} style={{ width: `${countFor(b) / max * 100}%` }} /></div>
              <span className="bar-num">{countFor(b)}</span>
            </Link>
          ))}
        </div>

        <div className="card">
          <h3>Recently added</h3>
          {stats.recent.length === 0 && <p className="muted">No scans yet.</p>}
          <ul className="recent">
            {stats.recent.map(s => (
              <li key={s.id}>
                <Link to={`/scans/${s.id}`}>{s.title}</Link>
                <span className="muted small">{s.device_name} · {fmtDate(s.scanned_at)}</span>
              </li>
            ))}
          </ul>
          <Link to="/scans" className="small">View all scans →</Link>
        </div>
      </div>
    </>
  );
}
