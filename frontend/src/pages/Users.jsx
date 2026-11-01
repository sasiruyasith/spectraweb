import { useEffect, useState } from 'react';
import api, { errorList } from '../api';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import ErrorList from '../components/ErrorList';
import { fmtDate } from '../utils/validate';

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [errors, setErrors] = useState([]);
  const [msg, setMsg] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => api.get('/users').then(res => setUsers(res.data)).catch(err => setErrors(errorList(err)));
  useEffect(() => { load(); }, []);

  const changeRole = async (u, role) => {
    setErrors([]);
    try {
      await api.put(`/users/${u.id}/role`, { role });
      setMsg(`${u.name} is now ${role}`);
      load();
    } catch (err) {
      setErrors(errorList(err));
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/users/${toDelete.id}`);
      setMsg(`Deleted ${toDelete.name}`);
      load();
    } catch (err) {
      setErrors(errorList(err));
    } finally {
      setToDelete(null);
      setBusy(false);
    }
  };

  return (
    <>
      <h1>Users</h1>
      {msg && <div className="alert alert-ok">{msg}</div>}
      <ErrorList errors={errors} />

      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Scans</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td data-label="Name">{u.name}{u.id === me.id && <span className="muted"> (you)</span>}</td>
                <td data-label="Email">{u.email}</td>
                <td data-label="Role">
                  <select value={u.role} disabled={u.id === me.id} onChange={e => changeRole(u, e.target.value)}>
                    <option value="admin">admin</option>
                    <option value="analyst">analyst</option>
                    <option value="viewer">viewer</option>
                  </select>
                </td>
                <td data-label="Scans">{u.scan_count}</td>
                <td data-label="Joined">{fmtDate(u.created_at)}</td>
                <td className="actions">
                  {u.id !== me.id && (
                    <button className="btn btn-sm btn-danger" onClick={() => setToDelete(u)}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal open={!!toDelete} title="Delete user?" busy={busy}
        message={toDelete && `${toDelete.name} will lose access. Their scans are kept.`}
        onConfirm={doDelete} onCancel={() => setToDelete(null)} />
    </>
  );
}
