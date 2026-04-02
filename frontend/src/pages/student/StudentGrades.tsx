import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, Paper, Chip, CircularProgress, Alert, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tooltip,
} from '@mui/material';
import GradeIcon from '@mui/icons-material/Grade';
import axiosInstance from '../../api/axiosInstance';
import { submitInquiry, getMyInquiries } from '../../api/inquiries';
import { useNotifications } from '../../context/NotificationContext';
import type { GradeDetail, GradeInquiry } from '../../types';

const scoreToLetter = (score: number) => {
  if (score >= 90) return { label: 'A', color: 'success' as const };
  if (score >= 80) return { label: 'B', color: 'primary' as const };
  if (score >= 70) return { label: 'C', color: 'warning' as const };
  if (score >= 60) return { label: 'D', color: 'error' as const };
  return { label: 'F', color: 'error' as const };
};

const RedDot = () => (
  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'error.main', flexShrink: 0, display: 'inline-block', ml: 0.5 }} />
);

const StudentGrades: React.FC = () => {
  const { newGradeIds, markGradeSeen } = useNotifications();
  const [grades, setGrades] = useState<GradeDetail[]>([]);
  const [inquiries, setInquiries] = useState<GradeInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inquiryGrade, setInquiryGrade] = useState<GradeDetail | null>(null);
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g, inq] = await Promise.all([
        axiosInstance.get<GradeDetail[]>('/grades/me'),
        getMyInquiries(),
      ]);
      setGrades(g.data);
      setInquiries(inq.data);
    } catch {
      setError('Failed to load grades');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRowClick = (grade: GradeDetail) => {
    if (grade.id != null && newGradeIds.has(grade.id)) {
      markGradeSeen(grade.id);
    }
  };

  const handleOpenInquiry = (e: React.MouseEvent, grade: GradeDetail) => {
    e.stopPropagation();
    setInquiryGrade(grade);
    setInquiryMsg('');
  };

  const handleSubmitInquiry = async () => {
    if (!inquiryGrade?.id || !inquiryMsg.trim()) return;
    setSubmitting(true);
    try {
      await submitInquiry(inquiryGrade.id, inquiryMsg);
      // Dismiss the grade notification when student inquires about it
      if (newGradeIds.has(inquiryGrade.id)) markGradeSeen(inquiryGrade.id);
      setInquiryGrade(null);
      setInquiryMsg('');
      await load();
    } catch {
      setError('Failed to submit inquiry');
    } finally {
      setSubmitting(false);
    }
  };

  const newCount = grades.filter((g) => g.id != null && newGradeIds.has(g.id as number)).length;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <GradeIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>Grades</Typography>
        <Chip label={grades.length} size="small" color="primary" />
        {newCount > 0 && <Chip label={`${newCount} new`} size="small" color="error" />}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell><strong>Course</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Score</strong></TableCell>
              <TableCell><strong>Grade</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Inquiry</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
            ) : grades.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No grades yet</TableCell></TableRow>
            ) : grades.map((grade) => {
              const letter   = scoreToLetter(grade.score);
              const isNew    = grade.id != null && newGradeIds.has(grade.id as number);
              const existing = inquiries.find((i) => i.grade?.id === grade.id);
              return (
                <Tooltip key={grade.id} title={isNew ? 'Click to dismiss new grade notification' : ''} placement="left">
                  <TableRow
                    hover
                    onClick={() => handleRowClick(grade)}
                    sx={{
                      cursor: isNew ? 'pointer' : 'default',
                      bgcolor: isNew ? 'rgba(211,47,47,0.04)' : 'transparent',
                      '&:hover': isNew ? { bgcolor: 'rgba(211,47,47,0.08)' } : {},
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {grade.enrollment?.course?.name ?? '—'}
                        {isNew && <RedDot />}
                      </Box>
                    </TableCell>
                    <TableCell><Chip label={grade.gradeType} size="small" variant="outlined" /></TableCell>
                    <TableCell><strong>{grade.score}</strong></TableCell>
                    <TableCell><Chip label={letter.label} size="small" color={letter.color} /></TableCell>
                    <TableCell>{grade.gradedAt ? grade.gradedAt.split('T')[0] : '—'}</TableCell>
                    <TableCell>
                      {existing ? (
                        <Chip
                          label={existing.status} size="small"
                          color={existing.status === 'REVIEWED' ? 'success' : 'warning'}
                          title={existing.teacherResponse ?? ''}
                        />
                      ) : (
                        <Button size="small" variant="outlined" onClick={(e) => handleOpenInquiry(e, grade)}>
                          Inquire
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                </Tooltip>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!inquiryGrade} onClose={() => setInquiryGrade(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Grade Inquiry</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Course: <strong>{inquiryGrade?.enrollment?.course?.name}</strong> | Score: <strong>{inquiryGrade?.score}</strong>
          </Typography>
          <TextField
            label="Your message to the teacher"
            multiline rows={4} fullWidth
            value={inquiryMsg}
            onChange={(e) => setInquiryMsg(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setInquiryGrade(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitInquiry} disabled={submitting || !inquiryMsg.trim()}>
            {submitting ? <CircularProgress size={20} /> : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentGrades;
