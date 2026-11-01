import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorList } from '../api';
import ErrorList from '../components/ErrorList';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async e => {
    e.preventDefault();
    if (!form.email || !form.password) return setErrors(['Enter your email and password']);
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setErrors(errorList(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-box card">
      <img src="/logo.svg" alt="" width="54" height="54" />
      <h1>Welcome back</h1>
      <ErrorList errors={errors} />
      <form onSubmit={submit} className="form" noValidate>
        <label>Email
          <input type="email" value={form.email} autoComplete="email"
            onChange={e => setForm({ ...form, email: e.target.value })} />
        </label>
        <label>Password
          <input type="password" value={form.password} autoComplete="current-password"
            onChange={e => setForm({ ...form, password: e.target.value })} />
        </label>
        <button className="btn btn-lg" disabled={busy}>{busy ? 'Logging in...' : 'Log in'}</button>
      </form>
      <p className="muted small">No account? <Link to="/register">Register</Link></p>
      <p className="muted small demo">Demo: admin@spectraweb.lk / password123</p>
    </div>
  );
}
