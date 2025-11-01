'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false); // ✅ prevent flashing before load

  useEffect(() => {
    const storedToken = localStorage.getItem('glovendor_token');
    const storedUser = localStorage.getItem('glovendor_user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch {
        localStorage.removeItem('glovendor_user');
      }
    }

    setAuthReady(true); // ✅ mark as ready after check
  }, []);

  const login = (newToken, userObj) => {
    localStorage.setItem('glovendor_token', newToken);
    localStorage.setItem('glovendor_user', JSON.stringify(userObj));
    setToken(newToken);
    setUser(userObj);
  };

  const logout = () => {
    localStorage.removeItem('glovendor_token');
    localStorage.removeItem('glovendor_user');
    setToken(null);
    setUser(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        isAuthenticated: !!token,
        authReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
