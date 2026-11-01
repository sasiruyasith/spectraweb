import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errorList } from '../api';
import ErrorList from '../components/ErrorList';
import { validateDevice } from '../utils/validate';

export default function DeviceForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', model: '', min_freq_mhz: '', max_freq_mhz: '' });
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api.get(`/devices/${id}`)
      .then(res => {
        const { name, model, min_freq_mhz, max_freq_mhz } = res.data;
        setForm({ name, model, min_freq_mhz, max_freq_mhz });
      })
      .catch(err => setErrors(errorList(err)));
  }, [id]);

  const set = k => e => setForm({ ...form, [k]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    const errs = validateDevice(form);
    if (errs.length) return setErrors(errs);

    setBusy(true);
    try {
      if (editing) await api.put(`/devices/${id}`, form);
      else await api.post('/devices', form);
      navigate('/devices', { state: { msg: editing ? 'Device updated' : 'Device added' } });
    } catch (err) {
      setErrors(errorList(err));
      setBusy(false);
    }
  };

  return (
    <>
      <h1>{editing ? 'Edit device' : 'New device'}</h1>
      <ErrorList errors={errors} />
      <form className="card form" onSubmit={submit} noValidate>
        <div className="grid-2">
          <label>Name<input value={form.name} onChange={set('name')} maxLength={50} /></label>
          <label>Model<input value={form.model} onChange={set('model')} maxLength={50} /></label>
        </div>
        <div className="grid-2">
          <label>Min freq (MHz)<input type="number" step="any" value={form.min_freq_mhz} onChange={set('min_freq_mhz')} /></label>
          <label>Max freq (MHz)<input type="number" step="any" value={form.max_freq_mhz} onChange={set('max_freq_mhz')} /></label>
        </div>
        <div className="btn-row">
          <button className="btn" disabled={busy}>{busy ? 'Saving...' : 'Save device'}</button>
          <Link to="/devices" className="btn btn-ghost">Cancel</Link>
        </div>
      </form>
    </>
  );
}
