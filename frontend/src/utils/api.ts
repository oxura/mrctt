import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const part = parts.pop();
    return part ? part.split(';').shift() || null : null;
  }
  return null;
};

api.interceptors.request.use((config) => {
  const csrfToken = getCookie('csrf_token');
  const tenantId = getCookie('tenant_id');

  config.headers = config.headers ?? {};

  if (csrfToken) {
    const method = config.method?.toUpperCase();
    if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }

  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    const requestId = response.headers['x-request-id'];
    if (requestId && import.meta.env.DEV) {
      console.debug('[API] Request ID:', requestId);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const requestId = error.response?.headers?.['x-request-id'];
    
    if (requestId) {
      error.requestId = requestId;
      if (import.meta.env.DEV) {
        console.error('[API] Error with Request ID:', requestId);
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await api.post('/auth/refresh');
        return api(originalRequest);
      } catch (refreshError) {
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
