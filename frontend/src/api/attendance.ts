import axiosInstance from './axiosInstance';
import type { Attendance, AttendanceDetail } from '../types';

export const getAllAttendance = () => axiosInstance.get<AttendanceDetail[]>('/attendance');
export const getAttendanceByEnrollment = (enrollmentId: number) =>
  axiosInstance.get<AttendanceDetail[]>(`/attendance/enrollment/${enrollmentId}`);
export const getAttendanceByStudent = (studentId: number) =>
  axiosInstance.get<AttendanceDetail[]>(`/attendance/student/${studentId}`);
export const getAttendanceByCourse = (courseId: number) =>
  axiosInstance.get<AttendanceDetail[]>(`/attendance/course/${courseId}`);
export const getAttendanceByDate = (date: string) =>
  axiosInstance.get<AttendanceDetail[]>(`/attendance/date?date=${date}`);
export const createAttendance = (data: Attendance) =>
  axiosInstance.post<AttendanceDetail>('/attendance', data);
export const updateAttendance = (id: number, data: Partial<Attendance>) =>
  axiosInstance.put<AttendanceDetail>(`/attendance/${id}`, data);
export const deleteAttendance = (id: number) => axiosInstance.delete(`/attendance/${id}`);
