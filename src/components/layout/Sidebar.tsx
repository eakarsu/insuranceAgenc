'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Avatar,
  IconButton,
  Divider,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Dashboard,
  People,
  Policy,
  RequestQuote,
  ReportProblem,
  AttachMoney,
  Campaign,
  Psychology,
  Settings,
  ExpandLess,
  ExpandMore,
  ChevronLeft,
  ChevronRight,
  Person,
  Business,
  FamilyRestroom,
  ContactPhone,
  Event,
  Description,
  AutoAwesome,
  CompareArrows,
  Draw,
  FollowTheSigns,
  Receipt,
  Summarize,
  TrendingUp,
  MonetizationOn,
  Email,
  Sync,
  PersonAdd,
  SmartToy,
  Analytics,
  Security,
  Mic,
  DocumentScanner,
  Recommend,
  Assessment,
  SupportAgent,
  Search,
  PersonSearch,
  Summarize as SummarizeIcon,
  SentimentSatisfied,
  Extension,
  GavelRounded,
  Payment,
  VerifiedUser,
  Rule,
  ErrorOutline,
  Feedback,
  Logout,
  Phone,
} from '@mui/icons-material';

const DRAWER_WIDTH = 280;
const DRAWER_COLLAPSED_WIDTH = 72;

interface NavItem {
  label: string;
  path?: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <Dashboard />,
  },
  {
    label: 'Clients',
    icon: <People />,
    children: [
      { label: 'All Clients', path: '/clients', icon: <People /> },
      { label: 'Personal Lines', path: '/clients/personal', icon: <Person /> },
      { label: 'Commercial Lines', path: '/clients/commercial', icon: <Business /> },
      { label: 'Households', path: '/clients/households', icon: <FamilyRestroom /> },
      { label: 'Contacts', path: '/clients/contacts', icon: <ContactPhone /> },
      { label: 'Life Events', path: '/clients/life-events', icon: <Event /> },
      { label: 'Documents', path: '/clients/documents', icon: <Description /> },
    ],
  },
  {
    label: 'Policies',
    icon: <Policy />,
    children: [
      { label: 'All Policies', path: '/policies', icon: <Policy /> },
      { label: 'Endorsements', path: '/policies/endorsements', icon: <Draw /> },
      { label: 'Renewals', path: '/policies/renewals', icon: <Sync /> },
      { label: 'Cancellations', path: '/policies/cancellations', icon: <ReportProblem /> },
    ],
  },
  {
    label: 'Quotes',
    icon: <RequestQuote />,
    children: [
      { label: 'All Quotes', path: '/quotes', icon: <RequestQuote /> },
      { label: 'Comparisons', path: '/quotes/comparisons', icon: <CompareArrows /> },
      { label: 'Proposals', path: '/quotes/proposals', icon: <Summarize /> },
      { label: 'Follow-ups', path: '/quotes/follow-ups', icon: <FollowTheSigns /> },
    ],
  },
  {
    label: 'Claims',
    icon: <ReportProblem />,
    children: [
      { label: 'All Claims', path: '/claims', icon: <ReportProblem /> },
      { label: 'Settlements', path: '/claims/settlements', icon: <AttachMoney /> },
    ],
  },
  {
    label: 'Commissions',
    icon: <AttachMoney />,
    children: [
      { label: 'Overview', path: '/commissions', icon: <AttachMoney /> },
      { label: 'Statements', path: '/commissions/statements', icon: <Receipt /> },
      { label: 'Forecasting', path: '/commissions/forecasting', icon: <TrendingUp /> },
      { label: 'Producer Splits', path: '/commissions/splits', icon: <MonetizationOn /> },
    ],
  },
  {
    label: 'Marketing',
    icon: <Campaign />,
    children: [
      { label: 'Campaigns', path: '/marketing/campaigns', icon: <Campaign /> },
      { label: 'Email Templates', path: '/marketing/templates', icon: <Email /> },
      { label: 'Referrals', path: '/marketing/referrals', icon: <PersonAdd /> },
      { label: 'Cross-Sell', path: '/marketing/cross-sell', icon: <Recommend /> },
    ],
  },
  {
    label: 'Payments',
    icon: <Payment />,
    children: [
      { label: 'All Payments', path: '/payments', icon: <Payment /> },
    ],
  },
  {
    label: 'Underwriting',
    icon: <VerifiedUser />,
    children: [
      { label: 'Results', path: '/underwriting', icon: <VerifiedUser /> },
      { label: 'Rules', path: '/underwriting/rules', icon: <Rule /> },
    ],
  },
  {
    label: 'Compliance',
    icon: <GavelRounded />,
    children: [
      { label: 'Dashboard', path: '/compliance', icon: <GavelRounded /> },
      { label: 'Rules', path: '/compliance/rules', icon: <Rule /> },
      { label: 'Checks', path: '/compliance/checks', icon: <VerifiedUser /> },
    ],
  },
  {
    label: 'Escalations',
    path: '/escalations',
    icon: <ErrorOutline />,
  },
  {
    label: 'Complaints',
    path: '/complaints',
    icon: <Feedback />,
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: <Assessment />,
  },
  {
    label: 'AI Features',
    icon: <Psychology />,
    children: [
      { label: 'AI Dashboard', path: '/ai', icon: <SmartToy /> },
      { label: 'Quote Generator', path: '/ai/quote-generator', icon: <AutoAwesome /> },
      { label: 'Coverage Analyzer', path: '/ai/coverage-analyzer', icon: <Security /> },
      { label: 'Claims Assistant', path: '/ai/claims-assistant', icon: <SupportAgent /> },
      { label: 'Renewal Predictor', path: '/ai/renewal-predictor', icon: <Analytics /> },
      { label: 'Voice Receptionist', path: '/ai/voice-receptionist', icon: <Mic /> },
      { label: 'Document Processor', path: '/ai/document-processor', icon: <DocumentScanner /> },
      { label: 'Risk Assessor', path: '/ai/risk-assessor', icon: <Assessment /> },
      { label: 'Email Composer', path: '/ai/email-composer', icon: <Email /> },
      { label: 'Smart Search', path: '/ai/smart-search', icon: <Search /> },
      { label: 'Client Summary', path: '/ai/client-summary', icon: <PersonSearch /> },
      { label: 'Claim Summarizer', path: '/ai/claim-summarizer', icon: <SummarizeIcon /> },
      { label: 'Policy Comparison', path: '/ai/policy-comparison', icon: <CompareArrows /> },
      { label: 'AI Chatbot', path: '/ai/chatbot', icon: <SmartToy /> },
      { label: 'Sentiment Analysis', path: '/ai/sentiment-analysis', icon: <SentimentSatisfied /> },
      { label: 'Loss Run Analyzer', path: '/ai/loss-run-analyzer', icon: <TrendingUp /> },
      { label: 'Endorsement Recommender', path: '/ai/endorsement-recommender', icon: <Extension /> },
      { label: 'Compliance Checker', path: '/ai/compliance-checker', icon: <GavelRounded /> },
    ],
  },
  {
    label: 'Voice Agents',
    path: '/voice-agents',
    icon: <Phone />,
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: <Settings />,
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>(['Clients']);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const fullPath = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const isActive = (path: string) => {
    // Handle paths with query params (e.g. /reports?tab=1)
    if (path.includes('?')) return fullPath === path;
    return pathname === path;
  };
  const isParentActive = (children?: NavItem[]) =>
    children?.some((child) => {
      if (!child.path) return false;
      const childPathname = child.path.split('?')[0];
      return pathname.startsWith(childPathname);
    });

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: collapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: '#1a1a2e',
          color: '#fff',
          borderRight: 'none',
          transition: 'width 0.2s ease-in-out',
          overflowX: 'hidden',
        },
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          p: 2,
          minHeight: 64,
        }}
      >
        {!collapsed && (
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #42a5f5, #7e57c2)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            InsureFlow
          </Typography>
        )}
        <IconButton
          onClick={() => setCollapsed(!collapsed)}
          sx={{ color: '#fff' }}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        <List>
          {navItems.map((item) => (
            <Box key={item.label}>
              <ListItem disablePadding>
                <Tooltip title={collapsed ? item.label : ''} placement="right">
                  <ListItemButton
                    onClick={() =>
                      item.path
                        ? handleNavigation(item.path)
                        : toggleMenu(item.label)
                    }
                    sx={{
                      minHeight: 48,
                      px: 2.5,
                      borderRadius: 1,
                      mx: 1,
                      mb: 0.5,
                      backgroundColor:
                        (item.path && isActive(item.path)) ||
                        isParentActive(item.children)
                          ? 'rgba(66, 165, 245, 0.2)'
                          : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color:
                          (item.path && isActive(item.path)) ||
                          isParentActive(item.children)
                            ? '#42a5f5'
                            : 'rgba(255, 255, 255, 0.7)',
                        minWidth: collapsed ? 0 : 40,
                        mr: collapsed ? 0 : 2,
                        justifyContent: 'center',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {!collapsed && (
                      <>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            fontSize: '0.875rem',
                            fontWeight:
                              (item.path && isActive(item.path)) ||
                              isParentActive(item.children)
                                ? 600
                                : 400,
                          }}
                        />
                        {item.children &&
                          (openMenus.includes(item.label) ? (
                            <ExpandLess />
                          ) : (
                            <ExpandMore />
                          ))}
                      </>
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>

              {/* Submenu */}
              {item.children && !collapsed && (
                <Collapse
                  in={openMenus.includes(item.label)}
                  timeout="auto"
                  unmountOnExit
                >
                  <List component="div" disablePadding>
                    {item.children.map((child) => (
                      <ListItemButton
                        key={child.label}
                        onClick={() => child.path && handleNavigation(child.path)}
                        sx={{
                          pl: 5,
                          py: 0.75,
                          borderRadius: 1,
                          mx: 1,
                          mb: 0.25,
                          backgroundColor:
                            child.path && isActive(child.path)
                              ? 'rgba(66, 165, 245, 0.15)'
                              : 'transparent',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            color:
                              child.path && isActive(child.path)
                                ? '#42a5f5'
                                : 'rgba(255, 255, 255, 0.5)',
                            minWidth: 32,
                          }}
                        >
                          {child.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={child.label}
                          primaryTypographyProps={{
                            fontSize: '0.8125rem',
                            color:
                              child.path && isActive(child.path)
                                ? '#fff'
                                : 'rgba(255, 255, 255, 0.7)',
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              )}
            </Box>
          ))}
        </List>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* User section */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Avatar
          onClick={handleUserMenuOpen}
          sx={{
            cursor: 'pointer',
            bgcolor: '#42a5f5',
            width: 40,
            height: 40,
          }}
        >
          {session?.user?.name?.charAt(0) || 'U'}
        </Avatar>
        {!collapsed && (
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {session?.user?.name || 'User'}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
            >
              Owner
            </Typography>
          </Box>
        )}
      </Box>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleUserMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <MenuItem onClick={() => { handleUserMenuClose(); router.push('/settings/profile'); }}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => { handleUserMenuClose(); router.push('/settings'); }}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleUserMenuClose(); signOut({ callbackUrl: '/auto-login' }); }}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Drawer>
  );
}
