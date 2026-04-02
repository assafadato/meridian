import axiosInstance from './axiosInstance';
import type { Enrollment } from '../types';

export const getEnrollments = () => axiosInstance.get<Enrollment[]>('/enrollments');
export const getEnrollment = (id: number) => axiosInstance.get<Enrollment>(`/enrollments/${id}`);
export const getEnrollmentsByStudent = (studentId: number) =>
  axiosInstance.get<Enrollment[]>(`/enrollments/student/${studentId}`);
export const getEnrollmentsByCourse = (courseId: number) =>
  axiosInstance.get<Enrollment[]>(`/enrollments/course/${courseId}`);
export const enroll = (studentId: number, courseId: number) =>
  axiosInstance.post<Enrollment>(`/enrollments/student/${studentId}/course/${courseId}`);
export const unenroll = (studentId: number, courseId: number) =>
  axiosInstance.delete(`/enrollments/student/${studentId}/course/${courseId}`);
export const deleteEnrollment = (id: number) => axiosInstance.delete(`/enrollments/${id}`);
