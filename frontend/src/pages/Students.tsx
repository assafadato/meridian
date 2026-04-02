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
import PersonIcon from '@mui/icons-material/Person';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Student } from '../types';
import { getStudents, createStudent, updateStudent, deleteStudent, searchStudents } from '../api/students';

const schema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  firstName: z.string().min(1, 'First name is required').max(15, 'Max 15 characters'),
  lastName: z.string().min(1, 'Last name is required').max(15, 'Max 15 characters'),
  address: z.string().min(1, 'Address is required'),
  year: z.coerce.number().int().min(1).max(6),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
});

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

const YEAR_COLORS: Record<number, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'> = {
  1: 'primary', 2: 'secondary', 3: 'success', 4: 'warning', 5: 'error', 6: 'default',
};

const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
  });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getStudents();
      setStudents(res.data);
    } catch {
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleSearch = async (value: string) => {
    setSearch(value);
    if (!value.trim()) { fetchStudents(); return; }
    setSearching(true);
    try {
      const res = await searchStudents(value.trim());
      setStudents(res.data);
    } catch {
      setError('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const openCreate = () => {
    setEditingStudent(null);
    reset({ identifier: '', firstName: '', lastName: '', address: '', year: 1, dateOfBirth: '' });
    setModalOpen(true);
  };

  const openEdit = (student: Student) => {
    setEditingStudent(student);
    reset({
      identifier: student.identifier,
      firstName: student.firstName,
      lastName: student.lastName,
      address: student.address,
      year: student.year,
      dateOfBirth: student.dateOfBirth,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      if (editingStudent?.id) {
        await updateStudent(editingStudent.id, data as Student);
      } else {
        await createStudent(data as Student);
      }
      setModalOpen(false);
      fetchStudents();
    } catch {
      setError('Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (student: Student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!studentToDelete?.id) return;
    try {
      await deleteStudent(studentToDelete.id);
      setDeleteDialogOpen(false);
      fetchStudents();
    } catch {
      setError('Failed to delete student');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Students</Typography>
          <Chip label={students.length} size="small" color="primary" />
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ borderRadius: 2 }}>
          Add Student
        </Button>
      </Box>

      <TextField
        fullWidth
        placeholder="Search by name..."
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
              <TableCell><strong>Identifier</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Date of Birth</strong></TableCell>
              <TableCell><strong>Year</strong></TableCell>
              <TableCell><strong>Address</strong></TableCell>
              <TableCell><strong>Courses</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No students found
                </TableCell>
              </TableRow>
            ) : students.map((student) => (
              <TableRow key={student.id} hover>
                <TableCell>{student.id}</TableCell>
                <TableCell>
                  <Chip label={student.identifier} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <strong>{student.firstName} {student.lastName}</strong>
                </TableCell>
                <TableCell>{student.dateOfBirth}</TableCell>
                <TableCell>
                  <Chip
                    label={`Year ${student.year}`}
                    size="small"
                    color={YEAR_COLORS[student.year] ?? 'default'}
                  />
                </TableCell>
                <TableCell sx={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {student.address}
                </TableCell>
                <TableCell>
                  <Chip label={student.courses?.length ?? 0} size="small" />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton size="small" color="primary" onClick={() => openEdit(student)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => confirmDelete(student)}>
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
        <DialogTitle>{editingStudent ? 'Edit Student' : 'Add Student'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Identifier"
              fullWidth
              {...register('identifier')}
              error={!!errors.identifier}
              helperText={errors.identifier?.message}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="First Name"
                fullWidth
                {...register('firstName')}
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
              />
              <TextField
                label="Last Name"
                fullWidth
                {...register('lastName')}
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
              />
            </Box>
            <TextField
              label="Address"
              fullWidth
              {...register('address')}
              error={!!errors.address}
              helperText={errors.address?.message}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Study Year"
                type="number"
                fullWidth
                {...register('year')}
                error={!!errors.year}
                helperText={errors.year?.message}
                inputProps={{ min: 1, max: 6 }}
              />
              <TextField
                label="Date of Birth"
                type="date"
                fullWidth
                {...register('dateOfBirth')}
                error={!!errors.dateOfBirth}
                helperText={errors.dateOfBirth?.message}
                InputLabelProps={{ shrink: true }}
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
            {saving ? <CircularProgress size={20} /> : editingStudent ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>{studentToDelete?.firstName} {studentToDelete?.lastName}</strong>?
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

export default Students;
