// src/services/api.ts
import axios, { AxiosError } from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- Request interceptor injects in-memory accessToken if present
let inMemoryAccessToken: string | null = null;
export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

// queue to hold requests while refreshing
let isRefreshing = false;
let failedQueue: {
  resolve: (value?: any) => void;
  reject: (err?: any) => void;
  config: any;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else {
      // attach token if available and retry
      if (token) p.config.headers["Authorization"] = `Bearer ${token}`;
      p.resolve(api(p.config));
    }
  });
  failedQueue = [];
};

// Attach access token if not using cookie flow
api.interceptors.request.use((config) => {
  if (inMemoryAccessToken && !config.headers?.Authorization) {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${inMemoryAccessToken}`;
  }
  return config;
});

// Response interceptor: handle 401 -> try refresh
api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError & { config?: any }) => {
    const originalConfig = err.config;
    if (!originalConfig) return Promise.reject(err);

    const status = err.response?.status;

    // If using cookie-based auth, your backend will return 401 and you should call /auth/refresh.
    if (status === 401 && !originalConfig._retry) {
      if (isRefreshing) {
        // queue request while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalConfig });
        });
      }

      originalConfig._retry = true;
      isRefreshing = true;

      try {
        // call refresh endpoint (backend should rotate tokens if needed)
        const response = await api.post("/auth/refresh", null, {
          // if refresh token is cookie-based, no body required
        });

        const newAccessToken: string | null =
          response.data?.accessToken ?? null;
        if (newAccessToken) setAccessToken(newAccessToken);

        processQueue(null, newAccessToken);
        return api(originalConfig);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Network errors: exponential backoff for idempotent GETs
    if (!err.response && originalConfig && originalConfig.method === "get") {
      const retries = originalConfig.__retryCount || 0;
      if (retries < 3) {
        originalConfig.__retryCount = retries + 1;
        const delay = Math.pow(2, retries) * 300;
        await new Promise((res) => setTimeout(res, delay));
        return api(originalConfig);
      }
    }

    return Promise.reject(err);
  }
);
