import axios, { AxiosError } from 'axios';
import { forceClientLogout, resolveCurrentPath } from './authSession';

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

export const apiClient = axios.create({
  baseURL: baseUrl,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }
  return config;
});

function extractApiMessage(error: AxiosError<{ message?: string | string[] }>): string {
  const message = error.response?.data?.message;
  if (Array.isArray(message) && message.length > 0) {
    return String(message[0] ?? '').trim();
  }
  if (typeof message === 'string') {
    return message.trim();
  }
  return '';
}

function shouldForceLogout(error: AxiosError<{ message?: string | string[] }>): boolean {
  const status = error.response?.status;
  const requestHadAuth = Boolean(error.config?.headers?.Authorization);
  if (!requestHadAuth || !status) return false;

  if (status === 401) return true;

  if (status === 404) {
    const message = extractApiMessage(error).toLowerCase();
    return message.includes('user not found');
  }

  return false;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && typeof window !== 'undefined' && shouldForceLogout(error)) {
      forceClientLogout({
        reason: 'api-unauthorized',
        redirectPath: resolveCurrentPath(),
      });
    }
    return Promise.reject(error);
  },
);

export function normalizeApiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string | string[] }>;
    const message = axiosError.response?.data?.message;
    if (Array.isArray(message) && message.length > 0) {
      return message[0];
    }
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }
  return fallback;
}
