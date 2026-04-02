import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Avatar, Chip, CircularProgress,
  Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Divider, List, ListItem, ListItemText, Paper, IconButton, TextField,
  Tooltip,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import CloseIcon from '@mui/icons-material/Close';
import ReplyIcon from '@mui/icons-material/Reply';
import SendIcon from '@mui/icons-material/Send';
import axiosInstance from '../../api/axiosInstance';
import { getInbox, sendMessage } from '../../api/messages';
import { getTeacherInquiries, respondToInquiry } from '../../api/inquiries';
import { useNotifications } from '../../context/NotificationContext';
import type { Enrollment, Message, GradeInquiry } from '../../types';

// ── Dot indicators ────────────────────────────────────────────────────────────
const RedDot  = ({ abs }: { abs?: boolean }) => (
  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'error.main',
    ...(abs ? { position: 'absolute', top: 0, right: 0, border: '2px solid white' } : { flexShrink: 0 }) }} />
);
const BlueDot = ({ abs }: { abs?: boolean }) => (
  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'info.main',
    ...(abs ? { position: 'absolute', top: 0, right: 0, border: '2px solid white' } : { flexShrink: 0 }) }} />
);

interface StudentProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  linkedUsername?: string;
  profilePhoto?: string;
}

const TeacherMessages: React.FC = () => {
  const { unreadMessageIds, newInquiryIds, markMessageRead, markInquirySeen } = useNotifications();

  const [students, setStudents]   = useState<StudentProfile[]>([]);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [inquiries, setInquiries] = useState<GradeInquiry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  // selected student panel
  const [selected, setSelected] = useState<StudentProfile | null>(null);

  // reply state
  const [replying, setReplying]       = useState<Message | null>(null);
  const [replyText, setReplyText]     = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replyOk, setReplyOk]         = useState(false);

  // inquiry respond state
  const [responding, setResponding]       = useState<GradeInquiry | null>(null);
  const [respondText, setRespondText]     = useState('');
  const [respondSaving, setRespondSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [enrollRes, msgRes, inqRes] = await Promise.all([
        axiosInstance.get<Enrollment[]>('/enrollments/teacher'),
        getInbox(),
        getTeacherInquiries(),
      ]);

      // Deduplicate students
      const map = new Map<number, StudentProfile>();
      for (const e of enrollRes.data) {
        const s = e.student;
        if (s?.id && !map.has(s.id)) {
          map.set(s.id, {
            id: s.id,
            firstName:     s.firstName,
            lastName:      s.lastName,
            email:         s.email,
            linkedUsername: s.linkedUser?.username,
            profilePhoto:  s.linkedUser?.profilePhoto,
          });
        }
      }

      // Sort lastName ASC, firstName ASC
      const sorted = [...map.values()].sort((a, b) => {
        const l = a.lastName.localeCompare(b.lastName);
        return l !== 0 ? l : a.firstName.localeCompare(b.firstName);
      });

      setStudents(sorted);
      setMessages(msgRes.data);
      setInquiries(inqRes.data);
    } catch {
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const messagesFor = useCallback((s: StudentProfile): Message[] =>
    messages
      .filter((m) => m.fromUsername === s.linkedUsername)
      .sort((a, b) => (b.sentAt ?? '').localeCompare(a.sentAt ?? '')),
    [messages]);

  const inquiriesFor = useCallback((s: StudentProfile): GradeInquiry[] =>
    inquiries
      .filter((i) => i.student?.id === s.id)
      .sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? '')),
    [inquiries]);

  const hasUnreadMsg = (s: StudentProfile) =>
    messagesFor(s).some((m) => m.id != null && unreadMessageIds.has(m.id));

  const hasNewInq = (s: StudentProfile) =>
    inquiriesFor(s).some((i) => i.id != null && newInquiryIds.has(i.id));

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleMsgClick = async (m: Message) => {
    if (m.id != null && unreadMessageIds.has(m.id)) {
      await markMessageRead(m.id);
      setMessages((prev) => prev.map((x) => x.id === m.id ? { ...x, readByRecipient: true } : x));
    }
  };

  const handleInqClick = (i: GradeInquiry) => {
    if (i.id != null && newInquiryIds.has(i.id)) markInquirySeen(i.id);
  };

  const openReply = (e: React.MouseEvent, m: Message) => {
    e.stopPropagation();
    setReplying(m);
    setReplyText('');
    setReplyOk(false);
  };

  const handleReply = async () => {
    if (!replying || !replyText.trim()) return;
    setReplySending(true);
    try {
      await sendMessage({ toUsername: replying.fromUsername, subject: `Re: ${replying.subject}`, content: replyText, fromUsername: '' });
      setReplyOk(true);
      setTimeout(() => setReplying(null), 900);
    } catch { /* ignore */ } finally { setReplySending(false); }
  };

  const openRespond = (e: React.MouseEvent, inq: GradeInquiry) => {
    e.stopPropagation();
    setResponding(inq);
    setRespondText('');
  };

  const handleRespond = async () => {
    if (!responding?.id || !respondText.trim()) return;
    setRespondSaving(true);
    try {
      await respondToInquiry(responding.id, respondText);
      if (newInquiryIds.has(responding.id)) markInquirySeen(responding.id);
      setResponding(null);
      await load();
    } catch { /* ignore */ } finally { setRespondSaving(false); }
  };

  // Panel data for selected student
  const selMsgs = selected ? messagesFor(selected) : [];
  const selInqs = selected ? inquiriesFor(selected) : [];

  const unreadCount  = students.filter(hasUnreadMsg).length;
  const newInqCount  = students.filter(hasNewInq).length;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <PeopleIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>Students</Typography>
        <Chip label={students.length} size="small" color="primary" />
        {unreadCount  > 0 && <Chip label={`${unreadCount} with new messages`}  size="small" color="error" />}
        {newInqCount  > 0 && <Chip label={`${newInqCount} with new inquiries`} size="small" sx={{ bgcolor: 'info.main', color: 'white' }} />}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress size={48} /></Box>
      ) : students.length === 0 ? (
        <Alert severity="info">No students enrolled in your courses yet.</Alert>
      ) : (
        <Grid container spacing={2}>
          {students.map((s) => {
            const hasMsg = hasUnreadMsg(s);
            const hasInq = hasNewInq(s);
            return (
              <Grid key={s.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Tooltip title="Click to view messages & inquiries">
                  <Card
                    elevation={1}
                    onClick={() => setSelected(s)}
                    sx={{
                      borderRadius: 3, cursor: 'pointer',
                      border: (hasMsg || hasInq) ? '1.5px solid' : '1.5px solid transparent',
                      borderColor: hasMsg ? 'error.main' : hasInq ? 'info.main' : 'transparent',
                      transition: 'all 0.2s',
                      '&:hover': { elevation: 3, transform: 'translateY(-2px)' },
                    }}
                  >
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, py: 2.5 }}>
                      <Box sx={{ position: 'relative' }}>
                        <Avatar
                          src={s.profilePhoto}
                          sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: 20 }}
                        >
                          {!s.profilePhoto && s.firstName[0].toUpperCase()}
                        </Avatar>
                        {/* Red dot for unread messages */}
                        {hasMsg && <RedDot abs />}
                      </Box>

                      <Box sx={{ textAlign: 'center' }}>
                        <Typography fontWeight={700} variant="body2">
                          {s.lastName}, {s.firstName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{s.email}</Typography>
                      </Box>

                      {/* Indicator dots row */}
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                        {hasMsg && (
                          <Tooltip title="Unread messages">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <RedDot />
                              <Typography variant="caption" color="error">msg</Typography>
                            </Box>
                          </Tooltip>
                        )}
                        {hasInq && (
                          <Tooltip title="New inquiry">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <BlueDot />
                              <Typography variant="caption" color="info.main">inquiry</Typography>
                            </Box>
                          </Tooltip>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Tooltip>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ── Student detail panel ───────────────────────────────────────────── */}
      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, maxHeight: '80vh' } }}
      >
        {selected && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
              <Avatar src={selected.profilePhoto} sx={{ width: 44, height: 44, bgcolor: 'primary.main' }}>
                {!selected.profilePhoto && selected.firstName[0]}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={700}>{selected.firstName} {selected.lastName}</Typography>
                <Typography variant="caption" color="text.secondary">{selected.email}</Typography>
              </Box>
              <IconButton size="small" onClick={() => setSelected(null)}><CloseIcon /></IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 0 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 360 }}>

                {/* Messages panel */}
                <Box sx={{ flex: 1, borderRight: { md: '1px solid rgba(0,0,0,0.1)' }, overflow: 'auto' }}>
                  <Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.50', display: 'flex', gap: 1, alignItems: 'center', position: 'sticky', top: 0, zIndex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700}>Messages</Typography>
                    {selMsgs.some((m) => m.id != null && unreadMessageIds.has(m.id)) && <RedDot />}
                    <Chip label={selMsgs.length} size="small" sx={{ ml: 'auto' }} />
                  </Box>

                  {selMsgs.length === 0 ? (
                    <Typography sx={{ p: 2, color: 'text.secondary' }} variant="body2">No messages from this student.</Typography>
                  ) : (
                    <List disablePadding>
                      {selMsgs.map((m, i) => {
                        const isUnread = m.id != null && unreadMessageIds.has(m.id);
                        return (
                          <React.Fragment key={m.id}>
                            <Tooltip title={isUnread ? 'Click to mark as read' : ''} placement="left">
                              <ListItem
                                alignItems="flex-start"
                                onClick={() => handleMsgClick(m)}
                                sx={{
                                  cursor: isUnread ? 'pointer' : 'default',
                                  bgcolor: isUnread ? 'rgba(211,47,47,0.04)' : 'transparent',
                                  '&:hover': isUnread ? { bgcolor: 'rgba(211,47,47,0.08)' } : {},
                                }}
                                secondaryAction={
                                  <Tooltip title="Reply">
                                    <IconButton size="small" onClick={(e) => openReply(e, m)}><ReplyIcon fontSize="small" /></IconButton>
                                  </Tooltip>
                                }
                              >
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', pr: 4 }}>
                                      <Typography variant="body2" fontWeight={isUnread ? 800 : 600}>{m.subject}</Typography>
                                      {isUnread && <RedDot />}
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
                              </ListItem>
                            </Tooltip>
                            {i < selMsgs.length - 1 && <Divider />}
                          </React.Fragment>
                        );
                      })}
                    </List>
                  )}
                </Box>

                {/* Inquiries panel */}
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  <Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.50', display: 'flex', gap: 1, alignItems: 'center', position: 'sticky', top: 0, zIndex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700}>Grade Inquiries</Typography>
                    {selInqs.some((i) => i.id != null && newInquiryIds.has(i.id)) && <BlueDot />}
                    <Chip label={selInqs.length} size="small" sx={{ ml: 'auto' }} />
                  </Box>

                  {selInqs.length === 0 ? (
                    <Typography sx={{ p: 2, color: 'text.secondary' }} variant="body2">No grade inquiries from this student.</Typography>
                  ) : (
                    <List disablePadding>
                      {selInqs.map((inq, i) => {
                        const isNew = inq.id != null && newInquiryIds.has(inq.id);
                        return (
                          <React.Fragment key={inq.id}>
                            <Tooltip title={isNew ? 'Click to dismiss notification' : ''} placement="left">
                              <ListItem
                                alignItems="flex-start"
                                onClick={() => handleInqClick(inq)}
                                sx={{
                                  cursor: isNew ? 'pointer' : 'default',
                                  bgcolor: isNew ? 'rgba(2,136,209,0.04)' : 'transparent',
                                  '&:hover': isNew ? { bgcolor: 'rgba(2,136,209,0.08)' } : {},
                                }}
                                secondaryAction={
                                  inq.status === 'PENDING' && (
                                    <Tooltip title="Respond">
                                      <IconButton size="small" onClick={(e) => openRespond(e, inq)}>
                                        <ReplyIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )
                                }
                              >
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap', pr: 4 }}>
                                      <Chip
                                        label={`${inq.grade?.enrollment?.course?.name ?? 'Course'} — ${inq.grade?.score}%`}
                                        size="small" variant="outlined"
                                      />
                                      <Chip label={inq.status} size="small" color={inq.status === 'REVIEWED' ? 'success' : 'warning'} />
                                      {isNew && <BlueDot />}
                                    </Box>
                                  }
                                  secondary={
                                    <>
                                      <Typography variant="body2" sx={{ mt: 0.5 }}>{inq.message}</Typography>
                                      {inq.teacherResponse && (
                                        <Typography variant="body2" sx={{ color: 'success.main', mt: 0.5 }}>
                                          <strong>Your reply:</strong> {inq.teacherResponse}
                                        </Typography>
                                      )}
                                      <Typography variant="caption" color="text.secondary">
                                        {inq.submittedAt ? new Date(inq.submittedAt).toLocaleString() : ''}
                                      </Typography>
                                    </>
                                  }
                                />
                              </ListItem>
                            </Tooltip>
                            {i < selInqs.length - 1 && <Divider />}
                          </React.Fragment>
                        );
                      })}
                    </List>
                  )}
                </Box>
              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 2, py: 1 }}>
              <Button onClick={() => setSelected(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Reply dialog ── */}
      <Dialog open={!!replying} onClose={() => setReplying(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Reply to {replying?.fromUsername}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {replyOk && <Alert severity="success">Reply sent!</Alert>}
            <Paper sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Their message:</strong> {replying?.content}
              </Typography>
            </Paper>
            <TextField label="Your reply" multiline rows={4} fullWidth value={replyText}
              onChange={(e) => setReplyText(e.target.value)} disabled={replyOk} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setReplying(null)}>Cancel</Button>
          <Button variant="contained" disabled={replySending || replyOk || !replyText.trim()}
            endIcon={replySending ? <CircularProgress size={14} color="inherit" /> : <SendIcon />}
            onClick={handleReply}>
            Send Reply
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Respond to inquiry dialog ── */}
      <Dialog open={!!responding} onClose={() => setResponding(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Respond to Inquiry</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Student: <em>{responding?.message}</em>
          </Typography>
          <TextField label="Your response" multiline rows={4} fullWidth value={respondText}
            onChange={(e) => setRespondText(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setResponding(null)}>Cancel</Button>
          <Button variant="contained" disabled={respondSaving || !respondText.trim()} onClick={handleRespond}>
            {respondSaving ? <CircularProgress size={20} /> : 'Send Response'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherMessages;
