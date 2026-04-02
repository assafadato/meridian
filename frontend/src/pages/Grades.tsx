import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Paper, IconButton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, CircularProgress, InputAdornment,
  Tooltip, MenuItem, Select, FormControl, InputLabel, FormHelperText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import GradeIcon from '@mui/icons-material/Grade';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Grade, Student, Course } from '../types';
import axiosInstance from '../api/axiosInstance';
import { getStudents } from '../api/students';
import { getCourses } from '../api/courses';

const schema = z.object({
  studentId: z.coerce.number().min(1, 'Student is required'),
  courseId: z.coerce.number().min(1, 'Course is required'),
  score: z.coerce.number().min(0).max(100),
  gradeType: z.string().min(1, 'Grade type is required'),
  gradedAt: z.string().min(1, 'Date is required'),
});

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

const GRADE_TYPES = ['QUIZ', 'MIDTERM', 'FINAL', 'HOMEWORK', 'PROJECT'];

const scoreToLetter = (score: number) => {
  if (score >= 90) return { label: 'A', color: 'success' as const };
  if (score >= 80) return { label: 'B', color: 'primary' as const };
  if (score >= 70) return { label: 'C', color: 'warning' as const };
  if (score >= 60) return { label: 'D', color: 'error' as const };
  return { label: 'F', color: 'error' as const };
};

const Grades: React.FC = () => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gradeToDelete, setGradeToDelete] = useState<Grade | null>(null);
  const [saving, setSaving] = useState(false);
  const [apiUnavailable, setApiUnavailable] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [gradesRes, studentsRes, coursesRes] = await Promise.allSettled([
        axiosInstance.get<Grade[]>('/grades'),
        getStudents(),
        getCourses(),
      ]);
      if (gradesRes.status === 'fulfilled') {
        setGrades(gradesRes.value.data);
      } else {
        setApiUnavailable(true);
      }
      if (studentsRes.status === 'fulfilled') setStudents(studentsRes.value.data);
      if (coursesRes.status === 'fulfilled') setCourses(coursesRes.value.data);
    } catch {
      setError('Failed to load grades');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = grades.filter((g) => {
    const student = students.find((s) => s.id === g.studentId);
    const course = courses.find((c) => c.id === g.courseId);
    const term = search.toLowerCase();
    return (
      !term ||
      student?.firstName?.toLowerCase().includes(term) ||
      student?.lastName?.toLowerCase().includes(term) ||
      course?.name?.toLowerCase().includes(term) ||
      g.gradeType?.toLowerCase().includes(term)
    );
  });

  const openCreate = () => {
    setEditingGrade(null);
    reset({ studentId: 0, courseId: 0, score: 0, gradeType: '', gradedAt: new Date().toISOString().split('T')[0] });
    setModalOpen(true);
  };

  const openEdit = (grade: Grade) => {
    setEditingGrade(grade);
    reset({
      studentId: grade.studentId,
      courseId: grade.courseId,
      score: grade.score,
      gradeType: grade.gradeType,
      gradedAt: grade.gradedAt,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      if (editingGrade?.id) {
        await axiosInstance.put(`/grades/${editingGrade.id}`, data);
      } else {
        await axiosInstance.post('/grades', data);
      }
      setModalOpen(false);
      fetchAll();
    } catch {
      setError('Failed to save grade. The grades API may not be available yet.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (grade: Grade) => {
    setGradeToDelete(grade);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!gradeToDelete?.id) return;
    try {
      await axiosInstance.delete(`/grades/${gradeToDelete.id}`);
      setDeleteDialogOpen(false);
      fetchAll();
    } catch {
      setError('Failed to delete grade');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GradeIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Grades</Typography>
          <Chip label={grades.length} size="small" color="primary" />
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ borderRadius: 2 }}>
          Add Grade
        </Button>
      </Box>

      {apiUnavailable && (
        <Alert severity="info" sx={{ mb: 2 }}>
          The grades API endpoint is not yet available on the backend. Data shown here is for demonstration.
        </Alert>
      )}

      <TextField
        fullWidth
        placeholder="Search by student, course, or type..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
        }}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell><strong>Student</strong></TableCell>
              <TableCell><strong>Course</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Score</strong></TableCell>
              <TableCell><strong>Grade</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No grades found
                </TableCell>
              </TableRow>
            ) : filtered.map((grade) => {
              const student = students.find((s) => s.id === grade.studentId);
              const course = courses.find((c) => c.id === grade.courseId);
              const letter = scoreToLetter(grade.score);
              return (
                <TableRow key={grade.id} hover>
                  <TableCell>
                    {student ? `${student.firstName} ${student.lastName}` : `Student #${grade.studentId}`}
                  </TableCell>
                  <TableCell>{course?.name ?? `Course #${grade.courseId}`}</TableCell>
                  <TableCell>
                    <Chip label={grade.gradeType} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell><strong>{grade.score}</strong></TableCell>
                  <TableCell>
                    <Chip label={letter.label} size="small" color={letter.color} />
                  </TableCell>
                  <TableCell>{grade.gradedAt}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary" onClick={() => openEdit(grade)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => confirmDelete(grade)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingGrade ? 'Edit Grade' : 'Add Grade'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth error={!!errors.studentId}>
              <InputLabel>Student</InputLabel>
              <Controller
                name="studentId"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Student">
                    {students.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.firstName} {s.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.studentId && <FormHelperText>{errors.studentId.message}</FormHelperText>}
            </FormControl>

            <FormControl fullWidth error={!!errors.courseId}>
              <InputLabel>Course</InputLabel>
              <Controller
                name="courseId"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Course">
                    {courses.map((c) => (
                      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.courseId && <FormHelperText>{errors.courseId.message}</FormHelperText>}
            </FormControl>

            <FormControl fullWidth error={!!errors.gradeType}>
              <InputLabel>Grade Type</InputLabel>
              <Controller
                name="gradeType"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Grade Type">
                    {GRADE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                )}
              />
              {errors.gradeType && <FormHelperText>{errors.gradeType.message}</FormHelperText>}
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Score (0-100)"
                type="number"
                fullWidth
                {...register('score')}
                error={!!errors.score}
                helperText={errors.score?.message}
                inputProps={{ min: 0, max: 100 }}
              />
              <TextField
                label="Date"
                type="date"
                fullWidth
                {...register('gradedAt')}
                error={!!errors.gradedAt}
                helperText={errors.gradedAt?.message}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : editingGrade ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this grade record?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Grades;
