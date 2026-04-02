import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Paper, IconButton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, CircularProgress, TextField,
  Tooltip, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getAllUsers, createUser, deleteUser, type UserRecord } from '../api/users';

const schema = z.object({
  username: z.string().min(2, 'Username is required'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT']),
});

type FormData = z.infer<typeof schema>;

const ROLE_COLOR: Record<string, 'primary' | 'success' | 'warning'> = {
  ADMIN: 'warning',
  TEACHER: 'primary',
  STUDENT: 'success',
};

const Teachers: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'TEACHER' },
  });

  const selectedRole = watch('role');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAllUsers();
      setUsers(res.data);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = () => {
    reset({ username: '', password: '', role: 'TEACHER' });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      await createUser(data);
      setModalOpen(false);
      fetchUsers();
    } catch {
      setError('Failed to create user (username may already exist)');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (user: UserRecord) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete?.id) return;
    try {
      await deleteUser(userToDelete.id);
      setDeleteDialogOpen(false);
      fetchUsers();
    } catch {
      setError('Failed to delete user');
    }
  };

  const teachers = users.filter((u) => u.role === 'TEACHER');
  const admins = users.filter((u) => u.role === 'ADMIN');
  const students = users.filter((u) => u.role === 'STUDENT');

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Users & Teachers</Typography>
          <Chip label={`${teachers.length} teachers`} size="small" color="primary" />
          <Chip label={`${admins.length} admins`} size="small" color="warning" />
          <Chip label={`${students.length} students`} size="small" color="success" />
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ borderRadius: 2 }}>
          Add User
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell><strong>ID</strong></TableCell>
              <TableCell><strong>Username</strong></TableCell>
              <TableCell><strong>Role</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No users found
                </TableCell>
              </TableRow>
            ) : users.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>{user.id}</TableCell>
                <TableCell><strong>{user.username}</strong></TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    size="small"
                    color={ROLE_COLOR[user.role] ?? 'default'}
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => confirmDelete(user)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add User</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Username"
              fullWidth
              {...register('username')}
              error={!!errors.username}
              helperText={errors.username?.message}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={selectedRole}
                label="Role"
                onChange={(e) => setValue('role', e.target.value as FormData['role'])}
              >
                <MenuItem value="TEACHER">Teacher</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="STUDENT">Student</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Delete user <strong>{userToDelete?.username}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Teachers;
