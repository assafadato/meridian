import axiosInstance from './axiosInstance';
import type { Course } from '../types';

export const getCourses = () => axiosInstance.get<Course[]>('/courses');
export const getCourse = (id: number) => axiosInstance.get<Course>(`/courses/${id}`);
export const createCourse = (data: Course) => axiosInstance.post<Course>('/courses', data);
export const updateCourse = (id: number, data: Course) => axiosInstance.put<Course>(`/courses/${id}`, data);
export const deleteCourse = (id: number) => axiosInstance.delete(`/courses/${id}`);
export const searchCourses = (name: string) => axiosInstance.get<Course[]>(`/courses/search?name=${name}`);
