import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from './AuthContext';
import { markRead } from '../api/messages';
import type { Message, GradeDetail, GradeInquiry } from '../types';

// ── localStorage helpers ──────────────────────────────────────────────────────
const lsKey = (username: string, type: string) => `${username}_seen_${type}`;

const lsGetSeenIds = (username: string, type: string): Set<number> => {
  try {
    const v = localStorage.getItem(lsKey(username, type));
    return v ? new Set(JSON.parse(v) as number[]) : new Set();
  } catch {
    return new Set();
  }
};

const lsAddSeenId = (username: string, type: string, id: number): void => {
  const s = lsGetSeenIds(username, type);
  s.add(id);
  localStorage.setItem(lsKey(username, type), JSON.stringify([...s]));
};

// ── Context types ─────────────────────────────────────────────────────────────
export interface NotificationCtx {
  /** Message IDs whose readByRecipient === false in the user's inbox */
  unreadMessageIds: Set<number>;
  /** Teacher: inquiry IDs not yet dismissed in localStorage */
  newInquiryIds: Set<number>;
  /** Student: grade IDs not yet dismissed in localStorage */
  newGradeIds: Set<number>;

  hasNewMessages: boolean;
  hasNewInquiries: boolean;
  hasNewGrades: boolean;

  markMessageRead: (id: number) => Promise<void>;
  markInquirySeen: (id: number) => void;
  markGradeSeen:   (id: number) => void;

  refresh: () => void;
}

const defaultCtx: NotificationCtx = {
  unreadMessageIds: new Set(),
  newInquiryIds:    new Set(),
  newGradeIds:      new Set(),
  hasNewMessages:   false,
  hasNewInquiries:  false,
  hasNewGrades:     false,
  markMessageRead: async () => {},
  markInquirySeen: () => {},
  markGradeSeen:   () => {},
  refresh:         () => {},
};

const NotificationContext = createContext<NotificationCtx>(defaultCtx);
export const useNotifications = () => useContext(NotificationContext);

// ── Provider ──────────────────────────────────────────────────────────────────
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [unreadMessageIds, setUnreadMessageIds] = useState<Set<number>>(new Set());
  const [newInquiryIds,    setNewInquiryIds]    = useState<Set<number>>(new Set());
  const [newGradeIds,      setNewGradeIds]      = useState<Set<number>>(new Set());

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const { username, role } = user;

    try {
      if (role === 'TEACHER') {
        const [msgRes, inquiryRes] = await Promise.allSettled([
          axiosInstance.get<Message[]>('/messages/inbox'),
          axiosInstance.get<GradeInquiry[]>('/inquiries/teacher'),
        ]);

        if (msgRes.status === 'fulfilled') {
          setUnreadMessageIds(
            new Set(msgRes.value.data.filter((m) => !m.readByRecipient).map((m) => m.id as number))
          );
        }

        if (inquiryRes.status === 'fulfilled') {
          const seen = lsGetSeenIds(username, 'inquiries');
          setNewInquiryIds(
            new Set(inquiryRes.value.data.filter((i) => i.id != null && !seen.has(i.id as number)).map((i) => i.id as number))
          );
        }
      } else if (role === 'STUDENT') {
        const [msgRes, gradeRes] = await Promise.allSettled([
          axiosInstance.get<Message[]>('/messages/my-inbox'),
          axiosInstance.get<GradeDetail[]>('/grades/me'),
        ]);

        if (msgRes.status === 'fulfilled') {
          setUnreadMessageIds(
            new Set(msgRes.value.data.filter((m) => !m.readByRecipient).map((m) => m.id as number))
          );
        }

        if (gradeRes.status === 'fulfilled') {
          const seen = lsGetSeenIds(username, 'grades');
          setNewGradeIds(
            new Set(gradeRes.value.data.filter((g) => g.id != null && !seen.has(g.id as number)).map((g) => g.id as number))
          );
        }
      }
    } catch {
      // silently ignore
    }
  }, [user]);

  // Mark a single message as read via API
  const markMessageRead = useCallback(async (id: number) => {
    try {
      await markRead(id);
      setUnreadMessageIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    } catch { /* silent */ }
  }, []);

  // Dismiss an inquiry notification (localStorage)
  const markInquirySeen = useCallback((id: number) => {
    if (!user) return;
    lsAddSeenId(user.username, 'inquiries', id);
    setNewInquiryIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }, [user]);

  // Dismiss a grade notification (localStorage)
  const markGradeSeen = useCallback((id: number) => {
    if (!user) return;
    lsAddSeenId(user.username, 'grades', id);
    setNewGradeIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }, [user]);

  useEffect(() => {
    fetchData();
    timerRef.current = setInterval(fetchData, 30_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchData]);

  const value: NotificationCtx = {
    unreadMessageIds,
    newInquiryIds,
    newGradeIds,
    hasNewMessages:  unreadMessageIds.size > 0,
    hasNewInquiries: newInquiryIds.size > 0,
    hasNewGrades:    newGradeIds.size > 0,
    markMessageRead,
    markInquirySeen,
    markGradeSeen,
    refresh: fetchData,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
