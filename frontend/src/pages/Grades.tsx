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
import type { GradeDetail, Enrollment } from '../types';
import { getGrades, createGrade, updateGrade, deleteGrade } from '../api/grades';
import { getEnrollments } from '../api/enrollments';

const schema = z.object({
  enrollmentId: z.coerce.number().min(1, 'Enrollment is required'),
  score: z.coerce.number().min(0, 'Min 0').max(100, 'Max 100'),
  gradeType: z.string().min(1, 'Grade type is required'),
  gradedAt: z.string().optional(),
});

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

const GRADE_TYPES = ['QUIZ', 'MIDTERM', 'FINAL', 'HOMEWORK', 'PROJECT', 'ASSIGNMENT'];

const scoreToLetter = (score: number) => {
  if (score >= 90) return { label: 'A', color: 'success' as const };
  if (score >= 80) return { label: 'B', color: 'primary' as const };
  if (score >= 70) return { label: 'C', color: 'warning' as const };
  if (score >= 60) return { label: 'D', color: 'error' as const };
  return { label: 'F', color: 'error' as const };
};

const Grades: React.FC = () => {
  const [grades, setGrades] = useState<GradeDetail[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradeDetail | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gradeToDelete, setGradeToDelete] = useState<GradeDetail | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [gradesRes, enrollmentsRes] = await Promise.allSettled([
        getGrades(),
        getEnrollments(),
      ]);
      if (gradesRes.status === 'fulfilled') setGrades(gradesRes.value.data);
      if (enrollmentsRes.status === 'fulfilled') setEnrollments(enrollmentsRes.value.data);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = grades.filter((g) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      g.enrollment?.student?.firstName?.toLowerCase().includes(term) ||
      g.enrollment?.student?.lastName?.toLowerCase().includes(term) ||
      g.enrollment?.course?.name?.toLowerCase().includes(term) ||
      g.gradeType?.toLowerCase().includes(term)
    );
  });

  const openCreate = () => {
    setEditingGrade(null);
    reset({ enrollmentId: 0, score: 0, gradeType: '', gradedAt: new Date().toISOString().split('T')[0] });
    setModalOpen(true);
  };

  const openEdit = (grade: GradeDetail) => {
    setEditingGrade(grade);
    reset({
      enrollmentId: grade.enrollment?.id ?? 0,
      score: grade.score,
      gradeType: grade.gradeType,
      gradedAt: grade.gradedAt ? grade.gradedAt.split('T')[0] : '',
    });
    setModalOpen(true);
  };

  /** Convert a plain date string "YYYY-MM-DD" → "YYYY-MM-DDT00:00:00" for LocalDateTime on backend. */
  const toDateTime = (date?: string) => (date ? `${date}T00:00:00` : undefined);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      if (editingGrade?.id) {
        await updateGrade(editingGrade.id, {
          score: data.score,
          gradeType: data.gradeType,
          gradedAt: toDateTime(data.gradedAt),   // backend needs LocalDateTime format
        });
      } else {
        await createGrade({
          enrollment: { id: data.enrollmentId },
          score: data.score,
          gradeType: data.gradeType,
          // omit gradedAt — @PrePersist on Grade sets it to LocalDateTime.now()
        });
      }
      setModalOpen(false);
      fetchAll();
    } catch {
      setError('Failed to save grade');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (grade: GradeDetail) => {
    setGradeToDelete(grade);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!gradeToDelete?.id) return;
    try {
      await deleteGrade(gradeToDelete.id);
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
              const letter = scoreToLetter(grade.score);
              return (
                <TableRow key={grade.id} hover>
                  <TableCell>
                    {grade.enrollment?.student
                      ? `${grade.enrollment.student.firstName} ${grade.enrollment.student.lastName}`
                      : '—'}
                  </TableCell>
                  <TableCell>{grade.enrollment?.course?.name ?? '—'}</TableCell>
                  <TableCell>
                    <Chip label={grade.gradeType} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell><strong>{grade.score}</strong></TableCell>
                  <TableCell>
                    <Chip label={letter.label} size="small" color={letter.color} />
                  </TableCell>
                  <TableCell>{grade.gradedAt ? grade.gradedAt.split('T')[0] : '—'}</TableCell>
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
            {!editingGrade && (
              <FormControl fullWidth error={!!errors.enrollmentId}>
                <InputLabel>Enrollment (Student → Course)</InputLabel>
                <Controller
                  name="enrollmentId"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Enrollment (Student → Course)">
                      {enrollments.map((e) => (
                        <MenuItem key={e.id} value={e.id}>
                          {e.student?.firstName} {e.student?.lastName} → {e.course?.name}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.enrollmentId && <FormHelperText>{errors.enrollmentId.message}</FormHelperText>}
              </FormControl>
            )}

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
                inputProps={{ min: 0, max: 100, step: 0.1 }}
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
