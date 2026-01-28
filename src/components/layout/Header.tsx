'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppBar,
  Toolbar,
  IconButton,
  InputBase,
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
  Paper,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  Search,
  Notifications,
  Add,
  Person,
  Policy,
  RequestQuote,
  ReportProblem,
  Close,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
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

  const { data: searchResults = [] } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const response = await axios.get(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      return response.data;
    },
    enabled: searchQuery.length >= 2,
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
        {/* Search */}
        <Paper
          sx={{
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            maxWidth: 500,
            px: 2,
            py: 0.5,
            backgroundColor: searchFocused ? '#fff' : '#f5f7fa',
            border: '1px solid',
            borderColor: searchFocused ? 'primary.main' : 'transparent',
            transition: 'all 0.2s',
          }}
          elevation={0}
        >
          <Search sx={{ color: 'text.secondary', mr: 1 }} />
          <InputBase
            placeholder="Search clients, policies, quotes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            sx={{ flex: 1 }}
          />
          {searchQuery && (
            <IconButton size="small" onClick={() => setSearchQuery('')}>
              <Close fontSize="small" />
            </IconButton>
          )}
        </Paper>

        {/* Search Results Dropdown */}
        {searchFocused && searchResults.length > 0 && (
          <Paper
            sx={{
              position: 'absolute',
              top: 64,
              left: 16,
              right: 16,
              maxWidth: 500,
              maxHeight: 400,
              overflow: 'auto',
              zIndex: 1000,
            }}
          >
            <List>
              {searchResults.map((result: { id: string; type: string; title: string; subtitle: string; path: string }) => (
                <ListItem
                  key={result.id}
                  component="button"
                  onClick={() => {
                    router.push(result.path);
                    setSearchQuery('');
                  }}
                  sx={{
                    '&:hover': { backgroundColor: 'action.hover' },
                    cursor: 'pointer',
                  }}
                >
                  <ListItemIcon>
                    {result.type === 'client' && <Person />}
                    {result.type === 'policy' && <Policy />}
                    {result.type === 'quote' && <RequestQuote />}
                    {result.type === 'claim' && <ReportProblem />}
                  </ListItemIcon>
                  <ListItemText
                    primary={result.title}
                    secondary={result.subtitle}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

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
