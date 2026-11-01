import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import api, { errorList } from '../api';
import { useAuth } from '../context/AuthContext';
import SpectrumChart from '../components/SpectrumChart';
import ConfirmModal from '../components/ConfirmModal';
import ErrorList from '../components/ErrorList';
import { fmtDate } from '../utils/validate';

export default function ScanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { canModify } = useAuth();
  const [scan, setScan] = useState(null);
  const [errors, setErrors] = useState([]);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/scans/${id}`)
      .then(res => setScan(res.data))
      .catch(err => setErrors(errorList(err)));
  }, [id]);

  const doDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/scans/${id}`);
      navigate('/scans');
    } catch (err) {
      setErrors(errorList(err));
      setConfirm(false);
      setBusy(false);
    }
  };

  if (errors.length && !scan) {
    return (
      <>
        <ErrorList errors={errors} />
        <Link to="/scans" className="btn btn-ghost">← Back to scans</Link>
      </>
    );
  }
  if (!scan) return <p className="muted">Loading...</p>;

  const snr = (scan.peak_power_dbm - scan.noise_floor_dbm).toFixed(1);
  const span = +(scan.stop_freq_mhz - scan.start_freq_mhz).toFixed(4);

  return (
    <>
      {location.state?.msg && <div className="alert alert-ok">{location.state.msg}</div>}
      <ErrorList errors={errors} />

      <div className="page-head">
        <h1>{scan.title} <span className={`tag tag-${scan.band.toLowerCase()}`}>{scan.band}</span></h1>
        {canModify(scan) && (
          <div className="btn-row">
            <Link to={`/scans/${id}/edit`} className="btn">Edit</Link>
            <button className="btn btn-danger" onClick={() => setConfirm(true)}>Delete</button>
          </div>
        )}
      </div>

      <div className="card">
        <SpectrumChart start={scan.start_freq_mhz} stop={scan.stop_freq_mhz}
          peakF={scan.peak_freq_mhz} peakP={scan.peak_power_dbm} noise={scan.noise_floor_dbm} />
        <p className="muted small">Trace is simulated from the stored peak and noise floor values.</p>
      </div>

      <div className="card details">
        <div><span>Device</span>{scan.device_name} ({scan.device_model})</div>
        <div><span>Location</span>{scan.location}</div>
        <div><span>Start</span>{scan.start_freq_mhz} MHz</div>
        <div><span>Stop</span>{scan.stop_freq_mhz} MHz</div>
        <div><span>Span</span>{span} MHz</div>
        <div><span>Peak frequency</span>{scan.peak_freq_mhz} MHz</div>
        <div><span>Peak power</span>{scan.peak_power_dbm} dBm</div>
        <div><span>Noise floor</span>{scan.noise_floor_dbm} dBm</div>
        <div><span>SNR</span>{snr} dB</div>
        <div><span>Scanned at</span>{fmtDate(scan.scanned_at)}</div>
        <div className="full"><span>Notes</span>{scan.notes || '—'}</div>
        <div className="full muted small">
          Logged by {scan.created_by_name || 'deleted user'} · created {fmtDate(scan.created_at)} · updated {fmtDate(scan.updated_at)}
        </div>
      </div>

      <Link to="/scans" className="btn btn-ghost">← Back to scans</Link>

      <ConfirmModal open={confirm} title="Delete scan?" busy={busy}
        message={`"${scan.title}" will be removed permanently.`}
        onConfirm={doDelete} onCancel={() => setConfirm(false)} />
    </>
  );
}
