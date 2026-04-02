import axiosInstance from './axiosInstance';

export interface UserRecord {
  id: number;
  username: string;
  role: string;
  profilePhoto?: string;
}

export const getTeachers  = () => axiosInstance.get<UserRecord[]>('/users/teachers');
export const getAllUsers   = () => axiosInstance.get<UserRecord[]>('/users');
export const createUser   = (data: { username: string; password: string; role: string }) =>
  axiosInstance.post<UserRecord>('/users', data);
export const updateUser   = (id: number, data: Record<string, string>) =>
  axiosInstance.put<UserRecord>(`/users/${id}`, data);
export const deleteUser   = (id: number) => axiosInstance.delete(`/users/${id}`);
