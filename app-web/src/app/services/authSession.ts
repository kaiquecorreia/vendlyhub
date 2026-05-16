const AUTH_STORAGE_KEYS = ['accessToken', 'refreshToken', 'user'] as const;

export const AUTH_INVALID_SESSION_EVENT = 'auth:invalid-session';

let isInvalidatingSession = false;

function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
}

export function clearAuthSessionStorage(): void {
  if (typeof window === 'undefined') return;

  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  clearAuthCookie();
}

function sanitizeRedirectPath(path: string): string {
  if (!path.startsWith('/')) return '/';
  if (path.startsWith('/login')) return '/';
  return path;
}

export function resolveCurrentPath(): string {
  if (typeof window === 'undefined') return '/';
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  return sanitizeRedirectPath(currentPath);
}

export function buildLoginRedirectUrl(redirectPath?: string): string {
  const sanitizedRedirect = sanitizeRedirectPath(redirectPath ?? '/');
  if (sanitizedRedirect === '/') return '/login';
  return `/login?redirect=${encodeURIComponent(sanitizedRedirect)}`;
}

export function notifyInvalidSession(reason?: string): void {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent(AUTH_INVALID_SESSION_EVENT, {
      detail: { reason: reason ?? 'invalid-session' },
    }),
  );
}

export function forceClientLogout(options?: { redirectPath?: string; reason?: string }): void {
  if (typeof window === 'undefined') return;
  if (isInvalidatingSession) return;
  isInvalidatingSession = true;

  clearAuthSessionStorage();
  notifyInvalidSession(options?.reason);

  const destination = buildLoginRedirectUrl(options?.redirectPath ?? resolveCurrentPath());
  window.location.replace(destination);
}
