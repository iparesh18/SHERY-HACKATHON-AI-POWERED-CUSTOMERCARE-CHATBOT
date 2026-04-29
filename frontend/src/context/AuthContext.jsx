import { createContext, useEffect, useMemo, useState } from "react";
import { login as loginApi, register as registerApi, logout as logoutApi } from "../services/auth.service.js";
import { setAccessToken, setTokenUpdateHandler, setUnauthorizedHandler } from "../services/api.js";
import { clearAuth, loadAuth, saveAuth } from "../utils/storage.js";

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const stored = loadAuth();
    if (stored?.user && stored?.accessToken) {
      setUser(stored.user);
      setToken(stored.accessToken);
      setAccessToken(stored.accessToken);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      handleLogout(false);
    });
    setTokenUpdateHandler((updatedToken) => {
      setToken(updatedToken);
      if (user) {
        saveAuth({ user, accessToken: updatedToken });
      }
    });
  }, [user]);

  const handleLogin = async (payload) => {
    const response = await loginApi(payload);
    const { user: userData, accessToken } = response.data.data;
    setUser(userData);
    setToken(accessToken);
    setAccessToken(accessToken);
    saveAuth({ user: userData, accessToken });
    return userData;
  };

  const handleRegister = async (payload) => {
    const response = await registerApi(payload);
    const { user: userData, accessToken } = response.data.data;
    setUser(userData);
    setToken(accessToken);
    setAccessToken(accessToken);
    saveAuth({ user: userData, accessToken });
    return userData;
  };

  const setSession = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    setAccessToken(accessToken);
    saveAuth({ user: userData, accessToken });
  };

  const handleLogout = async (shouldCallApi = true) => {
    if (shouldCallApi) {
      try {
        await logoutApi();
      } catch {
        // Ignore logout errors.
      }
    }
    setUser(null);
    setToken(null);
    setAccessToken(null);
    clearAuth();
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isInitialized,
      login: handleLogin,
      register: handleRegister,
      logout: handleLogout,
      setSession
    }),
    [user, token, isInitialized]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthProvider };
