import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="card center">
        <h2>No access</h2>
        <p className="muted">Your role ({user.role}) can't open this page.</p>
      </div>
    );
  }
  return <Outlet />;
}
