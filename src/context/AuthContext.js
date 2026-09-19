import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});

const PROFILE_KEY = '@techsupport_profile_overrides';

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
  const [overrides, setOverrides] = useState({});

  // Load any saved profile edits
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PROFILE_KEY);
        if (raw) setOverrides(JSON.parse(raw));
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const login = async (email, password) => {
    const found = DEMO_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (found) {
      const { password: _, ...userData } = found;
      const ov = overrides[found.uid] || {};
      setUser({ ...userData, ...ov });
      setUserRole(found.role);
      return { success: true };
    }
    return { success: false, message: 'Invalid email or password.' };
  };

  const logout = () => {
    setUser(null);
    setUserRole(null);
  };

  // Update editable profile fields (name, email, phone) and persist per-uid
  const updateProfile = async (updates) => {
    if (!user) return;
    const next = { ...user, ...updates };
    setUser(next);
    const nextOverrides = {
      ...overrides,
      [user.uid]: { ...(overrides[user.uid] || {}), ...updates },
    };
    setOverrides(nextOverrides);
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(nextOverrides));
    } catch (e) {
      // ignore persistence failure
    }
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
