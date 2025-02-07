import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Tab,
  Tabs,
  Typography,
  useTheme,
  CircularProgress,
  Alert,
  AlertTitle,
  Button,
} from '@mui/material';
import { Position, NewHire, OnboardingTask } from '../../types/recruitment';
import PositionsTable from './PositionsTable';
import NewHiresTable from './NewHiresTable';
import OnboardingBoard from './OnboardingBoard';
import RecruitmentMetrics from './RecruitmentMetrics';
import { loadAllRecruitmentData } from '../../services/recruitmentService';

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
      id={`recruitment-tabpanel-${index}`}
      aria-labelledby={`recruitment-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const RecruitmentDashboard: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [positions, setPositions] = useState<Position[]>([]);
  const [newHires, setNewHires] = useState<NewHire[]>([]);
  const [onboardingTasks, setOnboardingTasks] = useState<OnboardingTask[]>([]);

  useEffect(() => {
    loadRecruitmentData();
  }, []);

  const loadRecruitmentData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await loadAllRecruitmentData();
      setPositions(data.positions);
      setNewHires(data.newHires);
      setOnboardingTasks(data.tasks);
    } catch (err) {
      setError('Failed to load recruitment data. Please try again.');
      console.error('Error loading recruitment data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 2
        }}>
          <CircularProgress size={40} />
          <Typography variant="h6" color="text.secondary">
            Loading recruitment data...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Alert 
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={loadRecruitmentData}>
                Retry
              </Button>
            }
          >
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Recruitment Dashboard
        </Typography>
        <RecruitmentMetrics 
          positions={positions}
          newHires={newHires}
          onboardingTasks={onboardingTasks}
        />
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Open Positions" />
          <Tab label="New Hires" />
          <Tab label="Onboarding" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <PositionsTable 
            positions={positions}
            onPositionUpdate={async (updatedPosition) => {
              try {
                // TODO: Implement position update logic
                console.log('Position updated:', updatedPosition);
                await loadRecruitmentData(); // Refresh data after update
              } catch (err) {
                setError('Failed to update position. Please try again.');
                console.error('Error updating position:', err);
              }
            }}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <NewHiresTable 
            newHires={newHires}
            positions={positions}
            onNewHireUpdate={async (updatedNewHire) => {
              try {
                // TODO: Implement new hire update logic
                console.log('New hire updated:', updatedNewHire);
                await loadRecruitmentData(); // Refresh data after update
              } catch (err) {
                setError('Failed to update new hire. Please try again.');
                console.error('Error updating new hire:', err);
              }
            }}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <OnboardingBoard
            newHires={newHires}
            onboardingTasks={onboardingTasks}
            onTaskUpdate={async (updatedTask) => {
              try {
                // TODO: Implement task update logic
                console.log('Task updated:', updatedTask);
                await loadRecruitmentData(); // Refresh data after update
              } catch (err) {
                setError('Failed to update task. Please try again.');
                console.error('Error updating task:', err);
              }
            }}
          />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default RecruitmentDashboard; 