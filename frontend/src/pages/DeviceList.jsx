import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api, { errorList } from '../api';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import ErrorList from '../components/ErrorList';

export default function DeviceList() {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const [devices, setDevices] = useState([]);
  const [errors, setErrors] = useState([]);
  const [msg, setMsg] = useState(location.state?.msg || '');
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.get('/devices').then(res => setDevices(res.data)).catch(err => setErrors(errorList(err)));
  };
  useEffect(load, []);

  const doDelete = async () => {
    setBusy(true);
    setErrors([]);
    try {
      await api.delete(`/devices/${toDelete.id}`);
      setMsg(`Deleted "${toDelete.name}"`);
      load();
    } catch (err) {
      setMsg('');
      setErrors(errorList(err));
    } finally {
      setToDelete(null);
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>Devices</h1>
        {isAdmin && <Link to="/devices/new" className="btn">+ New device</Link>}
      </div>

      {msg && <div className="alert alert-ok">{msg}</div>}
      <ErrorList errors={errors} />

      <div className="device-grid">
        {devices.map(d => (
          <div className="card device" key={d.id}>
            <div className="device-icon">📟</div>
            <h3>{d.name}</h3>
            <p className="muted">{d.model}</p>
            <p><strong>{d.min_freq_mhz} – {d.max_freq_mhz}</strong> MHz</p>
            <Link to={`/scans?device=${d.id}`} className="small">{d.scan_count} scan(s) →</Link>
            {isAdmin && (
              <div className="btn-row">
                <Link to={`/devices/${d.id}/edit`} className="btn btn-sm">Edit</Link>
                <button className="btn btn-sm btn-danger" onClick={() => setToDelete(d)}>Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <ConfirmModal open={!!toDelete} title="Delete device?" busy={busy}
        message={toDelete && `"${toDelete.name}" will be removed. Devices that still have scans can't be deleted.`}
        onConfirm={doDelete} onCancel={() => setToDelete(null)} />
    </>
  );
}
