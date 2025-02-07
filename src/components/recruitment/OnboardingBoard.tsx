import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { NewHire, OnboardingTask } from '../../types/recruitment';
import { createTask, updateTask } from '../../services/recruitmentService';

interface OnboardingBoardProps {
  newHires: NewHire[];
  onboardingTasks: OnboardingTask[];
  onTaskUpdate: (task: OnboardingTask) => void;
}

interface TaskFormData {
  title: string;
  description: string;
  newHireId: string;
  dueDate: string;
  status: OnboardingTask['status'];
}

const OnboardingBoard: React.FC<OnboardingBoardProps> = ({
  newHires,
  onboardingTasks,
  onTaskUpdate,
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<OnboardingTask | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    newHireId: '',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'pending',
  });

  const handleOpenDialog = (task?: OnboardingTask) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description,
        newHireId: task.newHireId,
        dueDate: new Date(task.dueDate).toISOString().split('T')[0],
        status: task.status,
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        newHireId: '',
        dueDate: new Date().toISOString().split('T')[0],
        status: 'pending',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTask(null);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (editingTask) {
        const updatedTask = await updateTask({
          ...editingTask,
          ...formData,
          dueDate: new Date(formData.dueDate),
        });
        onTaskUpdate(updatedTask);
      } else {
        const newTask = await createTask(
          formData.title,
          formData.description,
          formData.newHireId,
          new Date(formData.dueDate)
        );
        onTaskUpdate(newTask);
      }
      handleCloseDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving the task');
      console.error('Error saving task:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getNewHireName = (newHireId: string) => {
    const newHire = newHires.find(nh => nh.id === newHireId);
    return newHire ? newHire.candidateName : 'Unknown';
  };

  const getTasksByStatus = (status: OnboardingTask['status']) => {
    return onboardingTasks.filter(task => task.status === status);
  };

  const TaskColumn: React.FC<{
    title: string;
    status: OnboardingTask['status'];
    tasks: OnboardingTask[];
  }> = ({ title, status, tasks }) => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          {title} ({tasks.length})
        </Typography>
        <Box sx={{ minHeight: 400 }}>
          {tasks.map(task => (
            <Card key={task.id} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  {task.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {task.description}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    label={getNewHireName(task.newHireId)}
                    size="small"
                    color="primary"
                  />
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(task)}
                      disabled={isLoading}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={isLoading}
        >
          Add Task
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ height: '100%' }}>
        <Grid item xs={12} md={4}>
          <TaskColumn
            title="Pending"
            status="pending"
            tasks={getTasksByStatus('pending')}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TaskColumn
            title="In Progress"
            status="in-progress"
            tasks={getTasksByStatus('in-progress')}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TaskColumn
            title="Completed"
            status="completed"
            tasks={getTasksByStatus('completed')}
          />
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTask ? 'Edit Task' : 'Create New Task'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="title"
              label="Task Title"
              fullWidth
              value={formData.title}
              onChange={handleInputChange}
              disabled={isLoading}
            />
            <TextField
              name="description"
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              disabled={isLoading}
            />
            <TextField
              name="newHireId"
              label="New Hire"
              select
              fullWidth
              value={formData.newHireId}
              onChange={handleInputChange}
              disabled={isLoading}
            >
              {newHires.map((newHire) => (
                <MenuItem key={newHire.id} value={newHire.id}>
                  {newHire.candidateName}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              name="dueDate"
              label="Due Date"
              type="date"
              fullWidth
              value={formData.dueDate}
              onChange={handleInputChange}
              disabled={isLoading}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              name="status"
              label="Status"
              select
              fullWidth
              value={formData.status}
              onChange={handleInputChange}
              disabled={isLoading}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isLoading}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {editingTask ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={error !== null}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OnboardingBoard; 