import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  useTheme,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  alpha,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { CustomDashboard, DashboardComponent } from '../../types/dashboard';
import { Employee } from '../../types/salary';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import DataObjectIcon from '@mui/icons-material/DataObject';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface AIDashboardProps {
  dashboard: CustomDashboard;
  data: Employee[];
  sidebarExpanded?: boolean;
  onReturnToStandard?: () => void;
}

const AIDashboard: React.FC<AIDashboardProps> = ({
  dashboard,
  data,
  sidebarExpanded = false,
  onReturnToStandard
}) => {
  const theme = useTheme();
  const [showRawData, setShowRawData] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  // Enhanced filtering logic
  const filteredData = useMemo(() => {
    const focus = dashboard?.focus;
    if (!focus) return data;

    return data.filter(emp => {
      // Department filter
      if (focus.department && 
          emp.department.toLowerCase() !== focus.department.toLowerCase()) {
        return false;
      }

      // Specialty filter
      if (focus.specialty && 
          emp.specialty.toLowerCase() !== focus.specialty.toLowerCase()) {
        return false;
      }

      // Position filter
      if (focus.position && 
          emp.position.toLowerCase() !== focus.position.toLowerCase()) {
        return false;
      }

      // Division filter
      if (focus.division && 
          emp.division.toLowerCase() !== focus.division.toLowerCase()) {
        return false;
      }

      // Salary range filter
      if (focus.salaryRange) {
        const { min, max } = focus.salaryRange;
        if (emp.salary < min || emp.salary > max) {
          return false;
        }
      }

      return true;
    });
  }, [data, dashboard?.focus]);

  // Update dashboard title to reflect all active filters
  const dashboardTitle = useMemo(() => {
    if (!dashboard.focus) return dashboard.name;

    const filters: string[] = [];
    
    if (dashboard.focus.department) {
      filters.push(`${dashboard.focus.department} Department`);
    }
    if (dashboard.focus.specialty) {
      filters.push(`${dashboard.focus.specialty} Specialty`);
    }
    if (dashboard.focus.position) {
      filters.push(`${dashboard.focus.position} Position`);
    }
    if (dashboard.focus.division) {
      filters.push(`${dashboard.focus.division} Division`);
    }
    if (dashboard.focus.salaryRange) {
      filters.push(`Salary ${new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(dashboard.focus.salaryRange.min)} - ${new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(dashboard.focus.salaryRange.max)}`);
    }

    return filters.length > 0 
      ? `${filters.join(' | ')} - ${dashboard.name}`
      : dashboard.name;
  }, [dashboard.name, dashboard.focus]);

  // Add active filters display
  const renderActiveFilters = () => {
    if (!dashboard.focus) return null;

    return (
      <Box sx={{ 
        display: 'flex', 
        gap: 1, 
        flexWrap: 'wrap',
        mt: 1 
      }}>
        {Object.entries(dashboard.focus).map(([key, value]) => {
          if (!value) return null;
          
          let label = '';
          switch (key) {
            case 'salaryRange':
              label = `Salary: ${new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0
              }).format(value.min)} - ${new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0
              }).format(value.max)}`;
              break;
            default:
              label = `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`;
          }

          return (
            <Chip
              key={key}
              label={label}
              size="small"
              color="primary"
              variant="outlined"
            />
          );
        })}
      </Box>
    );
  };

  const processChartData = (data: Employee[], config: any) => {
    // Use the department from the focus object
    const department = dashboard?.focus?.department;
    const departmentData = department ? 
      data.filter(emp => emp.department.toLowerCase() === department.toLowerCase()) :
      data;

    return departmentData.reduce((acc: any[], emp) => {
      const key = config.dataSource.groupBy ? emp[config.dataSource.groupBy as keyof Employee] : 'Total';
      const existingEntry = acc.find(item => item.name === key);
      
      let value = 0;
      switch (config.dataSource.metric) {
        case 'salary':
          value = emp.salary;
          break;
        case 'employees':
          value = 1;
          break;
        default:
          value = 1;
      }

      if (existingEntry) {
        switch (config.dataSource.calculation) {
          case 'average':
            existingEntry.count = (existingEntry.count || 0) + 1;
            existingEntry.value = (existingEntry.value + value);
            existingEntry.displayValue = existingEntry.value / existingEntry.count;
            break;
          case 'sum':
          default:
            existingEntry.value += value;
            existingEntry.displayValue = existingEntry.value;
        }
      } else {
        acc.push({
          name: key,
          value: value,
          displayValue: value,
          count: 1
        });
      }
      
      return acc;
    }, []);
  };

  const handleCopyData = useCallback(async () => {
    const rawData = JSON.stringify({
      dashboard,
      dataSnapshot: data.slice(0, 5),
      totalRecords: data.length
    }, null, 2);
    
    try {
      await navigator.clipboard.writeText(rawData);
      setShowCopySuccess(true);
    } catch (err) {
      console.error('Failed to copy data:', err);
    }
  }, [dashboard, data]);

  const renderChart = (component: DashboardComponent) => {
    const { chartType, dataSource, visualization } = component.config;
    
    // Default colors if visualization colors are not provided
    const defaultColors = ['#4CAF50', '#2196F3', '#FFC107', '#E91E63', '#9C27B0'];
    const colors = visualization?.colors || defaultColors;
    
    // Process data based on dataSource configuration
    const processedData = processChartData(data, component.config);

    const formatValue = (value: number) => {
      if (dataSource.metric === 'salary') {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0
        }).format(value);
      }
      return value.toLocaleString();
    };

    switch (chartType) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={processedData}
                dataKey="displayValue"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, value }) => `${name}: ${formatValue(value)}`}
              >
                {processedData.map((entry, index) => (
                  <Cell 
                    key={entry.name}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              {visualization?.showLegend && <Legend />}
              {visualization?.showValues && <Tooltip formatter={(value) => formatValue(Number(value))} />}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'bar':
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatValue(value)} />
              {visualization?.showLegend && <Legend />}
              {visualization?.showValues && 
                <Tooltip 
                  formatter={(value) => formatValue(Number(value))}
                  labelFormatter={(label) => String(label)}
                />
              }
              <Bar
                dataKey="displayValue"
                fill={colors[0]}
                name={dataSource.metric}
              />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  const renderMetric = (component: DashboardComponent) => {
    const { dataSource } = component.config;
    const value = data.reduce((sum, emp) => {
      if (dataSource.metric === 'salary') {
        return sum + emp.salary;
      }
      return sum + 1;
    }, 0);

    return (
      <Typography variant="h4" component="div">
        {dataSource.metric === 'salary'
          ? new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 0
            }).format(value)
          : value.toLocaleString()}
      </Typography>
    );
  };

  const renderTable = (component: DashboardComponent) => {
    const { dataSource } = component.config;
    const tableData = filteredData.map(emp => ({
      name: emp.name,
      department: emp.department,
      position: emp.position,
      salary: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(emp.salary)
    }));

    return (
      <Box sx={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '8px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Department</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Position</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>Salary</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr key={index}>
                <td style={{ padding: '8px', borderTop: '1px solid rgba(224, 224, 224, 1)' }}>
                  {row.name}
                </td>
                <td style={{ padding: '8px', borderTop: '1px solid rgba(224, 224, 224, 1)' }}>
                  {row.department}
                </td>
                <td style={{ padding: '8px', borderTop: '1px solid rgba(224, 224, 224, 1)' }}>
                  {row.position}
                </td>
                <td style={{ padding: '8px', borderTop: '1px solid rgba(224, 224, 224, 1)', textAlign: 'right' }}>
                  {row.salary}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    );
  };

  return (
    <Box sx={{ 
      width: '100%',
      height: 'calc(100vh - 180px)', // Adjust for header/footer space
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Fixed Header */}
      <Box sx={{ 
        p: 3,
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        flexShrink: 0, // Prevent header from shrinking
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 2,
        }}>
          <Box>
            <Typography variant="h5" gutterBottom sx={{ mb: 1 }}>
              {dashboardTitle}
            </Typography>
            {renderActiveFilters()}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              flexWrap: 'wrap'
            }}>
              <Chip
                icon={<SmartToyIcon />}
                label="AI Generated Dashboard"
                color="primary"
                size="small"
              />
              <Button
                startIcon={<DataObjectIcon />}
                onClick={() => setShowRawData(true)}
                variant="outlined"
                size="small"
              >
                Show Raw Data
              </Button>
              {onReturnToStandard && (
                <Button
                  startIcon={<KeyboardReturnIcon />}
                  onClick={onReturnToStandard}
                  variant="outlined"
                  size="small"
                >
                  Return to Standard Dashboard
                </Button>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {dashboard.description}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ 
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        px: 3,
        py: 3,
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: alpha(theme.palette.text.primary, 0.1),
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: alpha(theme.palette.text.primary, 0.2),
          }
        }
      }}>
        <Grid container spacing={3}>
          {dashboard.components.map(component => (
            <Grid
              key={component.id}
              item
              xs={12}
              md={component.layout.w}
              sx={{
                minHeight: component.layout.h * 100,
              }}
            >
              <Paper 
                sx={{ 
                  p: 2, 
                  height: '100%',
                  minHeight: 300,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  {component.config.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {component.config.description}
                </Typography>
                
                <Box sx={{ flex: 1, position: 'relative' }}>
                  {component.type === 'chart' && renderChart(component)}
                  {component.type === 'metric' && renderMetric(component)}
                  {component.type === 'table' && renderTable(component)}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Raw Data Dialog */}
      <Dialog
        open={showRawData}
        onClose={() => setShowRawData(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: 1,
        }}>
          <Typography variant="h6">Dashboard Raw Data</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<ContentCopyIcon />}
              onClick={handleCopyData}
              size="small"
              variant="outlined"
            >
              Copy JSON
            </Button>
            <IconButton
              aria-label="close"
              onClick={() => setShowRawData(false)}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ 
            p: 2, 
            backgroundColor: alpha(theme.palette.background.paper, 0.5),
            borderRadius: 1,
            overflow: 'auto',
            maxHeight: '70vh'
          }}>
            <pre style={{ 
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: '0.875rem',
              fontFamily: 'monospace'
            }}>
              {JSON.stringify({
                dashboard,
                dataSnapshot: data.slice(0, 5),
                totalRecords: data.length
              }, null, 2)}
            </pre>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRawData(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Copy Success Snackbar */}
      <Snackbar
        open={showCopySuccess}
        autoHideDuration={3000}
        onClose={() => setShowCopySuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setShowCopySuccess(false)} 
          severity="success"
          sx={{ width: '100%' }}
        >
          JSON data copied to clipboard!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AIDashboard; 