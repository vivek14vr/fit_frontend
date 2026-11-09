export type UserRole = "admin" | "nutritionist" | "user";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  dashboardUnlocked: boolean;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthenticatedUser;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3101";
const AUTH_REFRESH_TIMEOUT_MS = 8_000;
let accessToken: string | null = null;
let refreshPromise: Promise<AuthResponse | null> | null = null;

export function storeAuth(response: AuthResponse) {
  accessToken = response.accessToken;
  return response;
}

export function clearStoredAuth() {
  accessToken = null;
  // Remove tokens written by older builds during the transition to memory-only access tokens.
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("deepti_access_token");
    window.localStorage.removeItem("deepti_user");
  }
}

export async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), AUTH_REFRESH_TIMEOUT_MS);

    try {
      const response = await fetch(`${apiUrl}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        signal: controller.signal,
      });

      if (!response.ok) {
        clearStoredAuth();
        return null;
      }

      const body = (await response.json().catch(() => null)) as AuthResponse | null;

      if (!body?.accessToken || !body.user) {
        clearStoredAuth();
        return null;
      }

      return storeAuth(body);
    } catch (error) {
      clearStoredAuth();
      console.warn("Access-token refresh failed.", error instanceof Error ? error.name : "UnknownError");
      return null;
    } finally {
      window.clearTimeout(timeoutId);
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function ensureAccessToken() {
  if (accessToken) {
    return accessToken;
  }

  const refreshed = await refreshAccessToken().catch(() => null);
  return refreshed?.accessToken ?? null;
}

export async function fetchWithAuth(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const headers = new Headers(init.headers);
  const token = await ensureAccessToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(input, {
    ...init,
    credentials: "include",
    headers,
  });

  if (response.status !== 401) {
    return response;
  }

  const method = (init.method ?? "GET").toString().toUpperCase();
  const isSafeToRetry = method === "GET" || method === "HEAD" || method === "OPTIONS";
  if (!isSafeToRetry) {
    return response;
  }

  const refreshed = await refreshAccessToken().catch(() => null);

  if (!refreshed) {
    return response;
  }

  const retryHeaders = new Headers(init.headers);
  retryHeaders.set("Authorization", `Bearer ${refreshed.accessToken}`);
  response = await fetch(input, {
    ...init,
    credentials: "include",
    headers: retryHeaders,
  });

  return response;
}

export { apiUrl };
