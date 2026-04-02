import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CircularProgress, Chip,
  Alert, List, ListItem, ListItemText, Divider, Avatar,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import GradeIcon from '@mui/icons-material/Grade';
import PeopleIcon from '@mui/icons-material/People';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import axiosInstance from '../../api/axiosInstance';
import type { Course, GradeDetail, Attendance, Enrollment } from '../../types';
import { useAuth } from '../../context/AuthContext';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <Card elevation={1} sx={{ borderRadius: 3 }}>
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

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [grades, setGrades] = useState<GradeDetail[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      axiosInstance.get<Course[]>('/courses/mine'),
      axiosInstance.get<Enrollment[]>('/enrollments/teacher'),
      axiosInstance.get<GradeDetail[]>('/grades/teacher'),
      axiosInstance.get<Attendance[]>('/attendance/teacher'),
    ])
      .then(([c, e, g, a]) => {
        setCourses(c.data);
        setEnrollments(e.data);
        setGrades(g.data);
        setAttendance(a.data);
      })
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress size={48} /></Box>;

  const avgGrade = grades.length
    ? (grades.reduce((s, g) => s + g.score, 0) / grades.length).toFixed(1)
    : '—';
  const presentCount = attendance.filter((a) => a.status === 'PRESENT').length;
  const attendanceRate = attendance.length ? Math.round((presentCount / attendance.length) * 100) : 0;

  // Build enrolled students list per course
  const studentsByCourse = courses.map((c) => ({
    course: c,
    students: enrollments.filter((e) => e.course?.id === c.id),
  }));

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <SchoolIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>Teacher Dashboard</Typography>
        <Chip label={user?.username} size="small" color="primary" />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="My Courses" value={courses.length} icon={<MenuBookIcon />} color="#667eea" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Enrolled Students" value={enrollments.length} icon={<PeopleIcon />} color="#764ba2" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Avg Grade" value={avgGrade !== '—' ? `${avgGrade}%` : '—'} icon={<GradeIcon />} color="#48bb78" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Attendance Rate" value={`${attendanceRate}%`} icon={<SchoolIcon />} color="#f6ad55" />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={1} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Students per Course</Typography>
              {studentsByCourse.length === 0 || studentsByCourse.every(s => s.students.length === 0) ? (
                <Typography color="text.secondary">No students enrolled yet.</Typography>
              ) : (
                studentsByCourse.filter(sc => sc.students.length > 0).map((sc, ci) => (
                  <Box key={sc.course.id} sx={{ mb: ci < studentsByCourse.length - 1 ? 2 : 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle2" fontWeight={600}>{sc.course.name}</Typography>
                      <Chip label={sc.students.length} size="small" color="primary" />
                    </Box>
                    <List dense disablePadding>
                      {sc.students.map((e, i) => (
                        <React.Fragment key={e.id}>
                          <ListItem sx={{ py: 0.5, px: 0 }}>
                            <Avatar sx={{ width: 28, height: 28, mr: 1, fontSize: 12, bgcolor: 'primary.light' }}>
                              {e.student?.firstName?.[0]}{e.student?.lastName?.[0]}
                            </Avatar>
                            <ListItemText
                              primary={`${e.student?.firstName} ${e.student?.lastName}`}
                              secondary={e.student?.email}
                              primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItem>
                          {i < sc.students.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={1} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Recent Grades</Typography>
              {grades.length === 0 ? (
                <Typography color="text.secondary">No grades recorded yet.</Typography>
              ) : (
                <List dense>
                  {grades.slice(0, 6).map((g, i) => (
                    <React.Fragment key={g.id}>
                      <ListItem>
                        <ListItemText
                          primary={`${g.enrollment?.student?.firstName} ${g.enrollment?.student?.lastName}`}
                          secondary={g.enrollment?.course?.name}
                        />
                        <Chip label={`${g.score}%`} size="small" color={g.score >= 70 ? 'success' : 'warning'} />
                      </ListItem>
                      {i < Math.min(grades.length - 1, 5) && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeacherDashboard;
