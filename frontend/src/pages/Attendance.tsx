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
import EventNoteIcon from '@mui/icons-material/EventNote';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { AttendanceDetail, Enrollment } from '../types';
import { getAllAttendance, createAttendance, updateAttendance, deleteAttendance } from '../api/attendance';
import { getEnrollments } from '../api/enrollments';

const schema = z.object({
  enrollmentId: z.coerce.number().min(1, 'Enrollment is required'),
  date: z.string().min(1, 'Date is required'),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE']),
});

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

const STATUS_CONFIG = {
  PRESENT: { color: 'success' as const, label: 'Present' },
  ABSENT: { color: 'error' as const, label: 'Absent' },
  LATE: { color: 'warning' as const, label: 'Late' },
};

const AttendancePage: React.FC = () => {
  const [records, setRecords] = useState<AttendanceDetail[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceDetail | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<AttendanceDetail | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [attRes, enrollmentsRes] = await Promise.allSettled([
        getAllAttendance(),
        getEnrollments(),
      ]);
      if (attRes.status === 'fulfilled') setRecords(attRes.value.data);
      if (enrollmentsRes.status === 'fulfilled') setEnrollments(enrollmentsRes.value.data);
    } catch {
      setError('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = records.filter((r) => {
    const term = search.toLowerCase();
    const matchesSearch = !term ||
      r.enrollment?.student?.firstName?.toLowerCase().includes(term) ||
      r.enrollment?.student?.lastName?.toLowerCase().includes(term) ||
      r.enrollment?.course?.name?.toLowerCase().includes(term);
    const matchesStatus = !filterStatus || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const summary = {
    present: records.filter((r) => r.status === 'PRESENT').length,
    absent: records.filter((r) => r.status === 'ABSENT').length,
    late: records.filter((r) => r.status === 'LATE').length,
  };

  const openCreate = () => {
    setEditingRecord(null);
    reset({ enrollmentId: 0, date: new Date().toISOString().split('T')[0], status: 'PRESENT' });
    setModalOpen(true);
  };

  const openEdit = (record: AttendanceDetail) => {
    setEditingRecord(record);
    reset({
      enrollmentId: record.enrollment?.id ?? 0,
      date: record.date,
      status: record.status,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      if (editingRecord?.id) {
        await updateAttendance(editingRecord.id, { date: data.date, status: data.status });
      } else {
        await createAttendance({
          enrollment: { id: data.enrollmentId },
          date: data.date,
          status: data.status,
        });
      }
      setModalOpen(false);
      fetchAll();
    } catch {
      setError('Failed to save attendance record');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (record: AttendanceDetail) => {
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!recordToDelete?.id) return;
    try {
      await deleteAttendance(recordToDelete.id);
      setDeleteDialogOpen(false);
      fetchAll();
    } catch {
      setError('Failed to delete attendance record');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventNoteIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Attendance</Typography>
          <Chip label={records.length} size="small" color="primary" />
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ borderRadius: 2 }}>
          Record Attendance
        </Button>
      </Box>

      {/* Summary chips */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Chip label={`Present: ${summary.present}`} color="success" variant="outlined" />
        <Chip label={`Absent: ${summary.absent}`} color="error" variant="outlined" />
        <Chip label={`Late: ${summary.late}`} color="warning" variant="outlined" />
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search by student or course..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
          }}
        />
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>Status Filter</InputLabel>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            label="Status Filter"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="PRESENT">Present</MenuItem>
            <MenuItem value="ABSENT">Absent</MenuItem>
            <MenuItem value="LATE">Late</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell><strong>Student</strong></TableCell>
              <TableCell><strong>Course</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No attendance records found
                </TableCell>
              </TableRow>
            ) : filtered.map((record) => {
              const config = STATUS_CONFIG[record.status];
              return (
                <TableRow key={record.id} hover>
                  <TableCell>
                    {record.enrollment?.student
                      ? `${record.enrollment.student.firstName} ${record.enrollment.student.lastName}`
                      : '—'}
                  </TableCell>
                  <TableCell>{record.enrollment?.course?.name ?? '—'}</TableCell>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>
                    <Chip label={config.label} size="small" color={config.color} />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary" onClick={() => openEdit(record)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => confirmDelete(record)}>
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
        <DialogTitle>{editingRecord ? 'Edit Attendance' : 'Record Attendance'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {!editingRecord && (
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

            <TextField
              label="Date"
              type="date"
              fullWidth
              {...register('date')}
              error={!!errors.date}
              helperText={errors.date?.message}
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth error={!!errors.status}>
              <InputLabel>Status</InputLabel>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Status">
                    <MenuItem value="PRESENT">Present</MenuItem>
                    <MenuItem value="ABSENT">Absent</MenuItem>
                    <MenuItem value="LATE">Late</MenuItem>
                  </Select>
                )}
              />
              {errors.status && <FormHelperText>{errors.status.message}</FormHelperText>}
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : editingRecord ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this attendance record?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AttendancePage;
