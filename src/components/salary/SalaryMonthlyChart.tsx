import React, { useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Employee } from '../../types/salary';

interface SalaryMonthlyChartProps {
  data: Employee[];
}

interface MonthlyData {
  month: string;
  totalSalary: number;
  activeEmployees: number;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const SalaryMonthlyChart: React.FC<SalaryMonthlyChartProps> = ({ data }) => {
  const monthlyData = useMemo(() => {
    const currentMonth = new Date().getMonth(); // 0-11
    
    console.log('Chart - Current Month (0-11):', currentMonth);
    
    // Initialize monthly data array
    const monthlyTotals: MonthlyData[] = MONTHS.map((month, index) => ({
      month,
      totalSalary: 0,
      activeEmployees: 0
    }));

    // Calculate salary for each month considering terminations
    data.forEach(employee => {
      const terminationMonth = employee.termination_month ? employee.termination_month - 1 : 11; // Convert to 0-11 format
      
      console.log('Chart - Employee:', {
        name: employee.name,
        salary: employee.salary,
        termination_month: employee.termination_month,
        converted_termination_month: terminationMonth
      });

      // Calculate which months this employee will be active
      for (let month = currentMonth; month <= 11; month++) {
        if (month <= terminationMonth) {
          monthlyTotals[month].totalSalary += employee.salary;
          monthlyTotals[month].activeEmployees++;
          
          console.log(`Adding salary for ${MONTHS[month]}:`, {
            salary: employee.salary,
            newTotal: monthlyTotals[month].totalSalary
          });
        }
      }
    });

    // Return only the remaining months of the year
    const result = monthlyTotals.slice(currentMonth);
    console.log('Chart - Final Monthly Data:', result);
    
    return result;
  }, [data]);

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2">{label}</Typography>
          <Typography variant="body2" color="primary">
            Total Salary: {formatCurrency(payload[0].value)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Active Employees: {payload[1].value}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  return (
    <Paper sx={{ p: 2, height: 400, width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Monthly Salary Projection
      </Typography>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={monthlyData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="totalSalary"
            name="Total Salary"
            fill="#8884d8"
          />
          <Bar
            yAxisId="right"
            dataKey="activeEmployees"
            name="Active Employees By Year End"
            fill="#82ca9d"
          />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default SalaryMonthlyChart; 