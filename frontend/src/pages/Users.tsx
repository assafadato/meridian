import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Paper, IconButton, Chip, Avatar, Dialog,
  DialogTitle, DialogContent, DialogActions, Alert, CircularProgress,
  Tooltip, FormControl, InputLabel, Select, MenuItem, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import axiosInstance from '../api/axiosInstance';
import { getAllUsers, createUser, updateUser, deleteUser, type UserRecord } from '../api/users';
import { getStudents, updateStudent } from '../api/students';
import type { Student } from '../types';

const ROLE_COLOR: Record<string, 'primary' | 'success' | 'warning'> = {
  ADMIN: 'warning', TEACHER: 'primary', STUDENT: 'success',
};

interface UserRow extends UserRecord {
  studentId?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  dateOfBirth?: string;
}

const Users: React.FC = () => {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createRole, setCreateRole] = useState<'TEACHER' | 'ADMIN' | 'STUDENT'>('TEACHER');
  const [createForm, setCreateForm] = useState({ username: '', password: '', firstName: '', lastName: '', email: '', dateOfBirth: '' });
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  // edit dialog
  const [editRow, setEditRow] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ username: '', password: '', firstName: '', lastName: '', email: '', dateOfBirth: '' });
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  // delete dialog
  const [deleteRow, setDeleteRow] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, studentsRes] = await Promise.all([
        getAllUsers(),
        getStudents(),
      ]);
      const students: Student[] = studentsRes.data;
      const studentByUsername = new Map(
        students
          .filter((s) => s.linkedUser?.username)
          .map((s) => [s.linkedUser!.username!, s])
      );

      const combined: UserRow[] = usersRes.data.map((u) => {
        const prof = studentByUsername.get(u.username);
        return {
          ...u,
          studentId:   prof?.id,
          firstName:   prof?.firstName,
          lastName:    prof?.lastName,
          email:       prof?.email,
          dateOfBirth: prof?.dateOfBirth,
        };
      });

      // Sort: ADMIN first, TEACHER next, STUDENT last; then by username
      const order = { ADMIN: 0, TEACHER: 1, STUDENT: 2 };
      combined.sort((a, b) => {
        const ro = (order[a.role as keyof typeof order] ?? 3) - (order[b.role as keyof typeof order] ?? 3);
        if (ro !== 0) return ro;
        return a.username.localeCompare(b.username);
      });

      setRows(combined);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Create ────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setCreateRole('TEACHER');
    setCreateForm({ username: '', password: '', firstName: '', lastName: '', email: '', dateOfBirth: '' });
    setCreateError('');
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    setCreateError('');
    if (!createForm.username || !createForm.password) { setCreateError('Username and password are required'); return; }
    if (createRole === 'STUDENT' && (!createForm.firstName || !createForm.lastName || !createForm.email)) {
      setCreateError('Name and email are required for students'); return;
    }
    setCreating(true);
    try {
      if (createRole === 'STUDENT') {
        await axiosInstance.post('/students', {
          firstName: createForm.firstName,
          lastName: createForm.lastName,
          email: createForm.email,
          dateOfBirth: createForm.dateOfBirth,
          username: createForm.username,
          password: createForm.password,
        });
      } else {
        await createUser({ username: createForm.username, password: createForm.password, role: createRole });
      }
      setCreateOpen(false);
      load();
    } catch {
      setCreateError('Failed to create user (username may already exist)');
    } finally {
      setCreating(false);
    }
  };

  // ── Edit ─────────────────────────────────────────────────────────────────
  const openEdit = (row: UserRow) => {
    setEditRow(row);
    setEditForm({
      username:    row.username,
      password:    '',
      firstName:   row.firstName  ?? '',
      lastName:    row.lastName   ?? '',
      email:       row.email      ?? '',
      dateOfBirth: row.dateOfBirth ?? '',
    });
    setEditError('');
  };

  const handleEdit = async () => {
    if (!editRow) return;
    setSaving(true);
    setEditError('');
    try {
      // Update user account (username / password)
      const userPayload: Record<string, string> = {};
      if (editForm.username && editForm.username !== editRow.username) userPayload.username = editForm.username;
      if (editForm.password) userPayload.password = editForm.password;
      if (Object.keys(userPayload).length) await updateUser(editRow.id, userPayload);

      // Update student profile if applicable
      if (editRow.role === 'STUDENT' && editRow.studentId) {
        await updateStudent(editRow.studentId, {
          firstName:   editForm.firstName,
          lastName:    editForm.lastName,
          email:       editForm.email,
          dateOfBirth: editForm.dateOfBirth,
        } as any);
      }
      setEditRow(null);
      load();
    } catch (e: any) {
      setEditError(e?.response?.status === 409 ? 'Username already taken' : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteRow) return;
    setDeleting(true);
    try {
      await deleteUser(deleteRow.id);
      setDeleteRow(null);
      load();
    } catch {
      setError('Failed to delete user (they may have linked records)');
      setDeleteRow(null);
    } finally {
      setDeleting(false);
    }
  };

  const counts = {
    ADMIN:   rows.filter((r) => r.role === 'ADMIN').length,
    TEACHER: rows.filter((r) => r.role === 'TEACHER').length,
    STUDENT: rows.filter((r) => r.role === 'STUDENT').length,
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Users</Typography>
          <Chip label={`${counts.STUDENT} students`} size="small" color="success" />
          <Chip label={`${counts.TEACHER} teachers`} size="small" color="primary" />
          <Chip label={`${counts.ADMIN} admins`}    size="small" color="warning" />
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
              <TableCell><strong>User</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Date of Birth</strong></TableCell>
              <TableCell><strong>Role</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No users found</TableCell></TableRow>
            ) : rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={row.profilePhoto} sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13 }}>
                      {!row.profilePhoto && row.username[0].toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" fontWeight={600}>{row.username}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {row.firstName ? `${row.firstName} ${row.lastName}` : <Typography color="text.disabled" variant="body2">—</Typography>}
                </TableCell>
                <TableCell>{row.email ?? <Typography color="text.disabled" variant="body2">—</Typography>}</TableCell>
                <TableCell>{row.dateOfBirth ?? <Typography color="text.disabled" variant="body2">—</Typography>}</TableCell>
                <TableCell>
                  <Chip label={row.role} size="small" color={ROLE_COLOR[row.role] ?? 'default'} />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton size="small" color="primary" onClick={() => openEdit(row)}><EditIcon fontSize="small" /></IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => setDeleteRow(row)}><DeleteIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Create Dialog ── */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add User</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {createError && <Alert severity="error">{createError}</Alert>}
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={createRole} label="Role"
                onChange={(e) => setCreateRole(e.target.value as typeof createRole)}>
                <MenuItem value="TEACHER">Teacher</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="STUDENT">Student</MenuItem>
              </Select>
            </FormControl>

            {createRole === 'STUDENT' && (
              <>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField label="First Name" fullWidth value={createForm.firstName}
                    onChange={(e) => setCreateForm((p) => ({ ...p, firstName: e.target.value }))} />
                  <TextField label="Last Name" fullWidth value={createForm.lastName}
                    onChange={(e) => setCreateForm((p) => ({ ...p, lastName: e.target.value }))} />
                </Box>
                <TextField label="Email" type="email" fullWidth value={createForm.email}
                  onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} />
                <TextField label="Date of Birth" type="date" fullWidth value={createForm.dateOfBirth}
                  onChange={(e) => setCreateForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                  InputLabelProps={{ shrink: true }} />
                <Divider />
              </>
            )}

            <TextField label="Username" fullWidth value={createForm.username}
              onChange={(e) => setCreateForm((p) => ({ ...p, username: e.target.value }))} />
            <TextField label="Password" type="password" fullWidth value={createForm.password}
              onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={creating}>
            {creating ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editRow} onClose={() => setEditRow(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit {editRow?.username}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {editError && <Alert severity="error">{editError}</Alert>}

            {editRow?.role === 'STUDENT' && (
              <>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField label="First Name" fullWidth value={editForm.firstName}
                    onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))} />
                  <TextField label="Last Name" fullWidth value={editForm.lastName}
                    onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))} />
                </Box>
                <TextField label="Email" type="email" fullWidth value={editForm.email}
                  onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} />
                <TextField label="Date of Birth" type="date" fullWidth value={editForm.dateOfBirth}
                  onChange={(e) => setEditForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                  InputLabelProps={{ shrink: true }} />
                <Divider />
              </>
            )}

            <TextField label="Username" fullWidth value={editForm.username}
              onChange={(e) => setEditForm((p) => ({ ...p, username: e.target.value }))} />
            <TextField label="New Password" type="password" fullWidth value={editForm.password}
              onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
              helperText="Leave blank to keep current password" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditRow(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Dialog ── */}
      <Dialog open={!!deleteRow} onClose={() => setDeleteRow(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Delete user <strong>{deleteRow?.username}</strong>
            {deleteRow?.role === 'STUDENT' && ` (${deleteRow.firstName} ${deleteRow.lastName})`}?
          </Typography>
          {deleteRow?.role === 'STUDENT' && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Deleting a student user will not remove their academic records. Delete the student profile separately if needed.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteRow(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
