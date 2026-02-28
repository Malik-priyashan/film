export type RegisterPayload = {
  email: string;
  password: string;
  fullName: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthResponse = {
  user?: unknown;
  token?: string;
  message?: string;
  error?: string;
  [key: string]: unknown;
};

const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    return "";
  }

  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "");
  }
  return "";
};

const request = async <T>(path: string, payload: unknown): Promise<T> => {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as T;

  if (!res.ok) {
    const message = (data as { error?: string; message?: string })?.error ||
      (data as { message?: string })?.message ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return data;
};

export const registerUser = (payload: RegisterPayload) =>
  request<AuthResponse>("/api/auth/register", payload);

export const loginUser = (payload: LoginPayload) =>
  request<AuthResponse>("/api/auth/login", payload);
