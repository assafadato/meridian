import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardActions, Button, Chip,
  CircularProgress, Alert, Divider, Dialog, DialogTitle, DialogContent,
  DialogActions,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axiosInstance from '../../api/axiosInstance';
import type { Course, Enrollment } from '../../types';
import { getCourses } from '../../api/courses';

const StudentCourses: React.FC = () => {
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState<number | null>(null);
  const [confirmCourse, setConfirmCourse] = useState<Course | null>(null);

  const [hasProfile, setHasProfile] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Check if this student user has a linked student profile
      const profileCheck = await axiosInstance.get('/students/me').catch((e) => e.response);
      setHasProfile(profileCheck?.status === 200);

      const [courses, myEnrollments] = await Promise.all([
        getCourses(),
        axiosInstance.get<Enrollment[]>('/enrollments/me'),
      ]);
      setAllCourses(courses.data);
      setEnrollments(myEnrollments.data);
    } catch {
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const enrolledCourseIds = new Set(enrollments.map((e) => e.course?.id));

  const handleEnroll = async () => {
    if (!confirmCourse?.id) return;
    setEnrolling(confirmCourse.id);
    setConfirmCourse(null);
    try {
      await axiosInstance.post(`/enrollments/me/course/${confirmCourse.id}`);
      await load();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        setError('Your account is not linked to a student profile. Ask an admin to create your student record.');
      } else if (status === 409) {
        setError('You are already enrolled in this course.');
      } else {
        setError('Enrollment failed. Please try again.');
      }
    } finally {
      setEnrolling(null);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress size={48} /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <MenuBookIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>My Courses</Typography>
        <Chip label={`${enrollments.length} enrolled`} size="small" color="primary" />
      </Box>

      {!hasProfile && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your login account is not yet linked to a student profile. Ask an admin to create your student record so you can enroll in courses.
        </Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Enrolled</Typography>
      {enrollments.length === 0
        ? <Typography color="text.secondary" sx={{ mb: 3 }}>You are not enrolled in any courses yet.</Typography>
        : <Grid container spacing={2} sx={{ mb: 3 }}>
          {enrollments.map((e) => (
            <Grid key={e.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card elevation={1} sx={{ borderRadius: 3, border: '2px solid', borderColor: 'primary.light' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography fontWeight={700}>{e.course?.name}</Typography>
                    <CheckCircleIcon color="primary" fontSize="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{e.course?.description}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    {e.course?.teacher && <Chip label={e.course.teacher} size="small" />}
                    {e.course?.credits && <Chip label={`${e.course.credits} credits`} size="small" variant="outlined" />}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      }

      <Divider sx={{ mb: 3 }} />
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Available Courses</Typography>
      <Grid container spacing={2}>
        {allCourses.filter((c) => !enrolledCourseIds.has(c.id)).map((course) => (
          <Grid key={course.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card elevation={1} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography fontWeight={700}>{course.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{course.description}</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  {course.teacher && <Chip label={course.teacher} size="small" />}
                  {course.credits && <Chip label={`${course.credits} credits`} size="small" variant="outlined" />}
                </Box>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={enrolling === course.id ? <CircularProgress size={14} color="inherit" /> : <AddIcon />}
                  disabled={enrolling === course.id}
                  onClick={() => setConfirmCourse(course)}
                  sx={{ borderRadius: 2 }}
                >
                  Enroll
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={!!confirmCourse} onClose={() => setConfirmCourse(null)}>
        <DialogTitle>Confirm Enrollment</DialogTitle>
        <DialogContent>
          <Typography>Enroll in <strong>{confirmCourse?.name}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmCourse(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEnroll}>Enroll</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentCourses;
