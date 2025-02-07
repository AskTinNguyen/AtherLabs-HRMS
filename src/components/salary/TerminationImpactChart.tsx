import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart
} from 'recharts';
import { Employee } from '../../types/salary';
import { useTheme, Paper, Typography, Box, Grid } from '@mui/material';

interface TerminationImpactChartProps {
  data: Employee[];
}

interface MonthlyTermination {
  month: number;
  monthName: string;
  employeeCount: number;
  salarySavings: number;
  employees: Employee[];
  cumulativeSavings: number;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function TerminationImpactChart({ data }: TerminationImpactChartProps) {
  const theme = useTheme();
  
  // Filter employees with termination dates and group by month
  const monthlyTerminations = data.reduce<Record<number, MonthlyTermination>>((acc, employee) => {
    if (employee.termination_month !== null) {
      if (!acc[employee.termination_month]) {
        acc[employee.termination_month] = {
          month: employee.termination_month,
          monthName: MONTHS[employee.termination_month - 1],
          employeeCount: 0,
          salarySavings: 0,
          employees: [],
          cumulativeSavings: 0
        };
      }
      
      acc[employee.termination_month].employeeCount += 1;
      acc[employee.termination_month].salarySavings += employee.salary;
      acc[employee.termination_month].employees.push(employee);
    }
    return acc;
  }, {});

  // Calculate yearly impact
  const yearlyImpact = {
    totalEmployees: Object.values(monthlyTerminations).reduce((sum, month) => sum + month.employeeCount, 0),
    monthlySavings: Object.values(monthlyTerminations).reduce((sum, month) => sum + month.salarySavings, 0),
    yearlySavings: 0,
  };

  // Calculate yearly savings based on remaining months after each termination
  const currentMonth = new Date().getMonth() + 1; // 1-based month
  Object.values(monthlyTerminations).forEach(month => {
    const remainingMonths = 12 - month.month + 1; // +1 to include the termination month
    yearlyImpact.yearlySavings += month.salarySavings * remainingMonths;
  });

  // Convert to array and sort by month
  const chartData = Object.values(monthlyTerminations)
    .sort((a, b) => a.month - b.month)
    .map((data, index, array) => ({
      ...data,
      cumulativeSavings: array
        .slice(0, index + 1)
        .reduce((sum, item) => sum + item.salarySavings, 0)
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const sortedEmployees = [...data.employees].sort((a, b) => b.salary - a.salary);
      
      return (
        <div style={{
          backgroundColor: theme.palette.background.paper,
          padding: '10px',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '4px',
          maxHeight: '400px',
          overflowY: 'auto',
          color: theme.palette.text.primary,
          boxShadow: theme.shadows[2]
        }}>
          <p style={{ margin: '0', fontWeight: 'bold', color: theme.palette.text.primary }}>
            {data.monthName} Terminations
          </p>
          <p style={{ margin: '5px 0', color: theme.palette.text.secondary }}>
            <span style={{ display: 'inline-block', minWidth: '180px' }}>Monthly Salary Reduction:</span>
            <span style={{ fontFamily: 'monospace' }}>${data.salarySavings.toLocaleString()}</span>
          </p>
          <p style={{ margin: '5px 0', color: theme.palette.text.secondary }}>
            <span style={{ display: 'inline-block', minWidth: '180px' }}>Cumulative Savings:</span>
            <span style={{ fontFamily: 'monospace' }}>${data.cumulativeSavings.toLocaleString()}</span>
          </p>
          <p style={{ margin: '5px 0', color: theme.palette.text.secondary }}>
            <span style={{ display: 'inline-block', minWidth: '180px' }}>Employees Affected:</span>
            <span>{data.employeeCount}</span>
          </p>
          <div style={{ marginTop: '10px' }}>
            <p style={{ margin: '0', fontWeight: 'bold', color: theme.palette.text.primary }}>Affected Employees:</p>
            {sortedEmployees.map((emp, index) => (
              <p key={emp.id} style={{ 
                margin: '2px 0', 
                fontSize: '0.9em',
                color: theme.palette.text.secondary,
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span style={{ marginRight: '20px' }}>
                  {(index + 1).toString().padStart(2, '0')}. {emp.name}
                </span>
                <span style={{ 
                  fontFamily: 'monospace',
                  color: theme.palette.success.main
                }}>
                  -${emp.salary.toLocaleString().padStart(8, ' ')}
                </span>
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="monthName"
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
          />
          <YAxis 
            yAxisId="left"
            label={{ 
              value: 'Monthly Reduction ($)', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle' }
            }}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right"
            label={{ 
              value: 'Cumulative Savings ($)', 
              angle: 90, 
              position: 'insideRight',
              style: { textAnchor: 'middle' }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            yAxisId="left"
            dataKey="salarySavings" 
            fill="var(--chart-1)" 
            name="Monthly Salary Reduction" 
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumulativeSavings"
            stroke="var(--chart-2)"
            name="Cumulative Savings"
            strokeWidth={2}
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      <Paper 
        elevation={2} 
        sx={{ 
          mt: 2, 
          p: 2,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" gutterBottom color="primary">
          Projected Annual Impact Summary
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Total Affected Employees
              </Typography>
              <Typography variant="h5">
                {yearlyImpact.totalEmployees}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Total Monthly Reduction
              </Typography>
              <Typography variant="h5">
                ${yearlyImpact.monthlySavings.toLocaleString()}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Projected Year-End Savings
              </Typography>
              <Typography variant="h5" color="success.main">
                ${yearlyImpact.yearlySavings.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                (Calculated based on remaining months in the year)
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </>
  );
} 