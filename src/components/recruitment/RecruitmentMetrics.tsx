import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import { Position, NewHire, OnboardingTask } from '../../types/recruitment';

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle }) => (
  <Paper sx={{ p: 2, height: '100%' }}>
    <Typography variant="h6" component="h2" gutterBottom>
      {title}
    </Typography>
    <Typography variant="h4" component="div" sx={{ mb: 1 }}>
      {value}
    </Typography>
    {subtitle && (
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    )}
  </Paper>
);

interface RecruitmentMetricsProps {
  positions: Position[];
  newHires: NewHire[];
  onboardingTasks: OnboardingTask[];
}

const RecruitmentMetrics: React.FC<RecruitmentMetricsProps> = ({
  positions,
  newHires,
  onboardingTasks,
}) => {
  // Calculate metrics
  const openPositions = positions.filter(p => p.status === 'open').length;
  const inProgressPositions = positions.filter(p => p.status === 'in-progress').length;
  const activeNewHires = newHires.filter(nh => nh.onboardingStatus !== 'completed').length;
  
  const totalYearlyBudgetImpact = positions
    .filter(p => p.status !== 'filled')
    .reduce((sum, pos) => sum + (pos.yearlyBudgetImpact || 0), 0);

  const pendingApprovals = positions.filter(p => p.approvalStatus === 'pending').length;
  
  const onboardingProgress = onboardingTasks.length > 0
    ? Math.round((onboardingTasks.filter(t => t.status === 'completed').length / onboardingTasks.length) * 100)
    : 0;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={4}>
        <MetricCard
          title="Open Positions"
          value={openPositions}
          subtitle={`${inProgressPositions} in progress`}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <MetricCard
          title="Active New Hires"
          value={activeNewHires}
          subtitle="In onboarding process"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <MetricCard
          title="Yearly Recruitment Budget"
          value={`$${totalYearlyBudgetImpact.toLocaleString()}`}
          subtitle="Total projected cost for new hires"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <MetricCard
          title="Pending Approvals"
          value={pendingApprovals}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <MetricCard
          title="Onboarding Progress"
          value={`${onboardingProgress}%`}
          subtitle="Tasks completed"
        />
      </Grid>
    </Grid>
  );
};

export default RecruitmentMetrics; 