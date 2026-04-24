'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
} from '@mui/material';
import {
  Notifications,
  Add,
  Person,
  Policy,
  RequestQuote,
  ReportProblem,
  Warning,
  Info,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export default function Header() {
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await axios.get('/api/notifications');
      return response.data;
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.patch(`/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications.filter((n: { isRead: boolean }) => !n.isRead).length;

  const handleNotificationClick = (notification: { id: string; link?: string }) => {
    markAsReadMutation.mutate(notification.id);
    if (notification.link) {
      router.push(notification.link);
    }
    setNotificationsAnchor(null);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'RENEWAL':
        return <Warning color="warning" />;
      case 'CLAIM':
        return <ReportProblem color="error" />;
      case 'QUOTE':
        return <RequestQuote color="primary" />;
      default:
        return <Info color="info" />;
    }
  };

  const quickAddItems = [
    { label: 'New Client', icon: <Person />, path: '/clients/new' },
    { label: 'New Quote', icon: <RequestQuote />, path: '/quotes/new' },
    { label: 'New Policy', icon: <Policy />, path: '/policies/new' },
    { label: 'Report Claim', icon: <ReportProblem />, path: '/claims/new' },
  ];

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: '#fff',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ gap: 2 }}>
        <Box sx={{ flex: 1 }} />

        {/* Quick Add Button */}
        <Tooltip title="Quick Add">
          <IconButton
            onClick={(e) => setAddMenuAnchor(e.currentTarget)}
            sx={{
              backgroundColor: 'primary.main',
              color: '#fff',
              '&:hover': { backgroundColor: 'primary.dark' },
            }}
          >
            <Add />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={addMenuAnchor}
          open={Boolean(addMenuAnchor)}
          onClose={() => setAddMenuAnchor(null)}
        >
          {quickAddItems.map((item) => (
            <MenuItem
              key={item.label}
              onClick={() => {
                router.push(item.path);
                setAddMenuAnchor(null);
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              {item.label}
            </MenuItem>
          ))}
        </Menu>

        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton
            onClick={(e) => setNotificationsAnchor(e.currentTarget)}
            sx={{ color: 'text.primary' }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <Notifications />
            </Badge>
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={notificationsAnchor}
          open={Boolean(notificationsAnchor)}
          onClose={() => setNotificationsAnchor(null)}
          PaperProps={{
            sx: { width: 360, maxHeight: 400 },
          }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontSize="1rem">
              Notifications
            </Typography>
          </Box>
          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">No notifications</Typography>
            </Box>
          ) : (
            <List sx={{ py: 0 }}>
              {notifications.slice(0, 10).map((notification: { id: string; type: string; title: string; message: string; isRead: boolean; createdAt: string; link?: string }) => (
                <ListItem
                  key={notification.id}
                  component="div"
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                    '&:hover': { backgroundColor: 'action.selected' },
                  }}
                >
                  <ListItemIcon>{getNotificationIcon(notification.type)}</ListItemIcon>
                  <ListItemText
                    primary={notification.title}
                    secondary={notification.message}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: notification.isRead ? 400 : 600 }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                  {!notification.isRead && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                      }}
                    />
                  )}
                </ListItem>
              ))}
            </List>
          )}
          <Divider />
          <MenuItem
            onClick={() => {
              router.push('/notifications');
              setNotificationsAnchor(null);
            }}
            sx={{ justifyContent: 'center' }}
          >
            <Typography color="primary" fontSize="0.875rem">
              View All Notifications
            </Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
