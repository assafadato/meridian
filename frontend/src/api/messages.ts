import axiosInstance from './axiosInstance';
import type { Message } from '../types';

export const sendMessage = (data: Omit<Message, 'id' | 'sentAt' | 'readByRecipient'>) =>
  axiosInstance.post<Message>('/messages', data);
export const getInbox = () => axiosInstance.get<Message[]>('/messages/inbox');
export const getStudentInbox = () => axiosInstance.get<Message[]>('/messages/my-inbox');
export const getSent = () => axiosInstance.get<Message[]>('/messages/sent');
export const markRead = (id: number) => axiosInstance.patch<Message>(`/messages/${id}/read`);
export const markAllRead = () => axiosInstance.post('/messages/mark-all-read');
export const getUnreadCount = () => axiosInstance.get<{ count: number }>('/messages/unread-count');
