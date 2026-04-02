import axiosInstance from './axiosInstance';
import type { GradeInquiry } from '../types';

export const submitInquiry = (gradeId: number, message: string) =>
  axiosInstance.post<GradeInquiry>('/inquiries', { gradeId, message });
export const getMyInquiries = () => axiosInstance.get<GradeInquiry[]>('/inquiries/me');
export const getTeacherInquiries = () => axiosInstance.get<GradeInquiry[]>('/inquiries/teacher');
export const respondToInquiry = (id: number, response: string) =>
  axiosInstance.put<GradeInquiry>(`/inquiries/${id}/respond`, { response });
