import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CircularProgress, Alert, Chip,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SchoolIcon from '@mui/icons-material/School';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { getDashboardStats } from '../api/dashboard';
import { getGrades } from '../api/grades';
import { getCourses } from '../api/courses';
import type { DashboardStats, GradeDetail, Course } from '../types';

const COLORS = ['#667eea', '#764ba2', '#48bb78', '#f6ad55', '#fc8181', '#63b3ed'];

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => (
  <Card elevation={1} sx={{ borderRadius: 3, height: '100%' }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>{title}</Typography>
          <Typography variant="h4" fontWeight={700}>{value}</Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 48, height: 48, borderRadius: 2,
            bgcolor: color, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: 'white',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [grades, setGrades] = useState<GradeDetail[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [statsRes, gradesRes, coursesRes] = await Promise.allSettled([
          getDashboardStats(),
          getGrades(),
          getCourses(),
        ]);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (gradesRes.status === 'fulfilled') setGrades(gradesRes.value.data);
        if (coursesRes.status === 'fulfilled') setCourses(coursesRes.value.data);
        if (statsRes.status === 'rejected') setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  const enrollmentPieData = stats
    ? [
        { name: 'Enrolled', value: stats.totalEnrollments, color: COLORS[0] },
        { name: 'Capacity', value: Math.max(stats.totalStudents * 3 - stats.totalEnrollments, 0), color: COLORS[5] },
      ]
    : [];

  const filteredGrades = selectedCourseId === 'all'
    ? grades
    : grades.filter((g) => g.enrollment?.course?.id === selectedCourseId);

  const gradeBarData = [
    { range: '90-100', count: filteredGrades.filter((g) => g.score >= 90).length },
    { range: '80-89', count: filteredGrades.filter((g) => g.score >= 80 && g.score < 90).length },
    { range: '70-79', count: filteredGrades.filter((g) => g.score >= 70 && g.score < 80).length },
    { range: '60-69', count: filteredGrades.filter((g) => g.score >= 60 && g.score < 70).length },
    { range: '<60', count: filteredGrades.filter((g) => g.score < 60).length },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <SchoolIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>Dashboard</Typography>
        <Chip label="Overview" size="small" color="primary" variant="outlined" />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Students"
            value={stats?.totalStudents ?? 0}
            icon={<PeopleIcon />}
            color="#667eea"
            subtitle="Registered students"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Courses"
            value={stats?.totalCourses ?? 0}
            icon={<MenuBookIcon />}
            color="#48bb78"
            subtitle="Active courses"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Average Grade"
            value={stats?.averageGrade != null ? `${Number(stats.averageGrade).toFixed(1)}%` : '—'}
            icon={<TrendingUpIcon />}
            color="#f6ad55"
            subtitle="Across all assessments"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Attendance Rate"
            value={stats?.attendanceRate != null ? `${Number(stats.attendanceRate).toFixed(1)}%` : '—'}
            icon={<CheckCircleIcon />}
            color="#764ba2"
            subtitle="Present sessions"
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={1} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Enrollment Overview</Typography>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={enrollmentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {enrollmentPieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={1} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" fontWeight={600}>Grade Distribution</Typography>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Course</InputLabel>
                  <Select
                    value={selectedCourseId}
                    label="Course"
                    onChange={(e) => setSelectedCourseId(e.target.value as number | 'all')}
                  >
                    <MenuItem value="all">All Courses</MenuItem>
                    {courses.map((c) => (
                      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={gradeBarData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="count" fill="#667eea" radius={[4, 4, 0, 0]} name="Students" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={12}>
          <Card elevation={1} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Key Metrics</Typography>
              <Grid container spacing={2}>
                {[
                  { label: 'Total Enrollments', value: stats?.totalEnrollments ?? 0, color: '#667eea' },
                  { label: 'Avg Grade', value: stats?.averageGrade != null ? `${Number(stats.averageGrade).toFixed(1)}%` : '—', color: '#f6ad55' },
                  { label: 'Attendance Rate', value: stats?.attendanceRate != null ? `${Number(stats.attendanceRate).toFixed(1)}%` : '—', color: '#48bb78' },
                ].map((metric) => (
                  <Grid key={metric.label} size={{ xs: 12, sm: 4 }}>
                    <Box
                      sx={{
                        p: 2, borderRadius: 2, bgcolor: `${metric.color}15`,
                        border: `1px solid ${metric.color}30`,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">{metric.label}</Typography>
                      <Typography variant="h5" fontWeight={700} sx={{ color: metric.color }}>
                        {metric.value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
