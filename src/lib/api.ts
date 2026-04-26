/**
 * UCAR API Client
 * Handles all communication with the local Express backend.
 */

const API_BASE = 'http://127.0.0.1:3001/api';

// ── Helper ──────────────────────────────────────────────────────

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('ucar-access-token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(data.error || 'Erreur inconnue', res.status, data.code);
  }

  return data as T;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'ApiError';
  }
}

// ── Auth API ────────────────────────────────────────────────────

export interface RegisterPayload {
  username: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  password: string;
  institution_id: string;
  role_name?: string;
}

export interface RegisterResponse {
  message: string;
  verification_url: string;
  user_id: string;
}

export function register(data: RegisterPayload) {
  return request<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface LoginResponse {
  message: string;
  requires_otp: boolean;
  session_token: string;
  otp_code: string; // DEV only
  user_preview: { name: string; email: string; phone?: string; masked_contact?: string };
}

export function login(email: string, password: string) {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export interface VerifyOtpResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    institutionId: string;
    institutionName: string;
    avatarInitials: string;
  };
}

export function verifyOtp(sessionToken: string, otpCode: string) {
  return request<VerifyOtpResponse>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ session_token: sessionToken, otp_code: otpCode }),
  });
}

export interface VerifyEmailResponse {
  message: string;
  already_verified?: boolean;
}

export function verifyEmail(token: string) {
  return request<VerifyEmailResponse>(`/auth/verify-email?token=${token}`, {
    method: 'GET',
  });
}

export interface Institution {
  id: string;
  institution_name: string;
  location: string;
}

export function getInstitutions() {
  return request<{ institutions: Institution[] }>('/institutions');
}

export interface RoleItem {
  id: string;
  role_name: string;
}

export function getRoles() {
  return request<{ roles: RoleItem[] }>('/roles');
}

export interface PendingUser {
  id: string;
  username: string;
  nom: string;
  prenom: string;
  email: string;
  email_verified: number;
  approval_status: string;
  created_at: string;
  role_name: string;
  institution_name: string;
}

export function getPendingUsers() {
  return request<{ users: PendingUser[] }>('/auth/pending-users');
}

export function approveUser(userId: string, status: 'approved' | 'rejected') {
  return request<{ message: string; status: string }>('/auth/approve-user', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, status }),
  });
}

export function refreshToken(refreshTokenValue: string) {
  return request<{ access_token: string }>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshTokenValue }),
  });
}

export function getMe() {
  return request<{ user: VerifyOtpResponse['user'] }>('/auth/me');
}
