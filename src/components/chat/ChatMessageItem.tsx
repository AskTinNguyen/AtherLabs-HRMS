import React from 'react';
import { Box, Typography, Paper, useTheme, alpha } from '@mui/material';
import { ChatMessage } from './types';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface ChatMessageItemProps {
  message: ChatMessage;
}

interface DepartmentData {
  department: string;
  totalSalary: number;
  avgSalary: number;
  employees: number;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message }) => {
  const theme = useTheme();
  const isAI = message.sender === 'ai';

  const parseData = (content: string): DepartmentData[] | null => {
    // First, try to find a markdown table in the content
    const lines = content.split('\n');
    const tableLines = lines.filter(line => line.includes('|'));
    
    if (tableLines.length < 3) return null; // Need at least header, separator, and data
    
    const data: DepartmentData[] = [];
    let currentDepartment: DepartmentData | null = null;
    
    // Process each line
    for (const line of tableLines) {
      const cells = line.split('|').map(cell => cell.trim()).filter(Boolean);
      
      // Skip separator lines
      if (line.includes('---')) continue;
      
      // Try to extract department data
      for (const cell of cells) {
        // Look for salary values
        if (cell.includes('$')) {
          const value = parseFloat(cell.replace(/[$,]/g, ''));
          if (!isNaN(value)) {
            if (!currentDepartment) {
              currentDepartment = {
                department: '',
                totalSalary: 0,
                avgSalary: 0,
                employees: 0
              };
            }
            
            // Determine if this is total or average salary based on the row header
            const rowHeader = cells[0].toLowerCase();
            if (rowHeader.includes('total salary')) {
              currentDepartment.totalSalary = value;
            } else if (rowHeader.includes('average')) {
              currentDepartment.avgSalary = value;
            }
          }
        }
        
        // Look for employee counts
        const employeeMatch = cell.match(/(\d+)\s*employees?/i);
        if (employeeMatch && currentDepartment) {
          currentDepartment.employees = parseInt(employeeMatch[1]);
        }
        
        // Look for department names
        if (cell.includes('Department') || ['Engineering', 'Art'].includes(cell)) {
          if (currentDepartment) {
            currentDepartment.department = cell.replace(' Department', '');
          }
        }
      }
      
      // If we have a complete department entry, add it and reset
      if (currentDepartment?.department && 
          currentDepartment.totalSalary && 
          currentDepartment.employees) {
        // Calculate average if not already set
        if (!currentDepartment.avgSalary) {
          currentDepartment.avgSalary = currentDepartment.totalSalary / currentDepartment.employees;
        }
        data.push({...currentDepartment});
        currentDepartment = null;
      }
    }
    
    return data.length > 0 ? data : null;
  };

  const chartData = parseData(message.content);

  const renderCharts = (data: DepartmentData[]) => {
    // For comparison view (2 departments)
    if (data.length === 2) {
      return (
        <>
          <Box sx={{ mt: 2, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Salary & Employee Comparison
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis
                  yAxisId="salary"
                  tickFormatter={(value) => 
                    new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      maximumFractionDigits: 0,
                    }).format(value)
                  }
                />
                <YAxis
                  yAxisId="employees"
                  orientation="right"
                  tickFormatter={(value) => `${value} emp`}
                />
                <Tooltip
                  formatter={(value, name: string | number) => [
                    new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(Number(value)),
                    String(name)
                  ]}
                />
                <Legend />
                <Bar
                  yAxisId="salary"
                  dataKey="totalSalary"
                  fill={theme.palette.primary.main}
                  name="Total Salary"
                />
                <Bar
                  yAxisId="employees"
                  dataKey="employees"
                  fill={theme.palette.secondary.main}
                  name="Employee Count"
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>

          <Box sx={{ mt: 2, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Average Salary Comparison
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis
                  tickFormatter={(value) => 
                    new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      maximumFractionDigits: 0,
                    }).format(value)
                  }
                />
                <Tooltip
                  formatter={(value, name: string | number) => [
                    new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(Number(value)),
                    String(name)
                  ]}
                />
                <Bar
                  dataKey="avgSalary"
                  fill={theme.palette.info.main}
                  name="Average Salary"
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </>
      );
    }
    
    return null;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        mb: 2,
        flexDirection: isAI ? 'row' : 'row-reverse',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', pt: 0.5 }}>
        {isAI ? <SmartToyIcon color="primary" /> : <PersonIcon color="action" />}
      </Box>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          maxWidth: '80%',
          backgroundColor: isAI 
            ? alpha(theme.palette.background.paper, 0.6)
            : alpha(theme.palette.primary.main, 0.1),
          borderRadius: 2,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 8,
            [isAI ? 'left' : 'right']: -6,
            width: 0,
            height: 0,
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            [isAI ? 'borderRight' : 'borderLeft']: `6px solid ${
              isAI 
                ? alpha(theme.palette.background.paper, 0.6)
                : alpha(theme.palette.primary.main, 0.1)
            }`,
          },
        }}
      >
        <Typography
          variant="body1"
          component="div"
          sx={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: theme.palette.text.primary,
          }}
        >
          {message.content}
        </Typography>

        {chartData && renderCharts(chartData)}
        
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: isAI ? 'left' : 'right',
            mt: 1,
            opacity: 0.7,
          }}
        >
          {new Date(message.timestamp).toLocaleTimeString()}
        </Typography>
      </Paper>
    </Box>
  );
};

export default ChatMessageItem; 