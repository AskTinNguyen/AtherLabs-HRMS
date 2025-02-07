import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Employee } from '../../types/salary';
import { useTheme } from '@mui/material';

interface DivisionSalaryChartProps {
  data: Employee[];
}

interface DivisionStats {
  division: string;
  totalSalary: number;
  employeeCount: number;
}

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

export default function DivisionSalaryChart({ data }: DivisionSalaryChartProps) {
  const theme = useTheme();
  
  const divisionStats = data.reduce<Record<string, DivisionStats>>((acc, employee) => {
    if (!acc[employee.division]) {
      acc[employee.division] = {
        division: employee.division,
        totalSalary: 0,
        employeeCount: 0
      };
    }

    const div = acc[employee.division];
    div.totalSalary += employee.salary;
    div.employeeCount += 1;
    
    return acc;
  }, {});

  const chartData = Object.values(divisionStats).map(div => ({
    name: div.division,
    value: div.totalSalary,
    employeeCount: div.employeeCount,
    averageSalary: Math.round(div.totalSalary / div.employeeCount)
  }));

  const CustomTooltip = ({ active, payload }: any) => {
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
          <p style={{ margin: '0', fontWeight: 'bold', color: theme.palette.text.primary }}>{data.name}</p>
          <p style={{ margin: '5px 0', color: theme.palette.text.secondary }}>Total Salary: ${data.value.toLocaleString()}</p>
          <p style={{ margin: '5px 0', color: theme.palette.text.secondary }}>Employees: {data.employeeCount}</p>
          <p style={{ margin: '5px 0', color: theme.palette.text.secondary }}>Average: ${data.averageSalary.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={150}
          fill="#8884d8"
          dataKey="value"
          label={({ name, value }) => `${name} ($${Math.round(value / 1000)}k)`}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
} 