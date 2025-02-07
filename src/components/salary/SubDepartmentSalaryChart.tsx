import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ZAxis
} from 'recharts';
import { Employee } from '../../types/salary';
import { useTheme } from '@mui/material';

interface SubDepartmentSalaryChartProps {
  data: Employee[];
}

interface SubDepartmentStats {
  subDepartment: string;
  averageSalary: number;
  employeeCount: number;
  minSalary: number;
  maxSalary: number;
  employees: Employee[];
}

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

export default function SubDepartmentSalaryChart({ data }: SubDepartmentSalaryChartProps) {
  const theme = useTheme();
  
  const subDepartmentStats = data.reduce<Record<string, SubDepartmentStats>>((acc, employee) => {
    if (!acc[employee.specialty]) {
      acc[employee.specialty] = {
        subDepartment: employee.specialty,
        averageSalary: 0,
        employeeCount: 0,
        minSalary: employee.salary,
        maxSalary: employee.salary,
        employees: []
      };
    }

    const dept = acc[employee.specialty];
    dept.employeeCount += 1;
    dept.minSalary = Math.min(dept.minSalary, employee.salary);
    dept.maxSalary = Math.max(dept.maxSalary, employee.salary);
    dept.averageSalary = (dept.averageSalary * (dept.employeeCount - 1) + employee.salary) / dept.employeeCount;
    dept.employees.push(employee);
    
    return acc;
  }, {});

  const chartData = Object.values(subDepartmentStats).map((dept, index) => ({
    x: index,
    y: dept.averageSalary,
    z: dept.employeeCount * 100,
    name: dept.subDepartment,
    minSalary: dept.minSalary,
    maxSalary: dept.maxSalary,
    employeeCount: dept.employeeCount,
    employees: dept.employees
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      // Sort employees by salary in descending order and add index for sorting
      const sortedEmployees = [...data.employees]
        .sort((a, b) => b.salary - a.salary)
        .map((emp, idx) => ({
          ...emp,
          sortValue: (idx + 1).toString().padStart(2, '0') // Change padding to 2 digits
        }));
      
      return (
        <div style={{
          backgroundColor: theme.palette.background.paper,
          padding: '10px',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '4px',
          maxHeight: '1200px',
          overflowY: 'auto',
          color: theme.palette.text.primary,
          boxShadow: theme.shadows[2]
        }}>
          <p style={{ margin: '0', fontWeight: 'bold', color: theme.palette.text.primary }}>{data.name}</p>
          <p style={{ margin: '5px 0', color: theme.palette.text.secondary }}>
            <span style={{ display: 'inline-block', minWidth: '120px' }}>Average Salary:</span>
            <span style={{ fontFamily: 'monospace' }}>${Math.round(data.y).toLocaleString()}</span>
          </p>
          <p style={{ margin: '5px 0', color: theme.palette.text.secondary }}>
            <span style={{ display: 'inline-block', minWidth: '120px' }}>Employees:</span>
            <span>{data.employeeCount}</span>
          </p>
          <p style={{ margin: '5px 0', color: theme.palette.text.secondary }}>
            <span style={{ display: 'inline-block', minWidth: '120px' }}>Range:</span>
            <span style={{ fontFamily: 'monospace' }}>${data.minSalary.toLocaleString()} - ${data.maxSalary.toLocaleString()}</span>
          </p>
          <div style={{ marginTop: '10px' }}>
            <p style={{ margin: '0', fontWeight: 'bold', color: theme.palette.text.primary }}>Employee List (Sorted by Salary):</p>
            {sortedEmployees.map((emp: Employee & { sortValue: string }) => (
              <p key={emp.id} style={{ 
                margin: '2px 0', 
                fontSize: '0.9em', 
                color: theme.palette.text.secondary,
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>{emp.sortValue}. {emp.name}</span>
                <span style={{ fontFamily: 'monospace' }}>${emp.salary.toLocaleString().padStart(12, ' ')}</span>
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomizedXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const data = chartData[payload.value];
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="end"
          fill="#666"
          transform="rotate(-45)"
        >
          {data?.name || ''}
        </text>
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart
        margin={{
          top: 20,
          right: 30,
          bottom: 70,
          left: 30,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="x"
          type="number"
          tick={<CustomizedXAxisTick />}
          interval={0}
        />
        <YAxis
          dataKey="y"
          name="Average Salary"
          label={{ value: 'Average Salary ($)', angle: -90, position: 'insideLeft' }}
        />
        <ZAxis dataKey="z" range={[200, 2000]} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Scatter
          name="Sub-Departments"
          data={chartData}
          fill="#8884d8"
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
} 