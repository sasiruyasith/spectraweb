import { createContext, useContext, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

function savedUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(savedUser);

  const saveSession = data => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    saveSession(res.data);
  };

  const register = async form => {
    const res = await api.post('/auth/register', form);
    saveSession(res.data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // small helpers used around the UI
  const canWrite = user && (user.role === 'admin' || user.role === 'analyst');
  const isAdmin = user?.role === 'admin';
  const canModify = scan => isAdmin || (user?.role === 'analyst' && scan.created_by === user.id);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, canWrite, isAdmin, canModify }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
