import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, Paper, Chip, CircularProgress, Alert, FormControl,
  InputLabel, Select, MenuItem, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField,
} from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AddIcon from '@mui/icons-material/Add';
import axiosInstance from '../../api/axiosInstance';
import type { Course, Attendance, Enrollment } from '../../types';

const STATUS_CONFIG = {
  PRESENT: { color: 'success' as const, label: 'Present' },
  ABSENT:  { color: 'error'   as const, label: 'Absent'  },
  LATE:    { color: 'warning' as const, label: 'Late'    },
};

const TeacherAttendance: React.FC = () => {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add form
  const [addOpen, setAddOpen] = useState(false);
  const [formCourseId, setFormCourseId] = useState<number | ''>('');
  const [formEnrollmentId, setFormEnrollmentId] = useState<number | ''>('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<'PRESENT' | 'ABSENT' | 'LATE'>('PRESENT');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, c, e] = await Promise.all([
        axiosInstance.get<Attendance[]>('/attendance/teacher'),
        axiosInstance.get<Course[]>('/courses/mine'),
        axiosInstance.get<Enrollment[]>('/enrollments/teacher'),
      ]);
      setRecords(a.data);
      setCourses(c.data);
      setEnrollments(e.data);
    } catch {
      setError('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = selectedCourse === 'all'
    ? records
    : records.filter((r) => (r as any).enrollment?.course?.id === selectedCourse);

  const presentCount = filtered.filter((r) => r.status === 'PRESENT').length;
  const rate = filtered.length ? Math.round((presentCount / filtered.length) * 100) : 0;

  const enrollmentsForCourse = formCourseId
    ? enrollments.filter((e) => e.course?.id === formCourseId)
    : [];

  const openAdd = () => {
    setFormCourseId('');
    setFormEnrollmentId('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormStatus('PRESENT');
    setSaveError('');
    setAddOpen(true);
  };

  const handleAdd = async () => {
    if (!formEnrollmentId || !formDate) {
      setSaveError('Please fill in all fields.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      await axiosInstance.post('/attendance/teacher', {
        enrollment: { id: formEnrollmentId },
        date: formDate,
        status: formStatus,
      });
      setAddOpen(false);
      await load();
    } catch (e: any) {
      setSaveError(e?.response?.data?.toString() ?? 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventNoteIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Attendance</Typography>
          <Chip label={`${rate}% present`} size="small" color={rate >= 80 ? 'success' : 'warning'} />
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} sx={{ borderRadius: 2 }}>
          Add Record
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Course</InputLabel>
          <Select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value as number | 'all')}
            label="Filter by Course"
          >
            <MenuItem value="all">All Courses</MenuItem>
            {courses.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <Chip label={`Present: ${filtered.filter(r => r.status === 'PRESENT').length}`} color="success" variant="outlined" />
        <Chip label={`Absent: ${filtered.filter(r => r.status === 'ABSENT').length}`}   color="error"   variant="outlined" />
        <Chip label={`Late: ${filtered.filter(r => r.status === 'LATE').length}`}        color="warning" variant="outlined" />
      </Box>

      <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell><strong>Student</strong></TableCell>
              <TableCell><strong>Course</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>No records found</TableCell></TableRow>
            ) : filtered.map((r) => {
              const cfg = STATUS_CONFIG[(r.status as keyof typeof STATUS_CONFIG)] ?? STATUS_CONFIG.ABSENT;
              const enrollment = (r as any).enrollment;
              return (
                <TableRow key={r.id} hover>
                  <TableCell>
                    {enrollment?.student
                      ? `${enrollment.student.firstName} ${enrollment.student.lastName}`
                      : '—'}
                  </TableCell>
                  <TableCell>{enrollment?.course?.name ?? '—'}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell><Chip label={cfg.label} size="small" color={cfg.color} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Attendance Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Attendance Record</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {saveError && <Alert severity="error">{saveError}</Alert>}

            <FormControl fullWidth>
              <InputLabel>Course</InputLabel>
              <Select
                value={formCourseId}
                onChange={(e) => { setFormCourseId(e.target.value as number); setFormEnrollmentId(''); }}
                label="Course"
              >
                {courses.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={!formCourseId}>
              <InputLabel>Student</InputLabel>
              <Select
                value={formEnrollmentId}
                onChange={(e) => setFormEnrollmentId(e.target.value as number)}
                label="Student"
              >
                {enrollmentsForCourse.map((e) => (
                  <MenuItem key={e.id} value={e.id}>
                    {e.student?.firstName} {e.student?.lastName}
                  </MenuItem>
                ))}
                {formCourseId && enrollmentsForCourse.length === 0 && (
                  <MenuItem disabled>No students enrolled</MenuItem>
                )}
              </Select>
            </FormControl>

            <TextField
              label="Date"
              type="date"
              fullWidth
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as 'PRESENT' | 'ABSENT' | 'LATE')}
                label="Status"
              >
                <MenuItem value="PRESENT">Present</MenuItem>
                <MenuItem value="ABSENT">Absent</MenuItem>
                <MenuItem value="LATE">Late</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={saving || !formEnrollmentId || !formDate}
          >
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherAttendance;
