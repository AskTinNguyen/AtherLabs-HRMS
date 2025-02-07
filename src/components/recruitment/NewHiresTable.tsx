import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
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
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import { NewHire, Position, CreateNewHireRequest } from '../../types/recruitment';
import { createNewHire, updateNewHire } from '../../services/recruitmentService';

interface NewHiresTableProps {
  newHires: NewHire[];
  positions: Position[];
  onNewHireUpdate: (newHire: NewHire) => void;
}

const NewHiresTable: React.FC<NewHiresTableProps> = ({
  newHires,
  positions,
  onNewHireUpdate,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingNewHire, setEditingNewHire] = useState<NewHire | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateNewHireRequest>({
    candidateName: '',
    positionId: '',
    startDate: new Date(),
    probationEndDate: new Date(),
    salary: 0,
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (newHire?: NewHire) => {
    if (newHire) {
      setEditingNewHire(newHire);
      setFormData({
        candidateName: newHire.candidateName,
        positionId: newHire.positionId,
        startDate: newHire.startDate,
        probationEndDate: newHire.probationEndDate,
        salary: newHire.salary,
      });
    } else {
      setEditingNewHire(null);
      setFormData({
        candidateName: '',
        positionId: '',
        startDate: new Date(),
        probationEndDate: new Date(),
        salary: 0,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingNewHire(null);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'salary' ? Number(value) : value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (editingNewHire) {
        const updatedNewHire = await updateNewHire({
          ...editingNewHire,
          ...formData,
        });
        onNewHireUpdate(updatedNewHire);
      } else {
        const newHire = await createNewHire(formData);
        onNewHireUpdate(newHire);
      }
      handleCloseDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving the new hire');
      console.error('Error saving new hire:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusChipColor = (status: NewHire['onboardingStatus']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'warning';
      case 'pending':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPositionTitle = (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    return position ? position.title : 'Unknown Position';
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Hire
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Candidate Name</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>Probation End</TableCell>
              <TableCell align="right">Salary</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {newHires
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((newHire) => (
                <TableRow key={newHire.id}>
                  <TableCell>{newHire.candidateName}</TableCell>
                  <TableCell>{getPositionTitle(newHire.positionId)}</TableCell>
                  <TableCell>{newHire.department}</TableCell>
                  <TableCell>
                    {new Date(newHire.startDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(newHire.probationEndDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    ${newHire.salary.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={newHire.onboardingStatus}
                      color={getStatusChipColor(newHire.onboardingStatus)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(newHire)}
                      disabled={isLoading}
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={newHires.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingNewHire ? 'Edit New Hire' : 'Add New Hire'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="candidateName"
              label="Candidate Name"
              fullWidth
              value={formData.candidateName}
              onChange={handleInputChange}
              disabled={isLoading}
            />
            <TextField
              name="positionId"
              label="Position"
              select
              fullWidth
              value={formData.positionId}
              onChange={handleInputChange}
              disabled={isLoading}
            >
              {positions.map((position) => (
                <MenuItem key={position.id} value={position.id}>
                  {position.title}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              name="startDate"
              label="Start Date"
              type="date"
              fullWidth
              value={formData.startDate.toISOString().split('T')[0]}
              onChange={handleInputChange}
              disabled={isLoading}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              name="probationEndDate"
              label="Probation End Date"
              type="date"
              fullWidth
              value={formData.probationEndDate.toISOString().split('T')[0]}
              onChange={handleInputChange}
              disabled={isLoading}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              name="salary"
              label="Salary"
              type="number"
              fullWidth
              value={formData.salary}
              onChange={handleInputChange}
              disabled={isLoading}
              InputProps={{
                startAdornment: <Box component="span" sx={{ mr: 1 }}>$</Box>,
              }}
            />
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
            {editingNewHire ? 'Update' : 'Create'}
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

export default NewHiresTable; 