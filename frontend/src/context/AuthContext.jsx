import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('hireiq_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      try {
        localStorage.removeItem('hireiq_user');
        localStorage.removeItem('hireiq_token');
      } catch {
        // Ignore cleanup failure (e.g. disabled or restricted storage)
      }
      return null;
    }
  });
  const [loading] = useState(false);

  const login = (userData, token) => {
    localStorage.setItem('hireiq_token', token);
    localStorage.setItem('hireiq_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('hireiq_token');
    localStorage.removeItem('hireiq_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
