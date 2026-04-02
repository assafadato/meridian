import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button,
  Alert, CircularProgress, Divider, Chip, Avatar, IconButton, Tooltip,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SaveIcon from '@mui/icons-material/Save';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const MAX_PHOTO_BYTES = 500 * 1024; // 500 KB

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(user?.username ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoDirty, setPhotoDirty] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Load existing profile photo
  useEffect(() => {
    axiosInstance.get<{ profilePhoto?: string }>('/users/me')
      .then((r) => setPhotoDataUrl(r.data.profilePhoto ?? null))
      .catch(() => {});
  }, []);

  if (!user) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError('');
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError(`Photo must be ≤ 500 KB (selected: ${(file.size / 1024).toFixed(0)} KB)`);
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDataUrl(reader.result as string);
      setPhotoDirty(true);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoDataUrl(null);
    setPhotoDirty(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword && newPassword.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    const payload: Record<string, string | null> = {};
    if (username.trim() && username !== user.username) payload.username = username.trim();
    if (newPassword) payload.password = newPassword;
    if (photoDirty) payload.profilePhoto = photoDataUrl; // null clears the photo

    if (Object.keys(payload).length === 0) {
      setError('No changes to save');
      return;
    }

    setSaving(true);
    try {
      await axiosInstance.put('/users/me', payload);
      const changedCredentials = payload.username || payload.password;
      if (changedCredentials) {
        setSuccess('Profile updated. Please log in again with your new credentials.');
        setTimeout(() => logout(), 2500);
      } else {
        setSuccess('Profile photo saved.');
        setPhotoDirty(false);
      }
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      if (e?.response?.status === 409) setError('Username is already taken');
      else setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const ROLE_COLOR: Record<string, 'warning' | 'primary' | 'success'> = {
    ADMIN: 'warning', TEACHER: 'primary', STUDENT: 'success',
  };

  return (
    <Box sx={{ p: 3, maxWidth: 540, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <AccountCircleIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>My Profile</Typography>
      </Box>

      <Card elevation={1} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          {/* Photo + identity */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 3 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={photoDataUrl ?? undefined}
                sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: 28, cursor: 'pointer' }}
                onClick={() => fileInputRef.current?.click()}
              >
                {!photoDataUrl && user.username[0].toUpperCase()}
              </Avatar>
              <Tooltip title="Upload photo (max 500 KB)">
                <IconButton
                  size="small"
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    position: 'absolute', bottom: -4, right: -4,
                    bgcolor: 'primary.main', color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                    width: 28, height: 28,
                  }}
                >
                  <PhotoCameraIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={700}>{user.username}</Typography>
              <Chip label={user.role} size="small" color={ROLE_COLOR[user.role] ?? 'default'} />
              {photoDataUrl && (
                <Box sx={{ mt: 1 }}>
                  <Button
                    size="small" color="error" startIcon={<DeleteIcon />}
                    onClick={handleRemovePhoto}
                  >
                    Remove photo
                  </Button>
                </Box>
              )}
            </Box>
          </Box>

          {photoError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPhotoError('')}>{photoError}</Alert>
          )}

          <Divider sx={{ mb: 3 }} />

          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Change Username</Typography>
            <TextField
              label="Username" fullWidth size="small"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <Divider />
            <Typography variant="subtitle2" color="text.secondary">Change Password</Typography>

            <TextField
              label="New Password" type="password" fullWidth size="small"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helperText="Leave blank to keep current password"
            />
            <TextField
              label="Confirm New Password" type="password" fullWidth size="small"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Box>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              Save Changes
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Profile;
