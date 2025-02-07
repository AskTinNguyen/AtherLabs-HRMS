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
import { useTheme, Box } from '@mui/material';

interface SalaryChartProps {
  data: Employee[];
  sidebarExpanded?: boolean;
}

interface DepartmentSalary {
  department: string;
  averageSalary: number;
  minSalary: number;
  maxSalary: number;
  count: number;
  totalSalary: number;
}

export default function SalaryChart({ data, sidebarExpanded = false }: SalaryChartProps) {
  const theme = useTheme();
  
  const departmentStats = data.reduce<Record<string, DepartmentSalary>>((acc, employee) => {
    if (!acc[employee.department]) {
      acc[employee.department] = {
        department: employee.department,
        averageSalary: 0,
        minSalary: employee.salary,
        maxSalary: employee.salary,
        count: 0,
        totalSalary: 0
      };
    }

    const dept = acc[employee.department];
    dept.count = (dept.count || 0) + 1;
    dept.totalSalary = (dept.totalSalary || 0) + employee.salary;
    dept.minSalary = Math.min(dept.minSalary, employee.salary);
    dept.maxSalary = Math.max(dept.maxSalary, employee.salary);
    
    return acc;
  }, {});

  // Calculate averages and prepare chart data
  const chartData = Object.values(departmentStats).map(dept => ({
    department: dept.department,
    averageSalary: Math.round(dept.totalSalary / dept.count),
    minSalary: dept.minSalary,
    maxSalary: dept.maxSalary,
    employeeCount: dept.count,
    totalSalary: dept.totalSalary
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: theme.palette.background.paper,
          padding: '10px',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '4px',
          color: theme.palette.text.primary,
          boxShadow: theme.shadows[2]
        }}>
          <p style={{ margin: '0', fontWeight: 'bold', color: theme.palette.text.primary }}>{label}</p>
          <p style={{ margin: '5px 0', color: theme.palette.text.secondary }}>
            Number of Employees: {payload[0]?.payload.employeeCount}
          </p>
          <p style={{ margin: '5px 0', color: theme.palette.text.secondary }}>
            Total Salary: ${payload[0]?.payload.totalSalary.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      minHeight: 500,
      '& .recharts-wrapper': {
        width: '100% !important',
        '.recharts-surface': {
          width: '100% !important'
        }
      },
      '& .recharts-responsive-container': {
        width: '100% !important'
      }
    }}>
      <ResponsiveContainer width="100%" height="100%" minHeight={500}>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 20,
            left: -15,
            bottom: 120,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="department" 
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ 
              paddingTop: 20,
              fontSize: 12
            }}
          />
          <Bar dataKey="minSalary" fill="var(--chart-1)" name="Min Salary" />
          <Bar dataKey="averageSalary" fill="var(--chart-2)" name="Average Salary" />
          <Bar dataKey="maxSalary" fill="var(--chart-3)" name="Max Salary" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
} 