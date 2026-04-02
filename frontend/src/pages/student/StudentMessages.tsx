import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, Select, MenuItem, FormControl,
  InputLabel, List, ListItem, ListItemText, Chip, CircularProgress,
  Alert, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Paper,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import InboxIcon from '@mui/icons-material/Inbox';
import { sendMessage, getSent } from '../../api/messages';
import { getTeachers, type UserRecord } from '../../api/users';
import type { Message } from '../../types';

const StudentMessages: React.FC = () => {
  const [sent, setSent] = useState<Message[]>([]);
  const [teachers, setTeachers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([getSent(), getTeachers()]);
      setSent(s.data);
      setTeachers(t.data);
    } catch {
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSend = async () => {
    if (!to || !subject.trim() || !content.trim()) return;
    setSending(true);
    try {
      await sendMessage({ toUsername: to, subject, content, fromUsername: '' });
      setComposeOpen(false);
      setTo(''); setSubject(''); setContent('');
      await load();
    } catch {
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InboxIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Messages</Typography>
        </Box>
        <Button variant="contained" startIcon={<SendIcon />} onClick={() => setComposeOpen(true)}>
          New Message
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Sent Messages</Typography>
      <Paper elevation={1} sx={{ borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : sent.length === 0 ? (
          <Typography sx={{ p: 3, color: 'text.secondary' }}>No sent messages yet.</Typography>
        ) : (
          <List>
            {sent.map((m, i) => (
              <React.Fragment key={m.id}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <span>{m.subject}</span>
                      <Chip label={`To: ${m.toUsername}`} size="small" variant="outlined" />
                    </Box>}
                    secondary={<>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>{m.content}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {m.sentAt ? new Date(m.sentAt).toLocaleString() : ''}
                      </Typography>
                    </>}
                  />
                </ListItem>
                {i < sent.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      <Dialog open={composeOpen} onClose={() => setComposeOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Message</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>To (Teacher)</InputLabel>
              <Select value={to} onChange={(e) => setTo(e.target.value)} label="To (Teacher)">
                {teachers.map((t) => (
                  <MenuItem key={t.id} value={t.username}>{t.username}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Subject" fullWidth value={subject} onChange={(e) => setSubject(e.target.value)} />
            <TextField label="Message" multiline rows={5} fullWidth value={content} onChange={(e) => setContent(e.target.value)} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setComposeOpen(false)}>Cancel</Button>
          <Button variant="contained" endIcon={<SendIcon />} onClick={handleSend}
            disabled={sending || !to || !subject.trim() || !content.trim()}>
            {sending ? <CircularProgress size={20} /> : 'Send'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentMessages;
