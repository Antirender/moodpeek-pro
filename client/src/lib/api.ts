/// <reference types="vite/client" />
import axios, { type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174/api';

export const TOKEN_STORAGE_KEY = 'moodpeek_token';
export const USER_STORAGE_KEY = 'moodpeek_user';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface UserPreferences {
  defaultCity?: string;
  theme?: 'system' | 'light' | 'dark';
}

export interface User {
  id: string;
  email: string;
  preferences?: UserPreferences;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', { email, password });
  return response.data;
}

export interface RegisterPayload {
  email: string;
  password: string;
  defaultCity?: string;
  theme?: 'system' | 'light' | 'dark';
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/register', payload);
  return response.data;
}

export interface PreferencesResponse {
  defaultCity?: string;
  theme?: 'system' | 'light' | 'dark';
}

export async function getPreferences(): Promise<PreferencesResponse> {
  const response = await api.get<PreferencesResponse>('/preferences');
  return response.data;
}

export interface UpdatePreferencesPayload {
  defaultCity?: string;
  theme?: 'system' | 'light' | 'dark';
}

export async function updatePreferences(payload: UpdatePreferencesPayload): Promise<User> {
  const response = await api.put<{ user: User }>('/preferences', payload);
  return response.data.user;
}
