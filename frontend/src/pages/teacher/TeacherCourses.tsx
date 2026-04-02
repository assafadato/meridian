import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardActions, Button, Chip,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import EditIcon from '@mui/icons-material/Edit';
import axiosInstance from '../../api/axiosInstance';
import type { Course } from '../../types';

const TeacherCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get<Course[]>('/courses/mine');
      setCourses(res.data);
    } catch {
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = (c: Course) => {
    setEditCourse(c);
    setDescription(c.description ?? '');
  };

  const handleSave = async () => {
    if (!editCourse?.id) return;
    setSaving(true);
    try {
      await axiosInstance.put(`/courses/${editCourse.id}`, { ...editCourse, description });
      setEditCourse(null);
      await load();
    } catch {
      setError('Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress size={48} /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <MenuBookIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>My Courses</Typography>
        <Chip label={courses.length} size="small" color="primary" />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {courses.length === 0 ? (
        <Typography color="text.secondary">No courses assigned to you yet.</Typography>
      ) : (
        <Grid container spacing={2}>
          {courses.map((c) => (
            <Grid key={c.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card elevation={1} sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1 }}>
                  <Typography fontWeight={700} variant="h6">{c.name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {c.description || 'No description'}
                  </Typography>
                  {c.credits && (
                    <Chip label={`${c.credits} credits`} size="small" variant="outlined" sx={{ mt: 1 }} />
                  )}
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => openEdit(c)}>
                    Edit Description
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={!!editCourse} onClose={() => setEditCourse(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Course: {editCourse?.name}</DialogTitle>
        <DialogContent>
          <TextField
            label="Description"
            multiline rows={4} fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditCourse(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherCourses;
