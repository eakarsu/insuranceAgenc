'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, Avatar, Divider,
  Switch, FormControlLabel, Alert, Snackbar, Tabs, Tab, List, ListItem, ListItemText, ListItemIcon,
} from '@mui/material';
import { Save, Person, Notifications, Security, Palette, Business, IntegrationInstructions } from '@mui/icons-material';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [profile, setProfile] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
    title: 'Insurance Agent',
  });

  const [notifications, setNotifications] = useState({
    emailRenewals: true,
    emailClaims: true,
    emailQuotes: true,
    pushNotifications: true,
    dailyDigest: false,
  });

  const handleSave = () => {
    setSnackbar({ open: true, message: 'Settings saved successfully' });
  };

  return (
    <Box className="animate-fade-in">
      <Typography variant="h4" fontWeight={700} gutterBottom>Settings</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Manage your account and preferences</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <List>
              {[
                { icon: <Person />, label: 'Profile', index: 0 },
                { icon: <Notifications />, label: 'Notifications', index: 1 },
                { icon: <Security />, label: 'Security', index: 2 },
                { icon: <Business />, label: 'Agency', index: 3 },
                { icon: <IntegrationInstructions />, label: 'Integrations', index: 4 },
              ].map((item) => (
                <ListItem
                  key={item.index}
                  component="button"
                  onClick={() => setTab(item.index)}
                  sx={{
                    bgcolor: tab === item.index ? 'primary.light' : 'transparent',
                    '&:hover': { bgcolor: tab === item.index ? 'primary.light' : 'action.hover' },
                  }}
                >
                  <ListItemIcon sx={{ color: tab === item.index ? 'primary.main' : 'inherit' }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: tab === item.index ? 600 : 400 }} />
                </ListItem>
              ))}
            </List>
          </Card>
        </Grid>

        <Grid item xs={12} md={9}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              {tab === 0 && (
                <Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Profile Settings</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
                    <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}>
                      {session?.user?.name?.charAt(0) || 'U'}
                    </Avatar>
                    <Box>
                      <Button variant="outlined" size="small" sx={{ mr: 1 }}>Upload Photo</Button>
                      <Button variant="text" size="small" color="error">Remove</Button>
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Full Name" value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Email" value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Phone" value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Title" value={profile.title}
                        onChange={(e) => setProfile({ ...profile, title: e.target.value })} />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {tab === 1 && (
                <Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Notification Preferences</Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="Renewal Reminders" secondary="Get notified about upcoming policy renewals" />
                      <Switch checked={notifications.emailRenewals}
                        onChange={(e) => setNotifications({ ...notifications, emailRenewals: e.target.checked })} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Claims Updates" secondary="Receive updates on claim status changes" />
                      <Switch checked={notifications.emailClaims}
                        onChange={(e) => setNotifications({ ...notifications, emailClaims: e.target.checked })} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Quote Follow-ups" secondary="Reminders for pending quotes" />
                      <Switch checked={notifications.emailQuotes}
                        onChange={(e) => setNotifications({ ...notifications, emailQuotes: e.target.checked })} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Push Notifications" secondary="Browser push notifications" />
                      <Switch checked={notifications.pushNotifications}
                        onChange={(e) => setNotifications({ ...notifications, pushNotifications: e.target.checked })} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Daily Digest" secondary="Summary email at end of day" />
                      <Switch checked={notifications.dailyDigest}
                        onChange={(e) => setNotifications({ ...notifications, dailyDigest: e.target.checked })} />
                    </ListItem>
                  </List>
                </Box>
              )}

              {tab === 2 && (
                <Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Security Settings</Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>Change Password</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField fullWidth type="password" label="Current Password" />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField fullWidth type="password" label="New Password" />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField fullWidth type="password" label="Confirm Password" />
                      </Grid>
                    </Grid>
                  </Box>
                  <Divider sx={{ my: 3 }} />
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Two-Factor Authentication</Typography>
                    <FormControlLabel control={<Switch />} label="Enable 2FA" />
                  </Box>
                </Box>
              )}

              {tab === 3 && (
                <Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Agency Settings</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Agency Name" defaultValue="InsureFlow Agency" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Agency License #" defaultValue="AG-12345678" />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth label="Address" defaultValue="123 Insurance Way" />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth label="City" defaultValue="Springfield" />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth label="State" defaultValue="IL" />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth label="ZIP" defaultValue="62701" />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {tab === 4 && (
                <Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Integrations</Typography>
                  <List>
                    {['Carrier Rating Systems', 'Agency Management System', 'Comparative Raters', 'E-Signature Platform', 'Payment Processor'].map((name) => (
                      <ListItem key={name} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                        <ListItemText primary={name} secondary="Not connected" />
                        <Button variant="outlined" size="small">Connect</Button>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              <Divider sx={{ my: 3 }} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" startIcon={<Save />} onClick={handleSave}>Save Changes</Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity="success">{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
