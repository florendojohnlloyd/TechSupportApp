import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext({});

// Demo users
const DEMO_USERS = [
  { uid: '1', email: 'support@demo.com', password: 'demo123', name: 'Maria Santos', role: 'support' },
  { uid: '2', email: 'manager@demo.com', password: 'demo123', name: 'Jose Reyes', role: 'branch_manager' },
  { uid: '3', email: 'fse@demo.com', password: 'demo123', name: 'Juan dela Cruz', role: 'fse' },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading] = useState(false);

  const login = async (email, password) => {
    const found = DEMO_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (found) {
      const { password: _, ...userData } = found;
      setUser(userData);
      setUserRole(found.role);
      return { success: true };
    }
    return { success: false, message: 'Invalid email or password.' };
  };

  const logout = () => {
    setUser(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
