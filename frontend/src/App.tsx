import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import Profile from './pages/Profile';
import Login from './pages/Login';

// Admin pages
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Students from './pages/Students';
import Courses from './pages/Courses';
import Grades from './pages/Grades';
import Attendance from './pages/Attendance';
import Teachers from './pages/Teachers';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentCourses from './pages/student/StudentCourses';
import StudentGrades from './pages/student/StudentGrades';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentMessages from './pages/student/StudentMessages';
import TeachersList from './pages/student/TeachersList';

// Teacher pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherCourses from './pages/teacher/TeacherCourses';
import TeacherGrades from './pages/teacher/TeacherGrades';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import TeacherMessages from './pages/teacher/TeacherMessages';
import TeacherInquiries from './pages/teacher/TeacherInquiries';

// ── Meridian brand palette ──────────────────────────────────────
// Primary:   deep ocean teal  (#0d6e8a)
// Secondary: warm amber/gold  (#f59e0b)  — the pole-star accent
// Background: crisp blue-white (#f0f7fa)
const theme = createTheme({
  palette: {
    primary:    { main: '#0d6e8a', light: '#1a8fb0', dark: '#095970', contrastText: '#ffffff' },
    secondary:  { main: '#f59e0b', light: '#fbbf24', dark: '#d97706', contrastText: '#1a1a1a' },
    background: { default: '#f0f7fa', paper: '#ffffff' },
    text:       { primary: '#0d2b38', secondary: '#4a7080' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
        containedPrimary: {
          background: 'linear-gradient(135deg, #1a8fb0 0%, #0d6e8a 100%)',
          '&:hover': { background: 'linear-gradient(135deg, #1a8fb0 0%, #095970 100%)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { boxShadow: '0 2px 12px rgba(13,110,138,0.08)' },
      },
    },
  },
  shape: { borderRadius: 8 },
  typography: { fontFamily: '"Inter", "Roboto", "Helvetica", sans-serif' },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
    MuiTableCell: { styleOverrides: { root: { borderBottom: '1px solid rgba(0,0,0,0.06)' } } },
  },
});

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Box component="main"><Outlet /></Box>
    </Box>
  );
};

const RoleRoute: React.FC<{ roles: string[]; element: React.ReactElement }> = ({ roles, element }) => {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />;
  return element;
};

const MyCoursesRoute: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'TEACHER') return <TeacherCourses />;
  if (user?.role === 'STUDENT') return <StudentCourses />;
  return <Navigate to="/" replace />;
};
const MyGradesRoute: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'TEACHER') return <TeacherGrades />;
  if (user?.role === 'STUDENT') return <StudentGrades />;
  return <Navigate to="/" replace />;
};
const MyAttendanceRoute: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'TEACHER') return <TeacherAttendance />;
  if (user?.role === 'STUDENT') return <StudentAttendance />;
  return <Navigate to="/" replace />;
};
const MessagesRoute: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'TEACHER') return <TeacherMessages />;
  if (user?.role === 'STUDENT') return <StudentMessages />;
  return <Navigate to="/" replace />;
};

const RootRedirect: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'STUDENT') return <StudentDashboard />;
  if (user?.role === 'TEACHER') return <TeacherDashboard />;
  return <Dashboard />;
};

const App: React.FC = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <AuthProvider>
      <NotificationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedLayout />}>
            {/* Common root — role-based dashboard */}
            <Route path="/" element={<RootRedirect />} />

            {/* Admin-only routes */}
            <Route path="/users"      element={<RoleRoute roles={['ADMIN']} element={<Users />} />} />
            <Route path="/students"   element={<RoleRoute roles={['ADMIN']} element={<Students />} />} />
            <Route path="/courses"    element={<RoleRoute roles={['ADMIN']} element={<Courses />} />} />
            <Route path="/grades"     element={<RoleRoute roles={['ADMIN']} element={<Grades />} />} />
            <Route path="/attendance" element={<RoleRoute roles={['ADMIN']} element={<Attendance />} />} />
            <Route path="/teachers"   element={<RoleRoute roles={['ADMIN']} element={<Teachers />} />} />

            {/* Shared paths — role-aware routing */}
            <Route path="/my-courses"    element={<MyCoursesRoute />} />
            <Route path="/my-grades"     element={<MyGradesRoute />} />
            <Route path="/my-attendance" element={<MyAttendanceRoute />} />
            <Route path="/messages"      element={<MessagesRoute />} />

            {/* Student-only */}
            <Route path="/teachers-list" element={<RoleRoute roles={['STUDENT']} element={<TeachersList />} />} />

            {/* Teacher-only */}
            <Route path="/inquiries" element={<RoleRoute roles={['TEACHER']} element={<TeacherInquiries />} />} />

            {/* All roles */}
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
