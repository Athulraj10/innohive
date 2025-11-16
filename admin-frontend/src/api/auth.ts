import api from './api';
import { LoginRequest, AuthResponse } from '../types/api';

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', data);
  return response.data;
};
