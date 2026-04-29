const AUTH_KEY = "supportSaas.auth";

const loadAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveAuth = (payload) => {
  localStorage.setItem(AUTH_KEY, JSON.stringify(payload));
};

const clearAuth = () => {
  localStorage.removeItem(AUTH_KEY);
};

export { loadAuth, saveAuth, clearAuth };
