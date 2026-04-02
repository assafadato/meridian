import axiosInstance from './axiosInstance';
import type { Student } from '../types';

export const getStudents = () => axiosInstance.get<Student[]>('/students');
export const getStudent = (id: number) => axiosInstance.get<Student>(`/students/${id}`);
export const createStudent = (data: Omit<Student, 'id'>) => axiosInstance.post<Student>('/students', data);
export const updateStudent = (id: number, data: Omit<Student, 'id'>) => axiosInstance.put<Student>(`/students/${id}`, data);
export const deleteStudent = (id: number) => axiosInstance.delete(`/students/${id}`);
export const searchStudents = (name: string) => axiosInstance.get<Student[]>(`/students/search?name=${encodeURIComponent(name)}`);
