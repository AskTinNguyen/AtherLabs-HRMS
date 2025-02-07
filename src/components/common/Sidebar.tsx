import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
  alpha,
  Badge,
  IconButton,
  Tooltip,
  Drawer,
  useMediaQuery,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuIcon from '@mui/icons-material/Menu';
import WorkIcon from '@mui/icons-material/Work';
import ChatDialog from '../chat/ChatDialog';
import Settings from '../settings/Settings';
import { SalaryData } from '../../types/salary';
import { ChatSettings } from '../chat/types';

interface SidebarProps {
  hrData: SalaryData;
  onNavigate: (section: string) => void;
  activeSection: string;
  onToggle: (expanded: boolean) => void;
  chatSettings: ChatSettings;
  onChatSettingsSave: (settings: ChatSettings) => void;
  theme: string;
  onThemeChange: (theme: string) => void;
}

const menuItems = [
  { 
    icon: DashboardIcon, 
    label: 'Dashboard',
    description: 'Overview and key metrics'
  },
  { 
    icon: PeopleIcon, 
    label: 'Employees',
    description: 'Employee salary details'
  },
  {
    icon: WorkIcon,
    label: 'Recruitment',
    description: 'Manage positions and new hires'
  },
  { 
    icon: BarChartIcon, 
    label: 'Analytics',
    description: 'Salary distribution and trends'
  },
  { 
    icon: SettingsIcon, 
    label: 'Settings',
    description: 'App preferences and demo mode'
  }
];

const Sidebar: React.FC<SidebarProps> = ({ 
  hrData, 
  onNavigate, 
  activeSection, 
  onToggle,
  chatSettings,
  onChatSettingsSave,
  theme,
  onThemeChange,
}) => {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!isMobile);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const newExpanded = !isMobile;
    setIsExpanded(newExpanded);
    onToggle(newExpanded);
  }, [isMobile]);

  const handleItemClick = (label: string) => {
    if (label === 'AI Assistant') {
      setIsChatOpen(true);
    } else {
      onNavigate(label);
      if (isMobile) {
        setIsDrawerOpen(false);
      }
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setIsDrawerOpen(!isDrawerOpen);
    } else {
      const newExpanded = !isExpanded;
      setIsExpanded(newExpanded);
      onToggle(newExpanded);
    }
  };

  const sidebarContent = (
    <Box
      sx={{
        width: isExpanded ? 280 : 72,
        height: '100%',
        backgroundColor: muiTheme.palette.mode === 'dark'
          ? alpha(muiTheme.palette.background.default, 0.95)
          : alpha(muiTheme.palette.background.paper, 0.98),
        borderRight: `1px solid ${alpha(muiTheme.palette.divider, 0.1)}`,
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(10px)',
        transition: muiTheme.transitions.create(['width'], {
          easing: muiTheme.transitions.easing.easeInOut,
          duration: muiTheme.transitions.duration.standard,
        }),
        overflow: 'hidden',
        zIndex: 1200,
      }}
    >
      <Box sx={{ 
        p: isExpanded ? '24px 24px 20px' : '24px 16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isExpanded ? 'space-between' : 'center',
        transition: muiTheme.transitions.create(['padding'], {
          easing: muiTheme.transitions.easing.easeInOut,
          duration: muiTheme.transitions.duration.standard,
        }),
      }}>
        <Box sx={{ 
          width: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0,
          transition: muiTheme.transitions.create(['width', 'opacity'], {
            easing: muiTheme.transitions.easing.easeInOut,
            duration: muiTheme.transitions.duration.standard,
          }),
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: '1.25rem',
              letterSpacing: '-0.025em',
              color: muiTheme.palette.mode === 'dark' 
                ? muiTheme.palette.common.white 
                : muiTheme.palette.text.primary,
            }}
          >
            Ather Labs HR
          </Typography>
        </Box>
        <IconButton
          onClick={toggleSidebar}
          sx={{
            padding: '8px',
            color: muiTheme.palette.text.secondary,
            transition: muiTheme.transitions.create(['transform', 'color'], {
              easing: muiTheme.transitions.easing.easeInOut,
              duration: muiTheme.transitions.duration.standard,
            }),
            transform: isExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
            '&:hover': {
              color: muiTheme.palette.text.primary,
              backgroundColor: alpha(muiTheme.palette.text.primary, 0.05),
            },
          }}
        >
          {isExpanded ? <MenuOpenIcon /> : <MenuIcon />}
        </IconButton>
      </Box>

      <List sx={{ 
        width: '100%', 
        p: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}>
        {menuItems.map((item) => (
          <ListItem 
            key={item.label} 
            disablePadding
          >
            <Tooltip 
              title={!isExpanded ? item.label : ''} 
              placement="right"
              arrow
              TransitionProps={{ timeout: 600 }}
            >
              <ListItemButton
                onClick={() => handleItemClick(item.label)}
                sx={{
                  borderRadius: '8px',
                  minHeight: 48,
                  px: isExpanded ? 2 : 1.5,
                  py: 1.25,
                  justifyContent: isExpanded ? 'initial' : 'center',
                  backgroundColor: activeSection === item.label
                    ? alpha(muiTheme.palette.primary.main, muiTheme.palette.mode === 'dark' ? 0.2 : 0.08)
                    : 'transparent',
                  color: activeSection === item.label
                    ? muiTheme.palette.primary.main
                    : muiTheme.palette.text.primary,
                  '&:hover': {
                    backgroundColor: activeSection === item.label
                      ? alpha(muiTheme.palette.primary.main, muiTheme.palette.mode === 'dark' ? 0.25 : 0.12)
                      : alpha(muiTheme.palette.primary.main, muiTheme.palette.mode === 'dark' ? 0.1 : 0.04),
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: isExpanded ? 32 : 'auto',
                    color: activeSection === item.label
                      ? muiTheme.palette.primary.main
                      : muiTheme.palette.text.secondary,
                    mr: isExpanded ? 2.5 : 0,
                    justifyContent: 'center',
                    '& .MuiSvgIcon-root': {
                      fontSize: '1.25rem',
                    }
                  }}
                >
                  <item.icon />
                </ListItemIcon>
                <Box sx={{ 
                  width: isExpanded ? 'auto' : 0,
                  opacity: isExpanded ? 1 : 0,
                  transition: muiTheme.transitions.create(['width', 'opacity'], {
                    easing: muiTheme.transitions.easing.easeInOut,
                    duration: muiTheme.transitions.duration.standard,
                  }),
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}>
                  <ListItemText 
                    primary={item.label}
                    secondary={item.description}
                    primaryTypographyProps={{
                      sx: {
                        fontSize: '0.9375rem',
                        fontWeight: activeSection === item.label ? 600 : 500,
                        color: activeSection === item.label 
                          ? muiTheme.palette.primary.main 
                          : muiTheme.palette.mode === 'dark'
                            ? muiTheme.palette.common.white
                            : muiTheme.palette.text.primary,
                        mb: 0.25,
                        lineHeight: 1.2,
                      }
                    }}
                    secondaryTypographyProps={{
                      sx: {
                        fontSize: '0.8125rem',
                        color: muiTheme.palette.text.secondary,
                        lineHeight: 1.4,
                        mt: 0.5,
                      }
                    }}
                    sx={{
                      my: 0,
                      '& .MuiListItemText-secondary': {
                        mt: 0.5,
                      }
                    }}
                  />
                </Box>
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const mobileBottomNav = (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1200,
        display: { xs: 'block', sm: 'none' }
      }} 
      elevation={3}
    >
      <BottomNavigation
        value={activeSection}
        onChange={(_, newValue) => handleItemClick(newValue)}
        sx={{
          height: 64,
          backgroundColor: muiTheme.palette.mode === 'dark'
            ? alpha(muiTheme.palette.background.default, 0.95)
            : alpha(muiTheme.palette.background.paper, 0.98),
          backdropFilter: 'blur(10px)',
        }}
      >
        {menuItems.map((item) => (
          <BottomNavigationAction
            key={item.label}
            label={item.label}
            value={item.label}
            icon={<item.icon />}
            sx={{
              color: activeSection === item.label
                ? muiTheme.palette.primary.main
                : muiTheme.palette.text.secondary,
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.75rem',
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );

  return (
    <>
      {!isMobile ? (
        // Desktop sidebar
        <Box
          sx={{
            width: isExpanded ? 280 : 72,
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: 1300,
          }}
        >
          {sidebarContent}
        </Box>
      ) : (
        // Mobile drawer and bottom navigation
        <>
          <Drawer
            anchor="left"
            open={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            sx={{
              '& .MuiDrawer-paper': {
                width: 280,
                boxSizing: 'border-box',
                zIndex: 1300,
              },
            }}
          >
            {sidebarContent}
          </Drawer>
          {mobileBottomNav}
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              zIndex: 1300,
              p: 1,
              display: { xs: 'none', sm: 'block' }
            }}
          >
            <IconButton
              onClick={toggleSidebar}
              sx={{
                color: muiTheme.palette.text.secondary,
                backgroundColor: alpha(muiTheme.palette.background.paper, 0.8),
                backdropFilter: 'blur(8px)',
                '&:hover': {
                  backgroundColor: alpha(muiTheme.palette.background.paper, 0.9),
                },
              }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </>
      )}

      <ChatDialog 
        open={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        hrData={hrData}
        settings={chatSettings}
        onSettingsSave={onChatSettingsSave}
        isSidebarExpanded={isExpanded}
      />
    </>
  );
};

export default Sidebar; 