import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, Paper, Chip, CircularProgress, Alert, FormControl,
  InputLabel, Select, MenuItem, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField,
} from '@mui/material';
import GradeIcon from '@mui/icons-material/Grade';
import AddIcon from '@mui/icons-material/Add';
import axiosInstance from '../../api/axiosInstance';
import type { Course, GradeDetail, Enrollment } from '../../types';

const GRADE_TYPES = ['EXAM', 'QUIZ', 'ASSIGNMENT', 'PROJECT', 'MIDTERM', 'FINAL'];

const TeacherGrades: React.FC = () => {
  const [grades, setGrades] = useState<GradeDetail[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add grade form
  const [addOpen, setAddOpen] = useState(false);
  const [formEnrollmentId, setFormEnrollmentId] = useState<number | ''>('');
  const [formCourseId, setFormCourseId] = useState<number | ''>('');
  const [formScore, setFormScore] = useState('');
  const [formType, setFormType] = useState('EXAM');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g, c, e] = await Promise.all([
        axiosInstance.get<GradeDetail[]>('/grades/teacher'),
        axiosInstance.get<Course[]>('/courses/mine'),
        axiosInstance.get<Enrollment[]>('/enrollments/teacher'),
      ]);
      setGrades(g.data);
      setCourses(c.data);
      setEnrollments(e.data);
    } catch {
      setError('Failed to load grades');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = selectedCourse === 'all'
    ? grades
    : grades.filter((g) => g.enrollment?.course?.id === selectedCourse);

  // Enrollments filtered by selected course (for the add form)
  const enrollmentsForCourse = formCourseId
    ? enrollments.filter((e) => e.course?.id === formCourseId)
    : [];

  const openAdd = () => {
    setFormCourseId('');
    setFormEnrollmentId('');
    setFormScore('');
    setFormType('EXAM');
    setSaveError('');
    setAddOpen(true);
  };

  const handleAdd = async () => {
    const score = parseFloat(formScore);
    if (!formEnrollmentId || isNaN(score) || score < 0 || score > 100) {
      setSaveError('Please fill in all fields. Score must be 0–100.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      await axiosInstance.post('/grades/teacher', {
        enrollment: { id: formEnrollmentId },
        score,
        gradeType: formType,
      });
      setAddOpen(false);
      await load();
    } catch (e: any) {
      const msg = e?.response?.data || 'Failed to save grade';
      setSaveError(typeof msg === 'string' ? msg : 'Failed to save grade');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GradeIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Grades</Typography>
          <Chip label={filtered.length} size="small" color="primary" />
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} sx={{ borderRadius: 2 }}>
          Add Grade
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ mb: 3, maxWidth: 300 }}>
        <FormControl fullWidth size="small">
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
      </Box>

      <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell><strong>Student</strong></TableCell>
              <TableCell><strong>Course</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Score</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No grades yet</TableCell></TableRow>
            ) : filtered.map((g) => (
              <TableRow key={g.id} hover>
                <TableCell>
                  <strong>{g.enrollment?.student?.firstName} {g.enrollment?.student?.lastName}</strong>
                </TableCell>
                <TableCell>{g.enrollment?.course?.name}</TableCell>
                <TableCell><Chip label={g.gradeType} size="small" variant="outlined" /></TableCell>
                <TableCell>
                  <Chip
                    label={`${g.score}%`}
                    size="small"
                    color={g.score >= 90 ? 'success' : g.score >= 70 ? 'primary' : 'warning'}
                  />
                </TableCell>
                <TableCell>{g.gradedAt ? g.gradedAt.split('T')[0] : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Grade Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Grade</DialogTitle>
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

            <FormControl fullWidth>
              <InputLabel>Grade Type</InputLabel>
              <Select value={formType} onChange={(e) => setFormType(e.target.value)} label="Grade Type">
                {GRADE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>

            <TextField
              label="Score (0–100)"
              type="number"
              fullWidth
              value={formScore}
              onChange={(e) => setFormScore(e.target.value)}
              inputProps={{ min: 0, max: 100 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={saving || !formEnrollmentId || !formScore}
          >
            {saving ? <CircularProgress size={20} /> : 'Save Grade'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherGrades;
