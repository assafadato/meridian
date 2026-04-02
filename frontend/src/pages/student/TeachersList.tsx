import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardActions, Chip, CircularProgress,
  Alert, Avatar, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Divider, Paper, List, ListItem, ListItemText, Tooltip,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SendIcon from '@mui/icons-material/Send';
import LockIcon from '@mui/icons-material/Lock';
import InboxIcon from '@mui/icons-material/Inbox';
import axiosInstance from '../../api/axiosInstance';
import { sendMessage, getStudentInbox } from '../../api/messages';
import { getTeachers, type UserRecord } from '../../api/users';
import { useNotifications } from '../../context/NotificationContext';
import type { Enrollment, Message } from '../../types';

interface TeacherInfo {
  displayName: string;
  courses: string[];
  userRecord?: UserRecord;
}

/** Small red dot indicator */
const RedDot = ({ absolute }: { absolute?: boolean }) => (
  <Box sx={{
    width: 10, height: 10, borderRadius: '50%',
    bgcolor: 'error.main',
    ...(absolute
      ? { position: 'absolute', top: 0, right: 0, border: '2px solid white' }
      : { flexShrink: 0, ml: 0.5 }),
  }} />
);

const TeachersList: React.FC = () => {
  const { unreadMessageIds, markMessageRead } = useNotifications();
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [inbox, setInbox] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [composeTo, setComposeTo] = useState<TeacherInfo | null>(null);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [enrollRes, teacherUsersRes, inboxRes] = await Promise.all([
        axiosInstance.get<Enrollment[]>('/enrollments/me'),
        getTeachers(),
        getStudentInbox(),
      ]);

      const enrollments: Enrollment[] = enrollRes.data;
      const teacherUsers: UserRecord[] = teacherUsersRes.data;

      const map = new Map<string, TeacherInfo>();
      for (const e of enrollments) {
        const name = e.course?.teacher;
        if (!name) continue;
        if (!map.has(name)) {
          const userRecord = teacherUsers.find((u) => u.username === name);
          map.set(name, { displayName: name, courses: [], userRecord });
        }
        map.get(name)!.courses.push(e.course!.name!);
      }

      setTeachers([...map.values()]);
      setInbox(inboxRes.data);
    } catch {
      setError('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /** Messages from a specific teacher that are unread */
  const unreadFromTeacher = (teacherUsername: string) =>
    inbox.filter((m) => m.fromUsername === teacherUsername && m.id != null && unreadMessageIds.has(m.id));

  /** Click teacher card → mark all their unread messages as read */
  const handleCardClick = async (t: TeacherInfo) => {
    const unread = unreadFromTeacher(t.displayName);
    if (unread.length === 0) return;
    for (const m of unread) {
      if (m.id != null) {
        await markMessageRead(m.id);
        setInbox((prev) => prev.map((msg) => msg.id === m.id ? { ...msg, readByRecipient: true } : msg));
      }
    }
  };

  /** Click individual message row → mark that message as read */
  const handleMessageRowClick = async (m: Message) => {
    if (m.id != null && unreadMessageIds.has(m.id)) {
      await markMessageRead(m.id);
      setInbox((prev) => prev.map((msg) => msg.id === m.id ? { ...msg, readByRecipient: true } : msg));
    }
  };

  const openCompose = (e: React.MouseEvent, t: TeacherInfo) => {
    e.stopPropagation();
    setComposeTo(t);
    setSubject('');
    setContent('');
    setSendError('');
    setSendSuccess(false);
  };

  const handleSend = async () => {
    if (!composeTo?.userRecord || !subject.trim() || !content.trim()) return;
    setSending(true);
    setSendError('');
    try {
      await sendMessage({ toUsername: composeTo.userRecord.username, subject, content, fromUsername: '' });
      setSendSuccess(true);
      setTimeout(() => setComposeTo(null), 1200);
    } catch {
      setSendError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress size={48} /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <PersonIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>My Teachers</Typography>
        <Chip label={teachers.length} size="small" color="primary" />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {teachers.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          You are not enrolled in any courses yet. Enroll in courses to see your teachers here.
        </Alert>
      ) : (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {teachers.map((t) => {
            const hasUnread = unreadFromTeacher(t.displayName).length > 0;
            return (
              <Grid key={t.displayName} size={{ xs: 12, sm: 6, md: 4 }}>
                <Tooltip title={hasUnread ? 'Click card to mark messages as read' : ''}>
                  <Card
                    elevation={1}
                    onClick={() => handleCardClick(t)}
                    sx={{
                      borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column',
                      cursor: hasUnread ? 'pointer' : 'default',
                      border: hasUnread ? '1.5px solid' : '1.5px solid transparent',
                      borderColor: hasUnread ? 'error.main' : 'transparent',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <CardContent sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                        <Box sx={{ position: 'relative' }}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>
                            {t.displayName[0].toUpperCase()}
                          </Avatar>
                          {hasUnread && <RedDot absolute />}
                        </Box>
                        <Box>
                          <Typography fontWeight={700}>{t.displayName}</Typography>
                          <Chip
                            label={t.userRecord ? 'Teacher' : 'External'}
                            size="small"
                            color={t.userRecord ? 'primary' : 'default'}
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                          Teaching you:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {t.courses.map((c) => (
                            <Chip key={c} label={c} size="small" variant="outlined" color="primary" />
                          ))}
                        </Box>
                      </Box>
                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 2 }}>
                      {t.userRecord ? (
                        <Button
                          size="small" variant="contained" startIcon={<SendIcon />}
                          onClick={(e) => openCompose(e, t)}
                          sx={{ borderRadius: 2 }}
                        >
                          Message
                        </Button>
                      ) : (
                        <Button size="small" disabled startIcon={<LockIcon />}>No account</Button>
                      )}
                    </CardActions>
                  </Card>
                </Tooltip>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Messages from teachers */}
      <Divider sx={{ mb: 3 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <InboxIcon color="primary" />
        <Typography variant="h6" fontWeight={600}>Messages from Teachers</Typography>
        {inbox.some((m) => m.id != null && unreadMessageIds.has(m.id)) && (
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'error.main' }} />
        )}
      </Box>

      <Paper elevation={1} sx={{ borderRadius: 2 }}>
        {inbox.length === 0 ? (
          <Typography sx={{ p: 3, color: 'text.secondary' }}>No messages from teachers yet.</Typography>
        ) : (
          <List disablePadding>
            {inbox.map((m, i) => {
              const isUnread = m.id != null && unreadMessageIds.has(m.id);
              return (
                <React.Fragment key={m.id}>
                  <Tooltip title={isUnread ? 'Click to mark as read' : ''} placement="left">
                    <ListItem
                      alignItems="flex-start"
                      onClick={() => handleMessageRowClick(m)}
                      sx={{
                        cursor: isUnread ? 'pointer' : 'default',
                        bgcolor: isUnread ? 'error.50' : 'transparent',
                        transition: 'background-color 0.2s',
                        '&:hover': isUnread ? { bgcolor: 'error.100' } : {},
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1 }}>
                        <Box sx={{ position: 'relative' }}>
                          <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36, mt: 0.5 }}>
                            {m.fromUsername[0].toUpperCase()}
                          </Avatar>
                          {isUnread && (
                            <Box sx={{ position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius: '50%', bgcolor: 'error.main', border: '2px solid white' }} />
                          )}
                        </Box>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                              <Typography fontWeight={isUnread ? 800 : 600}>{m.fromUsername}</Typography>
                              <Chip label={m.subject} size="small" variant="outlined" />
                              {isUnread && (
                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'error.main', flexShrink: 0 }} />
                              )}
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" sx={{ mt: 0.5 }}>{m.content}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {m.sentAt ? new Date(m.sentAt).toLocaleString() : ''}
                              </Typography>
                            </>
                          }
                        />
                      </Box>
                    </ListItem>
                  </Tooltip>
                  {i < inbox.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Paper>

      {/* Compose dialog */}
      <Dialog open={!!composeTo} onClose={() => setComposeTo(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Message {composeTo?.displayName}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {sendSuccess && <Alert severity="success">Message sent!</Alert>}
            {sendError && <Alert severity="error">{sendError}</Alert>}
            <TextField label="Subject" fullWidth value={subject}
              onChange={(e) => setSubject(e.target.value)} disabled={sendSuccess} />
            <TextField label="Message" multiline rows={5} fullWidth value={content}
              onChange={(e) => setContent(e.target.value)} disabled={sendSuccess} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setComposeTo(null)}>Cancel</Button>
          <Button
            variant="contained"
            endIcon={sending ? <CircularProgress size={14} color="inherit" /> : <SendIcon />}
            onClick={handleSend}
            disabled={sending || sendSuccess || !subject.trim() || !content.trim()}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeachersList;
