import React, { useState } from 'react';
import {
  Box, TextField, Button, Typography, Alert,
  InputAdornment, IconButton, CircularProgress,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import MeridianLogo from '../components/MeridianLogo';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

const FEATURES = [
  'Manage students, courses & attendance',
  'Track grades and academic progress',
  'Streamlined teacher-student communication',
  'Role-based portals for every stakeholder',
];

/** Subtle decorative concentric circles hinting at meridian/globe lines */
const GlobeDecoration: React.FC = () => (
  <Box
    aria-hidden
    sx={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
    }}
  >
    {[520, 360, 220, 110].map((d, i) => (
      <Box
        key={d}
        sx={{
          position: 'absolute',
          width: d,
          height: d,
          borderRadius: '50%',
          border: `1px solid rgba(255,255,255,${0.07 - i * 0.01})`,
          bottom: -d / 2.2,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />
    ))}
    {/* Meridian arc — golden curved line */}
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      viewBox="0 0 400 700"
      preserveAspectRatio="none"
    >
      <path
        d="M320 0 C440 200 440 500 320 700"
        stroke="rgba(245,158,11,0.18)"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M280 0 C380 200 380 500 280 700"
        stroke="rgba(245,158,11,0.10)"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  </Box>
);

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    setLoading(true);
    try {
      await login(data.username, data.password);
      navigate('/');
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>

      {/* ── Left brand panel (hidden on mobile) ── */}
      <Box
        sx={{
          flex: '0 0 45%',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          px: 7,
          py: 8,
          position: 'relative',
          background: 'linear-gradient(160deg, #0d3b56 0%, #0d6e8a 55%, #0a9384 100%)',
          overflow: 'hidden',
        }}
      >
        <GlobeDecoration />

        {/* Logo */}
        <Box sx={{ position: 'relative', zIndex: 1, mb: 5 }}>
          <MeridianLogo size={64} showText light />
        </Box>

        {/* Tagline */}
        <Typography
          variant="h3"
          fontWeight={800}
          color="white"
          sx={{ position: 'relative', zIndex: 1, lineHeight: 1.2, mb: 1.5, fontSize: { md: '2rem', lg: '2.4rem' } }}
        >
          Where Learning<br />Reaches Its Peak
        </Typography>
        <Typography
          sx={{
            position: 'relative', zIndex: 1, color: 'rgba(255,255,255,0.68)',
            fontSize: '1rem', mb: 5, maxWidth: 320,
          }}
        >
          A unified platform for administrators, teachers, and students to collaborate and grow.
        </Typography>

        {/* Feature list */}
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {FEATURES.map((f) => (
            <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <CheckCircleOutlineIcon sx={{ color: '#f59e0b', fontSize: 20, flexShrink: 0 }} />
              <Typography sx={{ color: 'rgba(255,255,255,0.82)', fontSize: '0.9rem' }}>{f}</Typography>
            </Box>
          ))}
        </Box>

        {/* Version badge */}
        <Typography
          sx={{
            position: 'absolute', bottom: 24, left: 28, zIndex: 1,
            color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', letterSpacing: '0.08em',
          }}
        >
          MERIDIAN · Student Management Platform
        </Typography>
      </Box>

      {/* ── Right sign-in panel ── */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          px: { xs: 3, sm: 6, md: 8 },
          py: 6,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>

          {/* Mobile logo */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 4 }}>
            <MeridianLogo size={52} showText />
          </Box>

          <Typography variant="h4" fontWeight={800} sx={{ color: 'text.primary', mb: 0.75 }}>
            Welcome back
          </Typography>
          <Typography sx={{ color: 'text.secondary', mb: 4, fontSize: '0.95rem' }}>
            Sign in to your Meridian account
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}

          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
          >
            <TextField
              label="Username"
              fullWidth
              {...register('username')}
              error={!!errors.username}
              helperText={errors.username?.message}
              autoFocus
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((v) => !v)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              sx={{ mt: 0.5, py: 1.6, borderRadius: 2, fontSize: '1rem' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
