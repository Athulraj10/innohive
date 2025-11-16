import api from './api';
import { RegisterRequest, LoginRequest, AuthResponse, User } from '../types/api';

export const register = async (data: RegisterRequest): Promise<{ user: User }> => {
  const response = await api.post<{ user: User }>('/auth/register', data);
  return response.data;
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', data);
  return response.data;
};

export const getMe = async (): Promise<{ user: User }> => {
  const response = await api.get<any>('/auth/me');
  // Support both shapes: { user: {...} } and raw user object
  const data = response.data;
  if (data && typeof data === 'object' && 'user' in data) {
    return data as { user: User };
  }
  return { user: data as User };
};

