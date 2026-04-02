import axiosInstance from './axiosInstance';
import type { Grade, GradeDetail } from '../types';

export const getGrades = () => axiosInstance.get<GradeDetail[]>('/grades');
export const getGradesByEnrollment = (enrollmentId: number) =>
  axiosInstance.get<GradeDetail[]>(`/grades/enrollment/${enrollmentId}`);
export const getGradesByStudent = (studentId: number) =>
  axiosInstance.get<GradeDetail[]>(`/grades/student/${studentId}`);
export const getGradesByCourse = (courseId: number) =>
  axiosInstance.get<GradeDetail[]>(`/grades/course/${courseId}`);
export const createGrade = (data: Grade) => axiosInstance.post<GradeDetail>('/grades', data);
export const updateGrade = (id: number, data: Partial<Grade>) =>
  axiosInstance.put<GradeDetail>(`/grades/${id}`, data);
export const deleteGrade = (id: number) => axiosInstance.delete(`/grades/${id}`);
