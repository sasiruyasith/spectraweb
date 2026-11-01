import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorList } from '../api';
import ErrorList from '../components/ErrorList';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const set = k => e => setForm({ ...form, [k]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    const errs = [];
    if (form.name.trim().length < 2) errs.push('Name must be at least 2 characters');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.push('Enter a valid email');
    if (form.password.length < 6) errs.push('Password must be at least 6 characters');
    if (form.password !== form.confirm) errs.push('Passwords do not match');
    if (errs.length) return setErrors(errs);

    setBusy(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
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
      <h1>Create account</h1>
      <ErrorList errors={errors} />
      <form onSubmit={submit} className="form" noValidate>
        <label>Name<input value={form.name} onChange={set('name')} /></label>
        <label>Email<input type="email" value={form.email} onChange={set('email')} /></label>
        <label>Password<input type="password" value={form.password} onChange={set('password')} /></label>
        <label>Confirm password<input type="password" value={form.confirm} onChange={set('confirm')} /></label>
        <button className="btn btn-lg" disabled={busy}>{busy ? 'Creating...' : 'Register'}</button>
      </form>
      <p className="muted small">Already have an account? <Link to="/login">Log in</Link></p>
    </div>
  );
}
