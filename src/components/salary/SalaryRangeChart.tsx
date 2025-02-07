import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Employee } from '../../types/salary';
import { useTheme } from '@mui/material';

interface SalaryRangeChartProps {
  data: Employee[];
}

interface RangeData {
  range: string;
  count: number;
  employees: Employee[];
  averageSalary: number;
}

export default function SalaryRangeChart({ data }: SalaryRangeChartProps) {
  const theme = useTheme();
  const RANGE_SIZE = 1000;
  const ranges: Record<string, RangeData> = {};

  // Create salary ranges and count employees in each range
  data.forEach(employee => {
    const rangeStart = Math.floor(employee.salary / RANGE_SIZE) * RANGE_SIZE;
    const rangeKey = `$${rangeStart}-${rangeStart + RANGE_SIZE}`;
    
    if (!ranges[rangeKey]) {
      ranges[rangeKey] = {
        range: rangeKey,
        count: 0,
        employees: [],
        averageSalary: 0
      };
    }
    
    ranges[rangeKey].count += 1;
    ranges[rangeKey].employees.push(employee);
  });

  // Calculate average salary for each range
  Object.values(ranges).forEach(range => {
    const totalSalary = range.employees.reduce((sum, emp) => sum + emp.salary, 0);
    range.averageSalary = Math.round(totalSalary / range.employees.length);
  });

  // Convert to array and sort by range
  const chartData = Object.values(ranges)
    .sort((a, b) => {
      const aStart = parseInt(a.range.split('-')[0].substring(1));
      const bStart = parseInt(b.range.split('-')[0].substring(1));
      return aStart - bStart;
    });

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
          <p style={{ margin: '0', fontWeight: 'bold', color: theme.palette.text.primary }}>Salary Range: {label}</p>
          <p style={{ margin: '5px 0', color: theme.palette.text.secondary }}>Number of Employees: {data.count}</p>
          <p style={{ margin: '5px 0', color: theme.palette.text.secondary }}>Average Salary: ${data.averageSalary.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
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
          dataKey="range"
          angle={-45}
          textAnchor="end"
          height={100}
          interval={0}
        />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="count" fill="var(--chart-1)" name="Number of Employees" />
      </BarChart>
    </ResponsiveContainer>
  );
} 