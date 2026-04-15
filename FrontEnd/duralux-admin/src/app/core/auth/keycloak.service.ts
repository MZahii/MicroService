import { environment } from '../../../environments/environment';

const ACCESS_TOKEN_KEY = 'np_access_token';
const REFRESH_TOKEN_KEY = 'np_refresh_token';
const ROLE_KEY = 'np_role';
const REDIRECT_KEY = 'np_redirect_to';
const USER_KEY = 'np_user';
const API_BASE_URL = environment.apiBaseUrl;

let refreshInFlight: Promise<string> | null = null;

function readFromStorage(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

function getTokenStorageType(): 'local' | 'session' {
  if (localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY)) {
    return 'local';
  }
  return 'session';
}

function writeTokenPair(accessToken: string, refreshToken: string): void {
  const storageType = getTokenStorageType();
  const storage = storageType === 'local' ? localStorage : sessionStorage;
  storage.setItem(ACCESS_TOKEN_KEY, accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function parseJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4 || 4)) % 4, '=');
    const json = atob(padded);
    return JSON.parse(json) as { exp?: number };
  } catch {
    return null;
  }
}

function clearSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(REDIRECT_KEY);
  localStorage.removeItem(USER_KEY);

  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(ROLE_KEY);
  sessionStorage.removeItem(REDIRECT_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export const keycloak = {
  async login(_options?: { redirectUri?: string }): Promise<void> {
    window.location.href = `${window.location.origin}/login`;
  },

  async logout(options?: { redirectUri?: string }): Promise<void> {
    clearSession();
    const target = options?.redirectUri ?? `${window.location.origin}/login`;
    window.location.href = target;
  }
};

export async function initializeKeycloak(): Promise<boolean> {
  return true;
}

export async function login(): Promise<void> {
  await keycloak.login();
}

export async function logout(): Promise<void> {
  await keycloak.logout();
}

export function isAuthenticated(): boolean {
  return !!readFromStorage(ACCESS_TOKEN_KEY);
}

export function getUserRoles(): string[] {
  const role = readFromStorage(ROLE_KEY);
  return role ? [role] : [];
}

export function hasAnyRole(expectedRoles: string[]): boolean {
  const roles = getUserRoles();
  return expectedRoles.some(role => roles.includes(role));
}

export function getLandingRouteByRole(): string {
  const role = readFromStorage(ROLE_KEY);

  const backofficeRoles = [
    'ADMIN',
    'HR',
    'DOCTOR',
    'NURSE',
    'SURGEON',
    'PHARMACIST',
    'RECEPTIONIST',
    'LAB_AGENT'
  ];

  if (role && backofficeRoles.includes(role)) {
    return '/backoffice/dashboard';
  }

  if (role === 'GUARDIAN') {
    return '/frontoffice/home';
  }

  return '/login';
}

async function refreshAccessToken(): Promise<string> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  const currentRefreshToken = readFromStorage(REFRESH_TOKEN_KEY);
  if (!currentRefreshToken) {
    clearSession();
    throw new Error('Session expired. Please login again.');
  }

  refreshInFlight = (async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken: currentRefreshToken })
    });

    if (!response.ok) {
      clearSession();
      throw new Error('Session expired. Please login again.');
    }

    const data = await response.json() as {
      accessToken?: string;
      refreshToken?: string;
    };

    if (!data.accessToken || !data.refreshToken) {
      clearSession();
      throw new Error('Session expired. Please login again.');
    }

    writeTokenPair(data.accessToken, data.refreshToken);
    return data.accessToken;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export async function getValidToken(): Promise<string> {
  let token = readFromStorage(ACCESS_TOKEN_KEY);

  if (!token) {
    throw new Error('Access token not found. Please login again.');
  }

  let payload = parseJwtPayload(token);
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (!payload?.exp || payload.exp <= nowSeconds) {
    token = await refreshAccessToken();
    payload = parseJwtPayload(token);
    if (!payload?.exp || payload.exp <= nowSeconds) {
      clearSession();
      throw new Error('Session expired. Please login again.');
    }
  }

  return token;
}
