import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const doLogout = () => {
    logout();
    navigate('/login');
  };

  const close = () => setOpen(false);

  return (
    <header className="topbar">
      <Link to={user ? '/dashboard' : '/'} className="brand" onClick={close}>
        <img src="/logo.svg" alt="" width="30" height="30" />
        Spectra<span>Web</span>
      </Link>

      <button className="menu-btn" onClick={() => setOpen(!open)} aria-label="Menu">☰</button>

      <nav className={open ? 'open' : ''}>
        {user ? (
          <>
            <NavLink to="/dashboard" onClick={close}>Dashboard</NavLink>
            <NavLink to="/scans" end onClick={close}>Scans</NavLink>
            <NavLink to="/devices" onClick={close}>Devices</NavLink>
            {isAdmin && <NavLink to="/users" onClick={close}>Users</NavLink>}
            <span className="who">{user.name} <em className={`role role-${user.role}`}>{user.role}</em></span>
            <button className="btn btn-sm btn-ghost-light" onClick={doLogout}>Log out</button>
          </>
        ) : (
          <>
            <NavLink to="/login" onClick={close}>Log in</NavLink>
            <NavLink to="/register" onClick={close}>Register</NavLink>
          </>
        )}
      </nav>
    </header>
  );
}
