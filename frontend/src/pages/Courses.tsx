import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Paper, IconButton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, CircularProgress, InputAdornment,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Course } from '../types';
import { getCourses, createCourse, updateCourse, deleteCourse, searchCourses } from '../api/courses';

const schema = z.object({
  name: z.string().min(1, 'Course name is required').max(100),
  description: z.string().min(1, 'Description is required').max(500),
  gradeLevel: z.coerce.number().int().min(1).max(12).optional(),
  credits: z.coerce.number().int().min(1).max(10).optional(),
});

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
  });

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getCourses();
      setCourses(res.data);
    } catch {
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const handleSearch = async (value: string) => {
    setSearch(value);
    if (!value.trim()) { fetchCourses(); return; }
    setSearching(true);
    try {
      const res = await searchCourses(value.trim());
      setCourses(res.data);
    } catch {
      setError('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const openCreate = () => {
    setEditingCourse(null);
    reset({ name: '', description: '', gradeLevel: undefined, credits: undefined });
    setModalOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditingCourse(course);
    reset({
      name: course.name,
      description: course.description,
      gradeLevel: course.gradeLevel,
      credits: course.credits,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      if (editingCourse?.id) {
        await updateCourse(editingCourse.id, data as Course);
      } else {
        await createCourse(data as Course);
      }
      setModalOpen(false);
      fetchCourses();
    } catch {
      setError('Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (course: Course) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!courseToDelete?.id) return;
    try {
      await deleteCourse(courseToDelete.id);
      setDeleteDialogOpen(false);
      fetchCourses();
    } catch {
      setError('Failed to delete course');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MenuBookIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Courses</Typography>
          <Chip label={courses.length} size="small" color="primary" />
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ borderRadius: 2 }}>
          Add Course
        </Button>
      </Box>

      <TextField
        fullWidth
        placeholder="Search by course name..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {searching ? <CircularProgress size={18} /> : <SearchIcon />}
            </InputAdornment>
          ),
        }}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell><strong>ID</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell><strong>Grade Level</strong></TableCell>
              <TableCell><strong>Credits</strong></TableCell>
              <TableCell><strong>Students</strong></TableCell>
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
            ) : courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No courses found
                </TableCell>
              </TableRow>
            ) : courses.map((course) => (
              <TableRow key={course.id} hover>
                <TableCell>{course.id}</TableCell>
                <TableCell><strong>{course.name}</strong></TableCell>
                <TableCell sx={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {course.description}
                </TableCell>
                <TableCell>
                  {course.gradeLevel != null && (
                    <Chip label={`Grade ${course.gradeLevel}`} size="small" color="secondary" />
                  )}
                </TableCell>
                <TableCell>
                  {course.credits != null && (
                    <Chip label={`${course.credits} cr`} size="small" variant="outlined" />
                  )}
                </TableCell>
                <TableCell>
                  <Chip label={course.students?.length ?? 0} size="small" />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton size="small" color="primary" onClick={() => openEdit(course)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => confirmDelete(course)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCourse ? 'Edit Course' : 'Add Course'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Course Name"
              fullWidth
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              {...register('description')}
              error={!!errors.description}
              helperText={errors.description?.message}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Grade Level"
                type="number"
                fullWidth
                {...register('gradeLevel')}
                error={!!errors.gradeLevel}
                helperText={errors.gradeLevel?.message}
                inputProps={{ min: 1, max: 12 }}
              />
              <TextField
                label="Credits"
                type="number"
                fullWidth
                {...register('credits')}
                error={!!errors.credits}
                helperText={errors.credits?.message}
                inputProps={{ min: 1, max: 10 }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit(onSubmit)}
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : editingCourse ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{courseToDelete?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Courses;
