import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL,
  withCredentials: true
});

const authApi = axios.create({
  baseURL,
  withCredentials: true
});

let accessToken = null;
let onUnauthorized = null;
let onTokenUpdate = null;
let isRefreshing = false;
let refreshPromise = null;

const setAccessToken = (token) => {
  accessToken = token;
};

const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

const setTokenUpdateHandler = (handler) => {
  onTokenUpdate = handler;
};

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

const refreshAccessToken = async () => {
  const response = await authApi.post("/auth/refresh");
  const token = response?.data?.data?.accessToken;
  if (!token) {
    throw new Error("Missing access token");
  }
  setAccessToken(token);
  if (onTokenUpdate) {
    onTokenUpdate(token);
  }
  return token;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    if (!response || response.status !== 401 || config?._retry) {
      return Promise.reject(error);
    }

    config._retry = true;

    try {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken().finally(() => {
          isRefreshing = false;
        });
      }
      const token = await refreshPromise;
      config.headers.Authorization = `Bearer ${token}`;
      return api(config);
    } catch (refreshError) {
      if (onUnauthorized) {
        onUnauthorized();
      }
      return Promise.reject(refreshError);
    }
  }
);

export { api, baseURL, setAccessToken, setUnauthorizedHandler, setTokenUpdateHandler };
