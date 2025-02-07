import React, { useMemo } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  useTheme
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Employee } from '../../types/salary';

interface OrganizationalStructureAnalysisProps {
  data: Employee[];
}

interface DepartmentMetrics {
  department: string;
  employeeCount: number;
  totalSalary: number;
  averageSalary: number;
}

interface LeadershipMetrics {
  division: string;
  totalEmployees: number;
  leadershipCount: number;
  leadershipDensity: number;
  averageLeadershipSalary: number;
}

interface SpecialtyMetrics {
  specialty: string;
  count: number;
  averageSalary: number;
  totalSalary: number;
}

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

export default function OrganizationalStructureAnalysis({ data }: OrganizationalStructureAnalysisProps) {
  const theme = useTheme();

  // Department Size vs. Salary Budget Analysis
  const departmentMetrics = useMemo(() => {
    const metrics: Record<string, DepartmentMetrics> = {};
    
    data.forEach(employee => {
      if (!metrics[employee.department]) {
        metrics[employee.department] = {
          department: employee.department,
          employeeCount: 0,
          totalSalary: 0,
          averageSalary: 0
        };
      }
      
      metrics[employee.department].employeeCount++;
      metrics[employee.department].totalSalary += employee.salary;
    });

    // Calculate averages
    Object.values(metrics).forEach(dept => {
      dept.averageSalary = Math.round(dept.totalSalary / dept.employeeCount);
    });

    return Object.values(metrics);
  }, [data]);

  // Leadership Density Analysis
  const leadershipMetrics = useMemo(() => {
    const metrics: Record<string, LeadershipMetrics> = {};
    
    data.forEach(employee => {
      if (!metrics[employee.division]) {
        metrics[employee.division] = {
          division: employee.division,
          totalEmployees: 0,
          leadershipCount: 0,
          leadershipDensity: 0,
          averageLeadershipSalary: 0
        };
      }
      
      metrics[employee.division].totalEmployees++;
      
      // Check if position indicates leadership role
      const isLeader = ['director', 'head', 'lead', 'chief', 'manager', 'supervisor']
        .some(term => employee.position.toLowerCase().includes(term));
      
      if (isLeader) {
        metrics[employee.division].leadershipCount++;
        metrics[employee.division].averageLeadershipSalary += employee.salary;
      }
    });

    // Calculate leadership density and averages
    Object.values(metrics).forEach(div => {
      div.leadershipDensity = div.leadershipCount / div.totalEmployees;
      if (div.leadershipCount > 0) {
        div.averageLeadershipSalary = Math.round(div.averageLeadershipSalary / div.leadershipCount);
      }
    });

    return Object.values(metrics);
  }, [data]);

  // Specialty Distribution Analysis
  const specialtyMetrics = useMemo(() => {
    const metrics: Record<string, SpecialtyMetrics> = {};
    
    data.forEach(employee => {
      if (!metrics[employee.specialty]) {
        metrics[employee.specialty] = {
          specialty: employee.specialty,
          count: 0,
          averageSalary: 0,
          totalSalary: 0
        };
      }
      
      metrics[employee.specialty].count++;
      metrics[employee.specialty].totalSalary += employee.salary;
    });

    // Calculate averages
    Object.values(metrics).forEach(spec => {
      spec.averageSalary = Math.round(spec.totalSalary / spec.count);
    });

    return Object.values(metrics);
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: theme.palette.background.paper,
          padding: '10px',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '4px',
          color: theme.palette.text.primary,
          boxShadow: theme.shadows[2]
        }}>
          <p style={{ margin: '0', fontWeight: 'bold', color: theme.palette.text.primary }}>
            {data.department || data.division || data.specialty}
          </p>
          {data.employeeCount && (
            <p style={{ margin: '5px 0', color: theme.palette.text.secondary }}>
              Employees: {data.employeeCount}
            </p>
          )}
          {data.totalSalary && (
            <p style={{ margin: '5px 0', color: theme.palette.text.secondary }}>
              Total Salary: ${data.totalSalary.toLocaleString()}
            </p>
          )}
          {data.averageSalary && (
            <p style={{ margin: '5px 0', color: theme.palette.text.secondary }}>
              Average Salary: ${data.averageSalary.toLocaleString()}
            </p>
          )}
          {data.leadershipCount !== undefined && (
            <>
              <p style={{ margin: '5px 0', color: theme.palette.text.secondary }}>
                Leadership Count: {data.leadershipCount}
              </p>
              <p style={{ margin: '5px 0', color: theme.palette.text.secondary }}>
                Leadership Density: {(data.leadershipDensity * 100).toFixed(1)}%
              </p>
              <p style={{ margin: '5px 0', color: theme.palette.text.secondary }}>
                Avg Leadership Salary: ${data.averageLeadershipSalary.toLocaleString()}
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Box 
      sx={{ 
        width: '100%',
        height: 'calc(100vh - 250px)',
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: theme.palette.background.default,
        },
        '&::-webkit-scrollbar-thumb': {
          background: theme.palette.divider,
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: theme.palette.action.hover,
        }
      }}
    >
      <Box sx={{ 
        p: 2, 
        pb: 8,
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Grid container spacing={3}>
          {/* Department Size vs. Salary Budget */}
          <Grid item xs={12}>
            <Paper 
              sx={{ 
                p: 2,
                height: '400px',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography variant="h6" gutterBottom>
                Department Size vs. Salary Budget
              </Typography>
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="department"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                    />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="employeeCount"
                      fill="var(--chart-1)"
                      name="Employee Count"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="totalSalary"
                      fill="var(--chart-2)"
                      name="Total Salary"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Leadership Density by Division */}
          <Grid item xs={12} md={6}>
            <Paper 
              sx={{ 
                p: 2,
                height: '400px',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography variant="h6" gutterBottom>
                Leadership Density by Division
              </Typography>
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="totalEmployees"
                      name="Total Employees"
                      label={{ value: 'Total Employees', position: 'bottom' }}
                    />
                    <YAxis
                      dataKey="leadershipDensity"
                      name="Leadership Density"
                      label={{ value: 'Leadership Density', angle: -90, position: 'insideLeft' }}
                      tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                    />
                    <ZAxis
                      dataKey="averageLeadershipSalary"
                      range={[50, 400]}
                      name="Avg Leadership Salary"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Scatter
                      name="Divisions"
                      data={leadershipMetrics}
                      fill="var(--chart-3)"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Specialty Distribution */}
          <Grid item xs={12} md={6}>
            <Paper 
              sx={{ 
                p: 2,
                height: '400px',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography variant="h6" gutterBottom>
                Specialty Distribution
              </Typography>
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={specialtyMetrics}
                      dataKey="count"
                      nameKey="specialty"
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {specialtyMetrics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Projected Annual Impact Summary */}
          <Grid item xs={12}>
            <Paper 
              sx={{ 
                p: 2,
                minHeight: '200px',
                display: 'flex',
                flexDirection: 'column',
                mb: 4
              }}
            >
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  color: 'warning.main',
                  fontWeight: 'bold'
                }}
              >
                Projected Annual Impact Summary
              </Typography>
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <Typography variant="body1" color="text.secondary">
                  Summary of projected annual impact on organizational structure and costs...
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
} 