import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Paper,
  TextField,
  FormHelperText,
  Snackbar,
} from '@mui/material';
import { Refresh as RefreshIcon, Upload as UploadIcon } from '@mui/icons-material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { DemoModeToggle } from '../common/DemoModeToggle';
import { ChatSettings, ModelProvider } from '../chat/types';
import { Employee } from '../../types/salary';
import { supabase } from '../../lib/supabase';

interface DataStatus {
  hasRealData: boolean;
  hasExampleData: boolean;
  hasBackupData: boolean;
  currentMode: 'real' | 'example';
}

interface SettingsProps {
  theme: string;
  onThemeChange: (theme: string) => void;
  chatSettings?: ChatSettings;
  onChatSettingsSave?: (settings: ChatSettings) => void;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

export default function Settings({ 
  theme, 
  onThemeChange,
  chatSettings,
  onChatSettingsSave,
}: SettingsProps) {
  const muiTheme = useTheme();
  const [dataStatus, setDataStatus] = useState<DataStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchDataStatus();
  }, []);

  const fetchDataStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/data-status');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch data status');
      }
      const status = await response.json();
      setDataStatus(status);
      
      // If we have example data but no real data, show a helpful message
      if (!status.hasRealData && status.hasExampleData) {
        setSnackbar({
          open: true,
          message: 'Using example data. Upload your own data file or continue with example data.',
          severity: 'info'
        });
      }
    } catch (err: any) {
      console.error('Error fetching data status:', err);
      setError(err.message || 'Failed to fetch data status');
      setSnackbar({
        open: true,
        message: err.message || 'Failed to fetch data status. Please try refreshing the page.',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataToggle = async () => {
    if (!dataStatus) return;

    setIsLoading(true);
    setError(null);

    try {
      const newMode = dataStatus.currentMode === 'real' ? 'example' : 'real';
      const response = await fetch('/api/switch-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to switch data mode');
      }

      // Update local state immediately
      setDataStatus(prevStatus => prevStatus ? {
        ...prevStatus,
        currentMode: newMode
      } : null);

      // Show success message
      setSnackbar({
        open: true,
        message: `Successfully switched to ${newMode} data. Reloading...`,
        severity: 'success'
      });

      // Wait a moment for the user to see the success message
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to switch data');
      setSnackbar({
        open: true,
        message: err.message || 'Failed to switch data',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      // Validate file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!['json', 'csv'].includes(fileExtension || '')) {
        throw new Error('Please upload either a JSON or CSV file');
      }

      // Read file content
      const content = await file.text();
      let data: { employees: Employee[] } = { employees: [] };

      if (fileExtension === 'json') {
        try {
          data = JSON.parse(content);
          // Validate JSON data structure
          if (!data || !data.employees || !Array.isArray(data.employees)) {
            throw new Error('Invalid file structure. JSON file must contain an "employees" array.');
          }
        } catch (e) {
          throw new Error('Invalid JSON file format. Please check the file content.');
        }
      } else if (fileExtension === 'csv') {
        try {
          // Split CSV content into lines and remove empty lines
          const lines = content.split('\n').filter(line => line.trim());
          if (lines.length < 2) {
            throw new Error('CSV file must contain headers and at least one data row.');
          }

          // Get headers from first line and clean them
          const headers = lines[0].split(',').map(header => 
            header.trim().replace(/^["'](.+)["']$/, '$1') // Remove quotes from headers
          );

          // Convert CSV data to employees array
          const employees: Employee[] = lines.slice(1).map((line, index) => {
            // Split by comma but handle values that might contain commas within quotes
            const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
              .map(value => value
                .trim()
                .replace(/^["'](.+)["']$/, '$1') // Remove surrounding quotes
              );

            const employee: Employee = {
              id: index + 1, // Auto-generate IDs
              name: '',
              position: '',
              specialty: '',
              department: '',
              division: '',
              salary: 0,
              termination_month: null,
              isLeadership: false
            };

            headers.forEach((header, idx) => {
              const value = values[idx];
              const headerLower = header.toLowerCase();

              // Map CSV headers to Employee properties
              switch (headerLower) {
                case 'name':
                  employee.name = value;
                  break;
                case 'position':
                  employee.position = value;
                  break;
                case 'specialty':
                case 'sub department':
                  employee.specialty = value;
                  break;
                case 'department':
                  employee.department = value;
                  break;
                case 'division':
                  employee.division = value;
                  break;
                case 'salary':
                  employee.salary = value ? Number(value.replace(/[^0-9.-]+/g, '')) : 0;
                  break;
                case 'termination_month':
                case 'termination month':
                  employee.termination_month = value ? Number(value.replace(/[^0-9.-]+/g, '')) : null;
                  break;
              }
            });

            return employee;
          });

          data = { employees };
        } catch (e) {
          throw new Error('Invalid CSV file format. Please check the file content.');
        }
      }

      // Clear existing data first
      const { error: deleteError } = await supabase
        .from('employees')
        .delete()
        .neq('id', 0); // Delete all rows

      if (deleteError) {
        throw new Error(`Failed to clear existing data: ${deleteError.message}`);
      }

      // Insert new data in batches
      const batchSize = 50;
      for (let i = 0; i < data.employees.length; i += batchSize) {
        const batch = data.employees.slice(i, i + batchSize);
        
        const { error: insertError } = await supabase
          .from('employees')
          .insert(
            batch.map(emp => ({
              name: emp.name,
              position: emp.position,
              specialty: emp.specialty,
              department: emp.department,
              division: emp.division,
              salary: emp.salary,
              termination_month: emp.termination_month,
              is_leadership: emp.isLeadership
            }))
          );

        if (insertError) {
          throw new Error(`Failed to insert batch ${Math.floor(i / batchSize) + 1}: ${insertError.message}`);
        }
      }

      // Show success message
      setSnackbar({
        open: true,
        message: 'Salary data uploaded successfully. Reloading...',
        severity: 'success'
      });

      // Wait a moment for the user to see the success message
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload data';
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  const handleModelProviderChange = (value: string) => {
    if (chatSettings && onChatSettingsSave) {
      // Clear the API key when switching providers
      onChatSettingsSave({
        ...chatSettings,
        modelProvider: value as ModelProvider,
        apiKey: '' // Clear API key when switching providers
      });
    }
  };

  const getApiKeyPlaceholder = () => {
    switch (chatSettings?.modelProvider) {
      case 'gemini':
        return 'Enter your Google AI Studio API key';
      case 'openai':
        return 'Enter your OpenAI API key';
      case 'claude':
        return 'Enter your Anthropic API key';
      default:
        return 'Enter your API key';
    }
  };

  const getApiKeyHelp = () => {
    switch (chatSettings?.modelProvider) {
      case 'gemini':
        return (
          <>
            Get your API key from{' '}
            <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
              Google AI Studio
            </a>
          </>
        );
      case 'openai':
        return (
          <>
            Get your API key from{' '}
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
              OpenAI Platform
            </a>
          </>
        );
      case 'claude':
        return (
          <>
            Get your API key from{' '}
            <a href="https://console.anthropic.com/account/keys" target="_blank" rel="noopener noreferrer">
              Anthropic Console
            </a>
          </>
        );
      default:
        return 'Please select a model provider';
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 3,
      width: '100%',
      minHeight: 'min-content', // Ensure it grows with content
    }}>
      {/* Theme Settings */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Theme Settings
        </Typography>
        <FormControl fullWidth>
          <InputLabel id="theme-label">Theme</InputLabel>
          <Select
            labelId="theme-label"
            value={theme}
            label="Theme"
            onChange={(e) => onThemeChange(e.target.value)}
            sx={{
              '& .MuiSelect-select': {
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }
            }}
          >
            <MenuItem value="light" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Brightness7Icon fontSize="small" /> Light
            </MenuItem>
            <MenuItem value="dark" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Brightness4Icon fontSize="small" /> Dark
            </MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Data Management */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Data Management
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!dataStatus?.hasRealData && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No salary data found. Please upload your data file or use example data.
          </Alert>
        )}

        <FormControl component="fieldset" fullWidth>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={dataStatus?.currentMode === 'real'}
                  onChange={handleDataToggle}
                  disabled={isLoading}
                />
              }
              label={`Using ${dataStatus?.currentMode || 'example'} data`}
            />
            <Tooltip title="Refresh status">
              <IconButton onClick={fetchDataStatus} disabled={isLoading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="file"
              accept=".json,.csv"
              id="upload-salary-data"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <label htmlFor="upload-salary-data">
              <Button
                component="span"
                variant="outlined"
                startIcon={<UploadIcon />}
                disabled={isLoading}
              >
                Upload Salary Data
              </Button>
            </label>
            {isLoading && <CircularProgress size={24} sx={{ ml: 2 }} />}
          </Box>
        </FormControl>
      </Paper>

      {/* AI Assistant Settings */}
      {chatSettings && onChatSettingsSave && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            AI Assistant Settings
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="ai-model-label">AI Model Provider</InputLabel>
            <Select
              labelId="ai-model-label"
              value={chatSettings.modelProvider}
              label="AI Model Provider"
              onChange={(e) => handleModelProviderChange(e.target.value)}
            >
              <MenuItem value="gemini">Google Gemini</MenuItem>
              <MenuItem value="openai">OpenAI</MenuItem>
              <MenuItem value="claude">Anthropic Claude</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <TextField
              label="API Key"
              type="password"
              value={chatSettings.apiKey}
              onChange={(e) => onChatSettingsSave({
                ...chatSettings,
                apiKey: e.target.value
              })}
              placeholder={getApiKeyPlaceholder()}
            />
            <FormHelperText>
              {getApiKeyHelp()}
            </FormHelperText>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={chatSettings.retainHistory}
                onChange={(e) => onChatSettingsSave({
                  ...chatSettings,
                  retainHistory: e.target.checked
                })}
              />
            }
            label="Retain Chat History"
          />

          {!chatSettings.apiKey && (
            <Alert 
              severity="info" 
              sx={{ 
                mt: 2,
                backgroundColor: muiTheme.palette.mode === 'dark'
                  ? alpha(muiTheme.palette.info.main, 0.1)
                  : alpha(muiTheme.palette.info.light, 0.1),
                '& a': {
                  color: muiTheme.palette.primary.main,
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }
              }}
            >
              Please enter your API key to use the chat feature. You can get your API key from:
              <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                <li>Gemini: <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a></li>
                <li>OpenAI: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI Platform</a></li>
                <li>Claude: <a href="https://console.anthropic.com/account/keys" target="_blank" rel="noopener noreferrer">Anthropic Console</a></li>
              </Box>
            </Alert>
          )}
        </Paper>
      )}

      {/* Demo Mode Settings */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Demo Mode Settings
        </Typography>
        <DemoModeToggle />
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 