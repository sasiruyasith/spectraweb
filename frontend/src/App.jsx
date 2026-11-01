import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ScanList from './pages/ScanList';
import ScanDetail from './pages/ScanDetail';
import ScanForm from './pages/ScanForm';
import DeviceList from './pages/DeviceList';
import DeviceForm from './pages/DeviceForm';
import Users from './pages/Users';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/scans" element={<ScanList />} />
            <Route path="/scans/:id" element={<ScanDetail />} />
            <Route path="/devices" element={<DeviceList />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin', 'analyst']} />}>
            <Route path="/scans/new" element={<ScanForm />} />
            <Route path="/scans/:id/edit" element={<ScanForm />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/devices/new" element={<DeviceForm />} />
            <Route path="/devices/:id/edit" element={<DeviceForm />} />
            <Route path="/users" element={<Users />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="footer">SpectraWeb &middot; RF spectrum scan manager</footer>
    </>
  );
}
