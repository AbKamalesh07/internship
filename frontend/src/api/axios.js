import axios from "axios";
import { store } from "../app/store";
import { setAccessToken, forceLogout } from "../features/auth/authSlice";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// --- Request interceptor: attach the current access token to every call ---
api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Response interceptor: on a 401, try ONE silent refresh, then retry
// the original request. If the refresh itself fails, force logout so the
// user isn't stuck in a broken half-authenticated state. ---
let isRefreshing = false;
let queuedRequests = [];

const processQueue = (error, token = null) => {
  queuedRequests.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  queuedRequests = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Never try to refresh using the refresh endpoint itself, or we'd loop.
    if (originalRequest.url?.includes("/auth/refresh")) {
      store.dispatch(forceLogout());
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Another request already triggered a refresh — queue this one
      // and retry it once that refresh resolves.
      return new Promise((resolve, reject) => {
        queuedRequests.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = store.getState().auth.refreshToken;
      const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
      const newAccessToken = res.data.accessToken;

      store.dispatch(setAccessToken(newAccessToken));
      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      store.dispatch(forceLogout());
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
