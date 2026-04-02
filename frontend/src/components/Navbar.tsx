import React, { useEffect, useState } from 'react';
import { AppBar, Toolbar, Button, Box, Chip, Avatar, Tooltip, Divider } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import axiosInstance from '../api/axiosInstance';
import MeridianLogo from './MeridianLogo';

interface NavItem {
  label: string;
  path: string;
  /** Which boolean from notification context indicates a new item on this tab */
  notifKey?: 'messages' | 'inquiries' | 'grades';
  /** Dot color — defaults to red ('error') */
  dotColor?: 'error' | 'info';
}

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard',  path: '/'          },
  { label: 'Users',      path: '/users'     },
  { label: 'Courses',    path: '/courses'   },
  { label: 'Grades',     path: '/grades'    },
  { label: 'Attendance', path: '/attendance'},
];

const STUDENT_NAV: NavItem[] = [
  { label: 'Dashboard',  path: '/'               },
  { label: 'Courses',    path: '/my-courses'      },
  { label: 'Grades',     path: '/my-grades',     notifKey: 'grades'   },
  { label: 'Attendance', path: '/my-attendance'  },
  { label: 'Teachers',   path: '/teachers-list', notifKey: 'messages' },
];

const TEACHER_NAV: NavItem[] = [
  { label: 'Dashboard',  path: '/'              },
  { label: 'Courses',    path: '/my-courses'    },
  { label: 'Grades',     path: '/my-grades'     },
  { label: 'Attendance', path: '/my-attendance' },
  { label: 'Students',   path: '/messages',     notifKey: 'messages',  dotColor: 'error' },
  { label: 'Inquiries',  path: '/inquiries',    notifKey: 'inquiries', dotColor: 'info'  },
];

const ROLE_COLOR: Record<string, 'primary' | 'warning' | 'success'> = {
  ADMIN: 'warning', TEACHER: 'primary', STUDENT: 'success',
};

const ROLE_CHIP_SX: Record<string, object> = {
  ADMIN:   { bgcolor: '#fff7ed', color: '#d97706', border: '1px solid #fcd34d' },
  TEACHER: { bgcolor: '#e0f2fe', color: '#0d6e8a', border: '1px solid #7dd3fc' },
  STUDENT: { bgcolor: '#f0fdf4', color: '#15803d', border: '1px solid #86efac' },
};

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasNewMessages, hasNewInquiries, hasNewGrades } = useNotifications();

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    axiosInstance.get<{ profilePhoto?: string }>('/users/me')
      .then((r) => setProfilePhoto(r.data.profilePhoto ?? null))
      .catch(() => {});
  }, [user]);

  const hasNew = (key?: 'messages' | 'inquiries' | 'grades'): boolean => {
    if (!key) return false;
    if (key === 'messages')  return hasNewMessages;
    if (key === 'inquiries') return hasNewInquiries;
    if (key === 'grades')    return hasNewGrades;
    return false;
  };

  const navItems: NavItem[] =
    user?.role === 'STUDENT' ? STUDENT_NAV :
    user?.role === 'TEACHER' ? TEACHER_NAV :
    ADMIN_NAV;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'white',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'rgba(13,110,138,0.12)',
      }}
    >
      <Toolbar sx={{ gap: 0.5, minHeight: 56 }}>
        {/* Brand mark */}
        <Box
          onClick={() => navigate('/')}
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mr: 2 }}
        >
          <MeridianLogo size={34} showText />
        </Box>

        <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: 'rgba(13,110,138,0.15)' }} />

        <Box sx={{ display: 'flex', gap: 0.5, flexGrow: 1 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const showDot  = hasNew(item.notifKey);

            return (
              <Box key={item.path} sx={{ position: 'relative', display: 'inline-flex' }}>
                <Button
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 2, px: 2, fontSize: '0.875rem',
                    bgcolor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? 'white' : 'text.secondary',
                    fontWeight: isActive ? 700 : 500,
                    '&:hover': {
                      bgcolor: isActive ? 'primary.dark' : 'rgba(13,110,138,0.06)',
                      color: isActive ? 'white' : 'primary.main',
                    },
                    transition: 'all 0.15s ease',
                  }}
                >
                  {item.label}
                </Button>

                {showDot && (
                  <Box sx={{
                    position: 'absolute',
                    top: 6, right: 6,
                    width: 8, height: 8,
                    borderRadius: '50%',
                    bgcolor: `${item.dotColor ?? 'error'}.main`,
                    border: '2px solid white',
                    pointerEvents: 'none',
                  }} />
                )}
              </Box>
            );
          })}
        </Box>

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Edit Profile">
              <Avatar
                src={profilePhoto ?? undefined}
                onClick={() => navigate('/profile')}
                sx={{ width: 32, height: 32, cursor: 'pointer', bgcolor: 'primary.main', fontSize: 14 }}
              >
                {!profilePhoto && (user.username[0].toUpperCase())}
              </Avatar>
            </Tooltip>
            <Chip
              label={user.username}
              size="small"
              variant="outlined"
              sx={{ borderColor: 'rgba(13,110,138,0.3)', color: 'text.primary', fontSize: '0.78rem' }}
            />
            <Chip
              label={user.role}
              size="small"
              sx={{ fontSize: '0.72rem', fontWeight: 700, ...ROLE_CHIP_SX[user.role] }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => { logout(); navigate('/login'); }}
              sx={{ borderColor: 'rgba(13,110,138,0.35)', color: 'primary.main', borderRadius: 2 }}
            >
              Logout
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
