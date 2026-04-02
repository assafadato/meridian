import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, List, ListItem, ListItemText, Chip, CircularProgress,
  Alert, Divider, Paper, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Tooltip,
} from '@mui/material';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import { getTeacherInquiries, respondToInquiry } from '../../api/inquiries';
import { useNotifications } from '../../context/NotificationContext';
import type { GradeInquiry } from '../../types';

const RedDot = () => (
  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'error.main', flexShrink: 0, ml: 0.5 }} />
);

const TeacherInquiries: React.FC = () => {
  const { newInquiryIds, markInquirySeen } = useNotifications();
  const [inquiries, setInquiries] = useState<GradeInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [responding, setResponding] = useState<GradeInquiry | null>(null);
  const [response, setResponse] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTeacherInquiries();
      setInquiries(res.data);
    } catch {
      setError('Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRowClick = (inq: GradeInquiry) => {
    if (inq.id != null && newInquiryIds.has(inq.id)) {
      markInquirySeen(inq.id);
    }
  };

  const openRespond = (e: React.MouseEvent, inq: GradeInquiry) => {
    e.stopPropagation();
    setResponding(inq);
    setResponse('');
  };

  const handleRespond = async () => {
    if (!responding?.id || !response.trim()) return;
    setSaving(true);
    try {
      await respondToInquiry(responding.id, response);
      // Also mark as seen when responding
      if (newInquiryIds.has(responding.id)) markInquirySeen(responding.id);
      setResponding(null);
      setResponse('');
      await load();
    } catch {
      setError('Failed to save response');
    } finally {
      setSaving(false);
    }
  };

  const pending  = inquiries.filter((i) => i.status === 'PENDING').length;
  const newCount = inquiries.filter((i) => i.id != null && newInquiryIds.has(i.id)).length;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <QuestionAnswerIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>Grade Inquiries</Typography>
        {pending > 0  && <Chip label={`${pending} pending`}  size="small" color="warning" />}
        {newCount > 0 && <Chip label={`${newCount} new`}     size="small" color="error"   />}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper elevation={1} sx={{ borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : inquiries.length === 0 ? (
          <Typography sx={{ p: 3, color: 'text.secondary' }}>No grade inquiries.</Typography>
        ) : (
          <List disablePadding>
            {inquiries.map((inq, i) => {
              const isNew = inq.id != null && newInquiryIds.has(inq.id);
              return (
                <React.Fragment key={inq.id}>
                  <Tooltip title={isNew ? 'Click to dismiss notification' : ''} placement="left">
                    <ListItem
                      alignItems="flex-start"
                      onClick={() => handleRowClick(inq)}
                      sx={{
                        cursor: isNew ? 'pointer' : 'default',
                        bgcolor: isNew ? 'error.50' : 'transparent',
                        transition: 'background-color 0.2s',
                        '&:hover': isNew ? { bgcolor: 'error.100' } : {},
                      }}
                      secondaryAction={
                        inq.status === 'PENDING' && (
                          <Button size="small" variant="outlined"
                            onClick={(e) => openRespond(e, inq)}>
                            Respond
                          </Button>
                        )
                      }
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Typography fontWeight={isNew ? 800 : 600}>
                              {inq.student?.firstName} {inq.student?.lastName}
                            </Typography>
                            <Chip
                              label={`${inq.grade?.enrollment?.course?.name ?? 'Course'} — ${inq.grade?.score}%`}
                              size="small" variant="outlined"
                            />
                            <Chip
                              label={inq.status} size="small"
                              color={inq.status === 'REVIEWED' ? 'success' : 'warning'}
                            />
                            {isNew && <RedDot />}
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              <strong>Student:</strong> {inq.message}
                            </Typography>
                            {inq.teacherResponse && (
                              <Typography variant="body2" sx={{ mt: 0.5, color: 'success.main' }}>
                                <strong>Your response:</strong> {inq.teacherResponse}
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
                  {i < inquiries.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Paper>

      <Dialog open={!!responding} onClose={() => setResponding(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Respond to Inquiry</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Student's message: <em>{responding?.message}</em>
          </Typography>
          <TextField label="Your response" multiline rows={4} fullWidth
            value={response} onChange={(e) => setResponse(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setResponding(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleRespond} disabled={saving || !response.trim()}>
            {saving ? <CircularProgress size={20} /> : 'Send Response'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherInquiries;
