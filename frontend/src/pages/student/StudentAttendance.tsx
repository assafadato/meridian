import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, Paper, Chip, CircularProgress, Alert,
} from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import axiosInstance from '../../api/axiosInstance';
import type { Attendance } from '../../types';

const STATUS_CONFIG = {
  PRESENT: { color: 'success' as const, label: 'Present' },
  ABSENT:  { color: 'error' as const,   label: 'Absent'  },
  LATE:    { color: 'warning' as const, label: 'Late'    },
};

const StudentAttendance: React.FC = () => {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosInstance.get<Attendance[]>('/attendance/me')
      .then((r) => setRecords(r.data))
      .catch(() => setError('Failed to load attendance'))
      .finally(() => setLoading(false));
  }, []);

  const present = records.filter((r) => r.status === 'PRESENT').length;
  const rate = records.length ? Math.round((present / records.length) * 100) : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <EventNoteIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>My Attendance</Typography>
        <Chip label={`${rate}% rate`} size="small" color={rate >= 80 ? 'success' : rate >= 60 ? 'warning' : 'error'} />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Chip label={`Present: ${records.filter(r => r.status === 'PRESENT').length}`} color="success" variant="outlined" />
        <Chip label={`Absent: ${records.filter(r => r.status === 'ABSENT').length}`}  color="error"   variant="outlined" />
        <Chip label={`Late: ${records.filter(r => r.status === 'LATE').length}`}      color="warning"  variant="outlined" />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell><strong>Course</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
            ) : records.length === 0 ? (
              <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>No attendance records</TableCell></TableRow>
            ) : records.map((r) => {
              const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.ABSENT;
              return (
                <TableRow key={r.id} hover>
                  <TableCell>{(r as any).enrollment?.course?.name ?? '—'}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell><Chip label={cfg.label} size="small" color={cfg.color} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default StudentAttendance;
