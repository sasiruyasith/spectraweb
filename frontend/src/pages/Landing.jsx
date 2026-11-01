import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import hero from '../assets/hero.svg';

const FEATURES = [
  { icon: '📡', title: 'Log scans', text: 'Save frequency range, peak power, noise floor and location for every sweep.' },
  { icon: '🔎', title: 'Search & filter', text: 'Find scans by keyword, band or device and sort by date, power or frequency.' },
  { icon: '📈', title: 'Spectrum view', text: 'Each scan gets a spectrum plot with the peak marked.' },
  { icon: '🛡️', title: 'Roles', text: 'Admins manage devices and users, analysts log scans, viewers can browse.' },
];

export default function Landing() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <h1>Keep track of every <span>RF spectrum</span> scan</h1>
          <p>
            SpectraWeb is a simple lab tool for recording and reviewing spectrum analyzer
            measurements, from FM broadcast sweeps to 2.4 GHz WiFi checks.
          </p>
          <div className="btn-row">
            <Link to="/login" className="btn btn-lg">Log in</Link>
            <Link to="/register" className="btn btn-lg btn-ghost">Create account</Link>
          </div>
        </div>
        <img src={hero} alt="Spectrum analyzer trace illustration" className="hero-img" />
      </section>

      <section className="features">
        {FEATURES.map(f => (
          <div className="card feature" key={f.title}>
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p className="muted">{f.text}</p>
          </div>
        ))}
      </section>
    </>
  );
}
