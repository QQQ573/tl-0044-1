import request from '@/utils/request';
import { User } from '@/types';

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export const login = (username: string, password: string): Promise<LoginResponse> => {
  return request.post('/auth/login', { username, password });
};

export const getProfile = (): Promise<User> => {
  return request.get('/auth/profile');
};
