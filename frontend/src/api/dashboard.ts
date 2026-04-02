import axiosInstance from './axiosInstance';
import type { DashboardStats } from '../types';

export const getDashboardStats = () => axiosInstance.get<DashboardStats>('/dashboard/stats');
