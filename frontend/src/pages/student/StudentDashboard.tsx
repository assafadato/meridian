import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CircularProgress, Chip, Alert,
  List, ListItem, ListItemText, Divider,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import GradeIcon from '@mui/icons-material/Grade';
import EventNoteIcon from '@mui/icons-material/EventNote';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import axiosInstance from '../../api/axiosInstance';
import type { Enrollment, GradeDetail, Attendance } from '../../types';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <Card elevation={1} sx={{ borderRadius: 3, height: '100%' }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
          <Typography variant="h4" fontWeight={700}>{value}</Typography>
        </Box>
        <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const StudentDashboard: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [grades, setGrades] = useState<GradeDetail[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [e, g, a] = await Promise.all([
          axiosInstance.get<Enrollment[]>('/enrollments/me'),
          axiosInstance.get<GradeDetail[]>('/grades/me'),
          axiosInstance.get<Attendance[]>('/attendance/me'),
        ]);
        setEnrollments(e.data);
        setGrades(g.data);
        setAttendance(a.data);
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress size={48} /></Box>;

  const avgGrade = grades.length
    ? (grades.reduce((s, g) => s + g.score, 0) / grades.length).toFixed(1)
    : '—';
  const presentCount = attendance.filter((a) => a.status === 'PRESENT').length;
  const attendanceRate = attendance.length ? Math.round((presentCount / attendance.length) * 100) : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <SchoolIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>My Dashboard</Typography>
        <Chip label="Student" size="small" color="success" />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Enrolled Courses" value={enrollments.length} icon={<MenuBookIcon />} color="#667eea" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Grades" value={grades.length} icon={<GradeIcon />} color="#f6ad55" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Average Grade" value={avgGrade !== '—' ? `${avgGrade}%` : '—'} icon={<GradeIcon />} color="#48bb78" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Attendance Rate" value={`${attendanceRate}%`} icon={<EventNoteIcon />} color="#764ba2" />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={1} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>My Courses</Typography>
              {enrollments.length === 0
                ? <Typography color="text.secondary">Not enrolled in any courses yet.</Typography>
                : <List dense>
                  {enrollments.map((e, i) => (
                    <React.Fragment key={e.id}>
                      <ListItem>
                        <ListItemText primary={e.course?.name} secondary={e.course?.teacher ? `Teacher: ${e.course.teacher}` : undefined} />
                        {e.course?.credits && <Chip label={`${e.course.credits} cr`} size="small" variant="outlined" />}
                      </ListItem>
                      {i < enrollments.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              }
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={1} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Recent Grades</Typography>
              {grades.length === 0
                ? <Typography color="text.secondary">No grades yet.</Typography>
                : <List dense>
                  {grades.slice(0, 5).map((g, i) => (
                    <React.Fragment key={g.id}>
                      <ListItem>
                        <ListItemText
                          primary={g.enrollment?.course?.name}
                          secondary={g.gradeType}
                        />
                        <Chip
                          label={`${g.score}%`}
                          size="small"
                          color={g.score >= 90 ? 'success' : g.score >= 70 ? 'primary' : 'warning'}
                        />
                      </ListItem>
                      {i < Math.min(grades.length - 1, 4) && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              }
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentDashboard;
