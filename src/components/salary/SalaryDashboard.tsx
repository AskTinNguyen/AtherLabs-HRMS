import React, { useMemo, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  useTheme
} from '@mui/material';
import { Employee } from '../../types/salary';
import { Position } from '../../types/recruitment';
import { useDemoMode } from '../../context/DemoModeContext';
import { transformEmployeesData } from '../../utils/demoDataTransform';
import SalaryMonthlyChart from './SalaryMonthlyChart';
import DivisionSalaryChart from './DivisionSalaryChart';
import SalaryRangeChart from './SalaryRangeChart';
import SubDepartmentSalaryChart from './SubDepartmentSalaryChart';
import TerminationImpactChart from './TerminationImpactChart';
import { CustomDashboard } from '../../types/dashboard';
import SalaryChart from './SalaryChart';
import SalaryTable from './SalaryTable';
import AIDashboard from '../dashboard/AIDashboard';
import OrganizationalStructureAnalysis from '../dashboard/OrganizationalStructureAnalysis';

interface SalaryDashboardProps {
  data: Employee[];
  positions?: Position[];
  sidebarExpanded?: boolean;
  aiDashboard?: CustomDashboard | null;
  onReturnToStandard?: () => void;
}

interface CategoryMetrics {
  amount: number;
  count: number;
}

interface DashboardMetrics {
  totalSalaryPerMonth: CategoryMetrics;
  yearlySalary: {
    net: CategoryMetrics;
    gross: CategoryMetrics;
  };
  subtotalsByCategory: {
    backOffice: CategoryMetrics;
    remaining: CategoryMetrics;
  };
  leadershipSalary: CategoryMetrics;
  projectedSalary: CategoryMetrics;
  recruitmentBudget: CategoryMetrics;
  totalEmployees: number;
  activeEmployees: number;
  averageSalary: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`salary-tabpanel-${index}`}
      aria-labelledby={`salary-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function SalaryDashboard({ 
  data, 
  positions = [],
  sidebarExpanded = false,
  aiDashboard = null,
  onReturnToStandard
}: SalaryDashboardProps) {
  const { isDemoMode } = useDemoMode();
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const displayData = useMemo(() => {
    return isDemoMode ? transformEmployeesData(data) : data;
  }, [data, isDemoMode]);

  const metrics = useMemo(() => {
    const initialMetrics: DashboardMetrics = {
      totalSalaryPerMonth: { amount: 0, count: 0 },
      yearlySalary: {
        net: { amount: 0, count: 0 },
        gross: { amount: 0, count: 0 }
      },
      subtotalsByCategory: {
        backOffice: { amount: 0, count: 0 },
        remaining: { amount: 0, count: 0 }
      },
      leadershipSalary: { amount: 0, count: 0 },
      projectedSalary: { amount: 0, count: 0 },
      recruitmentBudget: { amount: 0, count: 0 },
      totalEmployees: displayData.length,
      activeEmployees: displayData.filter((emp: Employee) => !emp.termination_month).length,
      averageSalary: 0
    };

    // Calculate recruitment budget (yearly budget impact for open positions)
    initialMetrics.recruitmentBudget = positions.reduce((acc, pos) => {
      if (pos.status !== 'filled') {
        acc.amount += pos.yearlyBudgetImpact || 0;
        acc.count++;
      }
      return acc;
    }, { amount: 0, count: 0 });

    // Get current month (0-11 format)
    const currentMonth = new Date().getMonth();
    const remainingMonths = 11 - currentMonth + 1; // +1 to include current month

    // Calculate monthly totals first
    displayData.forEach((emp: Employee) => {
      // For monthly total, include all current employees
      initialMetrics.totalSalaryPerMonth.amount += emp.salary;
      initialMetrics.totalSalaryPerMonth.count++;

      // Calculate remaining months for this employee
      let employeeRemainingMonths = remainingMonths;
      if (emp.termination_month !== null) {
        // Convert termination month to 0-11 format
        const terminationMonth = emp.termination_month - 1;
        
        if (terminationMonth < currentMonth) {
          employeeRemainingMonths = 0;
        } else {
          employeeRemainingMonths = Math.min(
            terminationMonth - currentMonth + 1,
            remainingMonths
          );
        }
      }

      // Add to projected amount if employee will be active
      if (employeeRemainingMonths > 0) {
        const contribution = emp.salary * employeeRemainingMonths;
        initialMetrics.projectedSalary.amount += contribution;
        initialMetrics.projectedSalary.count++;
      }
    });

    return displayData.reduce((acc: DashboardMetrics, emp: Employee) => {
      // Update yearly salaries (based on current monthly total plus recruitment budget)
      acc.yearlySalary.net.amount = (acc.totalSalaryPerMonth.amount * 12) + acc.recruitmentBudget.amount;
      acc.yearlySalary.net.count = acc.totalSalaryPerMonth.count + acc.recruitmentBudget.count;
      acc.yearlySalary.gross.amount = acc.yearlySalary.net.amount * 1.22;
      acc.yearlySalary.gross.count = acc.yearlySalary.net.count;

      // Calculate average salary
      acc.averageSalary = acc.totalEmployees > 0 ? acc.totalSalaryPerMonth.amount / acc.totalEmployees : 0;

      // Update category subtotals
      if (['HR', 'Finance', 'Admin'].includes(emp.department)) {
        acc.subtotalsByCategory.backOffice.amount += emp.salary;
        acc.subtotalsByCategory.backOffice.count++;
      } else {
        acc.subtotalsByCategory.remaining.amount += emp.salary;
        acc.subtotalsByCategory.remaining.count++;
      }

      // Update leadership metrics
      const isLeader = ['director', 'head', 'lead', 'chief', 'manager']
        .some(term => emp.position.toLowerCase().includes(term));
      if (isLeader) {
        acc.leadershipSalary.amount += emp.salary;
        acc.leadershipSalary.count++;
      }

      return acc;
    }, initialMetrics);
  }, [displayData, positions]);

  const DashboardCard = ({ 
    title, 
    metrics: { amount, count } 
  }: { 
    title: string; 
    metrics: CategoryMetrics 
  }) => (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h5" component="div">
        ${amount.toLocaleString()}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {count} Employee{count !== 1 ? 's' : ''}
      </Typography>
    </Paper>
  );

  // If we have an AI-generated dashboard, render that instead
  if (aiDashboard) {
    return (
      <AIDashboard
        dashboard={aiDashboard}
        data={displayData}
        sidebarExpanded={sidebarExpanded}
        onReturnToStandard={onReturnToStandard}
      />
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <DashboardCard 
            title="Total Employees"
            metrics={{
              amount: metrics.totalEmployees,
              count: metrics.totalEmployees
            }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <DashboardCard 
            title="Active Employees"
            metrics={{
              amount: metrics.activeEmployees,
              count: metrics.activeEmployees
            }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <DashboardCard 
            title="Total Monthly Salary" 
            metrics={metrics.totalSalaryPerMonth}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <DashboardCard 
            title="Recruitment Budget" 
            metrics={metrics.recruitmentBudget}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <DashboardCard 
            title="Projected Salary (Remaining Months)" 
            metrics={metrics.projectedSalary}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <DashboardCard 
            title="Yearly Net Salary" 
            metrics={metrics.yearlySalary.net}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <DashboardCard 
            title="Yearly Gross Salary (inc. 22% Tax)" 
            metrics={metrics.yearlySalary.gross}
          />
        </Grid>
        <Grid item xs={12}>
          <Paper elevation={2}>
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              centered
            >
              <Tab label="Monthly Trend" />
              <Tab label="Division Distribution" />
              <Tab label="Salary Ranges" />
              <Tab label="Sub-Department Analysis" />
              <Tab label="Termination Impact" />
              <Tab label="Organizational Structure" />
            </Tabs>
            <TabPanel value={selectedTab} index={0}>
              <SalaryMonthlyChart data={displayData} />
            </TabPanel>
            <TabPanel value={selectedTab} index={1}>
              <DivisionSalaryChart data={displayData} />
            </TabPanel>
            <TabPanel value={selectedTab} index={2}>
              <SalaryRangeChart data={displayData} />
            </TabPanel>
            <TabPanel value={selectedTab} index={3}>
              <SubDepartmentSalaryChart data={displayData} />
            </TabPanel>
            <TabPanel value={selectedTab} index={4}>
              <TerminationImpactChart data={displayData} />
            </TabPanel>
            <TabPanel value={selectedTab} index={5}>
              <OrganizationalStructureAnalysis data={displayData} />
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}