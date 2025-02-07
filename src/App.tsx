import React, { useState, useCallback, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Snackbar,
  Alert,
  IconButton,
  useMediaQuery,
  Tooltip,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormHelperText,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Button,
  CircularProgress,
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import SecurityIcon from '@mui/icons-material/Security';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { SalaryData, Employee } from './types/salary';
import SalaryTable from './components/salary/SalaryTable';
import SalaryChart from './components/salary/SalaryChart';
import SalaryDashboard from './components/salary/SalaryDashboard';
import { DemoModeToggle } from './components/common/DemoModeToggle';
import { DemoModeProvider } from './context/DemoModeContext';
import { saveSalaryData, loadSalaryData } from './services/salaryService';
import { saveSalaryToFiles } from './services/ai';
import { transformEmployeesData } from './utils/demoDataTransform';
import Sidebar from './components/common/Sidebar';
import { alpha } from '@mui/material/styles';
import { ChatSettings, ModelProvider } from './components/chat/types';
import SalaryMonthlyChart from './components/salary/SalaryMonthlyChart';
import DivisionSalaryChart from './components/salary/DivisionSalaryChart';
import SalaryRangeChart from './components/salary/SalaryRangeChart';
import Settings from './components/settings/Settings';
import FloatingAIButton from './components/chat/FloatingAIButton';
import ChatDialog from './components/chat/ChatDialog';
import { CustomDashboard } from './types/dashboard';
import RecruitmentDashboard from './components/recruitment/RecruitmentDashboard';
import CustomDashboardView from './components/dashboard/CustomDashboardView';
import { loadAllRecruitmentData } from './services/recruitmentService';
import { Position } from './types/recruitment';

const App = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<'light' | 'dark'>(prefersDarkMode ? 'dark' : 'light');
  const [showDemoSettings, setShowDemoSettings] = useState(false);
  const [activeSection, setActiveSection] = useState('Dashboard');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [data, setData] = useState<SalaryData>({ employees: [] });
  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    apiKey: '',
    modelProvider: 'gemini',
    theme: mode,
    retainHistory: true,
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [analyticsTab, setAnalyticsTab] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentDashboard, setCurrentDashboard] = useState<CustomDashboard | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);
  const [positionsError, setPositionsError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const savedData = await loadSalaryData();
        setData(savedData);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load salary data. Please try refreshing the page.',
          severity: 'error'
        });
      }
    };
    loadInitialData();
  }, []);

  // Update chat settings when theme changes
  useEffect(() => {
    setChatSettings(prev => ({
      ...prev,
      theme: mode
    }));
  }, [mode]);

  // Load recruitment data
  useEffect(() => {
    const loadPositions = async () => {
      try {
        setIsLoadingPositions(true);
        setPositionsError(null);
        const data = await loadAllRecruitmentData();
        setPositions(data.positions);
      } catch (err) {
        console.error('Error loading positions:', err);
        setPositionsError('Failed to load recruitment data');
      } finally {
        setIsLoadingPositions(false);
      }
    };

    loadPositions();
  }, []);

  const handleDataUpdate = useCallback(async (newEmployees: Employee[]) => {
    try {
      // Update state immediately for UI responsiveness
      setData({ employees: newEmployees });
      
      // Save to localStorage
      try {
        await saveSalaryData(newEmployees);
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
        throw new Error('Failed to save to local storage. Your changes may not persist after refresh.');
      }
      
      // Save to files
      try {
        await saveSalaryToFiles(newEmployees);
      } catch (error) {
        console.error('Failed to save to files:', error);
        throw new Error('Failed to save to server. Your changes are saved locally but not synchronized.');
      }
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Changes saved successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to save changes:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'An unknown error occurred while saving changes',
        severity: 'error'
      });
      
      // Revert the state if both saves failed
      if (error instanceof Error && error.message.includes('local storage')) {
        try {
          const savedData = await loadSalaryData();
          setData(savedData);
        } catch {
          // If we can't load the saved data, keep the current state
        }
      }
    }
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'light' ? 'hsl(47.9, 95.8%, 53.1%)' : 'hsl(47.9, 95.8%, 53.1%)',
          },
          secondary: {
            main: mode === 'light' ? 'hsl(60, 4.8%, 95.9%)' : 'hsl(12, 6.5%, 15.1%)',
          },
          background: {
            default: mode === 'light' ? 'hsl(0, 0%, 100%)' : 'hsl(20, 14.3%, 4.1%)',
            paper: mode === 'light' ? 'hsl(0, 0%, 100%)' : 'hsl(20, 14.3%, 4.1%)',
          },
          text: {
            primary: mode === 'light' ? 'hsl(20, 14.3%, 4.1%)' : 'hsl(60, 9.1%, 97.8%)',
            secondary: mode === 'light' ? 'hsl(25, 5.3%, 44.7%)' : 'hsl(24, 5.4%, 63.9%)',
          },
          error: {
            main: mode === 'light' ? 'hsl(0, 84.2%, 60.2%)' : 'hsl(0, 62.8%, 30.6%)',
          },
          divider: mode === 'light' ? 'hsl(20, 5.9%, 90%)' : 'hsl(12, 6.5%, 15.1%)',
        },
        shape: {
          borderRadius: 4,
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                backgroundColor: mode === 'light' ? 'hsl(0, 0%, 100%)' : 'hsl(20, 14.3%, 4.1%)',
                '--chart-1': mode === 'light' ? 'hsl(12, 76%, 61%)' : 'hsl(220, 70%, 50%)',
                '--chart-2': mode === 'light' ? 'hsl(173, 58%, 39%)' : 'hsl(160, 60%, 45%)',
                '--chart-3': mode === 'light' ? 'hsl(197, 37%, 24%)' : 'hsl(30, 80%, 55%)',
                '--chart-4': mode === 'light' ? 'hsl(43, 74%, 66%)' : 'hsl(280, 65%, 60%)',
                '--chart-5': mode === 'light' ? 'hsl(27, 87%, 67%)' : 'hsl(340, 75%, 55%)',
              },
            },
          },
        },
      }),
    [mode],
  );

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const handleNavigation = (section: string) => {
    setActiveSection(section);
    if (section === 'Settings') {
      setShowDemoSettings(true);
    } else {
      setShowDemoSettings(false);
    }
  };

  const handleSidebarToggle = (expanded: boolean) => {
    setIsSidebarExpanded(expanded);
  };

  const handleChatSettingsSave = (newSettings: ChatSettings) => {
    setChatSettings(newSettings);
  };

  const handleModelProviderChange = (value: string) => {
    setChatSettings(prev => ({
      ...prev,
      modelProvider: value as ModelProvider
    }));
  };

  const handleAnalyticsTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setAnalyticsTab(newValue);
  };

  const handleThemeChange = (newTheme: string) => {
    setMode(newTheme as 'light' | 'dark');
  };

  const handleDashboardGenerated = (dashboard: CustomDashboard) => {
    setCurrentDashboard(dashboard);
    setActiveSection('Dashboard'); // Switch to dashboard view
    setSnackbar({
      open: true,
      message: 'Dashboard generated successfully!',
      severity: 'success'
    });
  };

  const exportToCSV = useCallback(() => {
    if (!data.employees.length) return;

    // Define CSV headers based on Employee interface
    const headers = ['ID', 'Name', 'Position', 'Specialty', 'Department', 'Division', 'Salary', 'Termination Month'];
    
    // Convert data to CSV format
    const csvContent = [
      headers.join(','),
      ...data.employees.map(employee => [
        employee.id,
        `"${employee.name}"`,
        `"${employee.position}"`,
        `"${employee.specialty}"`,
        `"${employee.department}"`,
        `"${employee.division}"`,
        employee.salary,
        employee.termination_month || ''
      ].join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `employees_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSnackbar({
      open: true,
      message: 'CSV file downloaded successfully',
      severity: 'success'
    });
  }, [data.employees]);

  const renderContent = () => {
    const contentStyles = {
      width: '100%',
      px: 0,
      pb: { xs: 10, sm: 3 },
      transition: theme.transitions.create(['padding'], {
        easing: theme.transitions.easing.easeInOut,
        duration: theme.transitions.duration.standard,
      }),
    };

    switch (activeSection) {
      case 'Settings':
        return (
          <Box sx={{
            ...contentStyles,
            height: 'calc(100vh - 100px)', // Account for header and padding
            overflow: 'hidden', // Prevent double scrollbars
          }}>
            <Box sx={{
              height: '100%',
              overflowY: 'auto',
              pr: 2, // Add padding for the scrollbar
            }}>
              <Settings
                theme={mode}
                onThemeChange={handleThemeChange}
                chatSettings={chatSettings}
                onChatSettingsSave={handleChatSettingsSave}
              />
            </Box>
          </Box>
        );
      case 'Dashboard':
        return currentDashboard ? (
          <CustomDashboardView dashboard={currentDashboard} data={data.employees} />
        ) : (
          <SalaryDashboard 
            data={data.employees}
            positions={positions}
            sidebarExpanded={isSidebarExpanded}
            aiDashboard={currentDashboard}
            onReturnToStandard={() => setCurrentDashboard(null)}
          />
        );
      case 'Recruitment':
        return <RecruitmentDashboard />;
      case 'Employees':
        return (
          <Box sx={contentStyles}>
            <Paper sx={{ 
              p: { xs: 1, sm: 2 }, 
              maxWidth: '100%', 
              width: '100%',
              overflow: 'hidden',
              '& > *': { width: '100%', maxWidth: '100%' }
            }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2
              }}>
                <Typography variant="h5">
                  Employee Details
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={exportToCSV}
                  disabled={!data.employees.length}
                >
                  Export to CSV
                </Button>
              </Box>
              <SalaryTable 
                data={data.employees} 
                onDataUpdate={handleDataUpdate}
                sidebarExpanded={isSidebarExpanded}
              />
            </Paper>
          </Box>
        );
      case 'Analytics':
        return (
          <Box sx={contentStyles}>
            <Paper sx={{ 
              p: { xs: 1, sm: 2 }, 
              maxWidth: '100%', 
              width: '100%',
              overflow: 'hidden',
              '& > *': { width: '100%', maxWidth: '100%' }
            }}>
              <Typography variant="h5" gutterBottom>
                Salary Distribution
              </Typography>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs 
                  value={analyticsTab} 
                  onChange={handleAnalyticsTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab label="Monthly Trends" />
                  <Tab label="Division Analysis" />
                  <Tab label="Salary Ranges" />
                </Tabs>
              </Box>
              <Box sx={{ 
                width: '100%',
                overflow: 'hidden',
                mt: 2 
              }}>
                {analyticsTab === 0 && <SalaryMonthlyChart data={data.employees} />}
                {analyticsTab === 1 && <DivisionSalaryChart data={data.employees} />}
                {analyticsTab === 2 && <SalaryRangeChart data={data.employees} />}
              </Box>
            </Paper>
          </Box>
        );
      default:
        return <SalaryTable data={data.employees} onDataUpdate={handleDataUpdate} />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DemoModeProvider>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar
            hrData={data}
            onNavigate={handleNavigation}
            activeSection={activeSection}
            onToggle={handleSidebarToggle}
            chatSettings={chatSettings}
            onChatSettingsSave={handleChatSettingsSave}
            theme={mode}
            onThemeChange={handleThemeChange}
          />
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              height: '100vh',
              pl: { 
                xs: 2,
                sm: 'calc(72px + 24px)',
                lg: isSidebarExpanded ? 'calc(280px + 24px)' : 'calc(72px + 24px)'
              },
              pr: { xs: 2, sm: 3 },
              py: 3,
              transition: theme.transitions.create(['padding-left'], {
                easing: theme.transitions.easing.easeInOut,
                duration: theme.transitions.duration.standard,
              }),
              overflowY: 'auto',
            }}
          >
            {/* Header with controls */}
            <Box sx={{ 
              mb: 4, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              transition: theme.transitions.create(['opacity', 'transform'], {
                easing: theme.transitions.easing.easeInOut,
                duration: theme.transitions.duration.standard,
              }),
            }}>
              <Typography 
                variant="h4" 
                component="h1"
                sx={{
                  transition: theme.transitions.create(['opacity'], {
                    easing: theme.transitions.easing.easeInOut,
                    duration: theme.transitions.duration.standard,
                  }),
                }}
              >
                {activeSection}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton 
                  onClick={toggleColorMode} 
                  color="inherit"
                  sx={{ 
                    transition: theme.transitions.create(['background-color', 'transform'], {
                      easing: theme.transitions.easing.easeInOut,
                      duration: theme.transitions.duration.shorter,
                    }),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.text.primary, 0.05),
                      transform: 'rotate(180deg)',
                    }
                  }}
                >
                  {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
              </Box>
            </Box>

            {/* Main Content */}
            <Box 
              sx={{ 
                position: 'relative',
                flexGrow: 1,
                minWidth: 0,
                overflow: 'hidden',
                '& .MuiTabs-root': {
                  minHeight: 48,
                  width: '100%',
                  '& .MuiTabs-scroller': {
                    width: '100%',
                  },
                  '& .MuiTabs-flexContainer': {
                    width: '100%',
                  },
                  '& .MuiTab-root': {
                    minWidth: 'auto',
                    flex: 1,
                    transition: theme.transitions.create(['width', 'min-width'], {
                      easing: theme.transitions.easing.easeInOut,
                      duration: theme.transitions.duration.standard,
                    }),
                  },
                  '& .MuiTabs-indicator': {
                    transition: theme.transitions.create(['all'], {
                      easing: theme.transitions.easing.easeInOut,
                      duration: theme.transitions.duration.standard,
                    }),
                  }
                },
                transition: theme.transitions.create(['width', 'opacity', 'transform'], {
                  easing: theme.transitions.easing.easeInOut,
                  duration: theme.transitions.duration.standard,
                }),
                opacity: 1,
                transform: 'translateY(0)',
                '&.fade-enter': {
                  opacity: 0,
                  transform: 'translateY(10px)',
                },
                '&.fade-enter-active': {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              }}
            >
              {renderContent()}
            </Box>
          </Box>
          <ChatDialog
            open={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            hrData={data}
            settings={chatSettings}
            onSettingsSave={handleChatSettingsSave}
            isSidebarExpanded={isSidebarExpanded}
            onDashboardGenerated={handleDashboardGenerated}
          />
          <FloatingAIButton
            onClick={() => setIsChatOpen(true)}
            expanded={isSidebarExpanded}
          />
          <Snackbar 
            open={snackbar.open} 
            autoHideDuration={6000} 
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert 
              onClose={handleCloseSnackbar} 
              severity={snackbar.severity}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </DemoModeProvider>
    </ThemeProvider>
  );
};

export default App; 