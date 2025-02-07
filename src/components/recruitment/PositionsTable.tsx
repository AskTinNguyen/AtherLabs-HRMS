import React, { useState, useEffect } from 'react';
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
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Alert,
  Snackbar,
  CircularProgress,
  Menu,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import { Position, CreatePositionRequest, UpdatePositionStatusRequest } from '../../types/recruitment';
import { createPosition, updatePosition } from '../../services/recruitmentService';

// Define available departments and divisions
const DEPARTMENTS = [
  'Art',
  'BOD',
  'Creative',
  'Data',
  'Engineering',
  'Marketing',
  'QA - Metaverse',
  'Product Management',
  'Publishing',
  'Game Design',
  'Audio',
  'Publishing',
  'QA - Game',
  'R&D',
  'UI/UX'
];

const DIVISIONS = [
  'Game',
  'Metaverse', 
  'Share Services',
  'Back Office'
];

interface PositionsTableProps {
  positions: Position[];
  onPositionUpdate: (position: Position) => void;
}

// Helper function to safely format currency
const formatCurrency = (value: number | null | undefined): string => {
  if (value == null) return '$0';
  return `$${value.toLocaleString()}`;
};

const PositionsTable: React.FC<PositionsTableProps> = ({
  positions,
  onPositionUpdate,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [formData, setFormData] = useState<CreatePositionRequest>({
    title: '',
    department: '',
    division: '',
    baseSalary: null as unknown as number,
    expectedStartMonth: new Date().getMonth() + 1, // Default to current month
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [statusAnchorEl, setStatusAnchorEl] = useState<null | HTMLElement>(null);
  const [approvalAnchorEl, setApprovalAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

  // Status options
  const STATUS_OPTIONS: Position['status'][] = ['open', 'in-progress', 'filled'];
  const APPROVAL_OPTIONS: Position['approvalStatus'][] = ['pending', 'approved', 'rejected'];

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (position?: Position) => {
    if (position) {
      setEditingPosition(position);
      setFormData({
        title: position.title,
        department: position.department,
        division: position.division,
        baseSalary: position.baseSalary,
        expectedStartMonth: position.expectedStartMonth || new Date().getMonth() + 1,
      });
    } else {
      setEditingPosition(null);
      setFormData({
        title: '',
        department: '',
        division: '',
        baseSalary: null as unknown as number,
        expectedStartMonth: new Date().getMonth() + 1,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPosition(null);
    setError(null);
    setSuccessMessage(null);
  };

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'baseSalary' ? (value === '' ? null : Number(value)) : value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'expectedStartMonth' ? Number(value) : value,
    }));
  };

  const handleSubmit = async () => {
    if (formData.baseSalary === null) {
      setError('Please enter a base salary');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (!formData.department) {
      setError('Please select a department');
      return;
    }

    if (!formData.division) {
      setError('Please select a division');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (editingPosition) {
        const updatedPosition = await updatePosition({
          ...editingPosition,
          ...formData,
          baseSalary: Number(formData.baseSalary),
          updatedAt: new Date(),
        });
        onPositionUpdate(updatedPosition);
        setSuccessMessage('Position updated successfully');
        handleCloseDialog();
      } else {
        const newPosition = await createPosition({
          ...formData,
          baseSalary: Number(formData.baseSalary),
        });
        onPositionUpdate(newPosition);
        setSuccessMessage('Position created successfully');
        handleCloseDialog();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving the position');
      console.error('Error saving position:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusChipColor = (status: Position['status']) => {
    switch (status) {
      case 'open':
        return 'success';
      case 'in-progress':
        return 'warning';
      case 'filled':
        return 'default';
      default:
        return 'default';
    }
  };

  const getApprovalChipColor = (status: Position['approvalStatus']) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleStatusClick = (event: React.MouseEvent<HTMLDivElement>, position: Position) => {
    setStatusAnchorEl(event.currentTarget);
    setSelectedPosition(position);
  };

  const handleApprovalClick = (event: React.MouseEvent<HTMLDivElement>, position: Position) => {
    setApprovalAnchorEl(event.currentTarget);
    setSelectedPosition(position);
  };

  const handleStatusClose = () => {
    setStatusAnchorEl(null);
    setSelectedPosition(null);
  };

  const handleApprovalClose = () => {
    setApprovalAnchorEl(null);
    setSelectedPosition(null);
  };

  const handleStatusChange = async (newStatus: Position['status']) => {
    if (!selectedPosition) return;

    try {
      setIsLoading(true);
      const updatedPosition = await updatePosition({
        ...selectedPosition,
        status: newStatus,
      });
      onPositionUpdate(updatedPosition);
      setSuccessMessage(`Status updated to ${newStatus}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
      console.error('Error updating status:', err);
    } finally {
      setIsLoading(false);
      handleStatusClose();
    }
  };

  const handleApprovalChange = async (newStatus: Position['approvalStatus']) => {
    if (!selectedPosition) return;

    try {
      setIsLoading(true);
      const updatedPosition = await updatePosition({
        ...selectedPosition,
        approvalStatus: newStatus,
      });
      onPositionUpdate(updatedPosition);
      setSuccessMessage(`Approval status updated to ${newStatus}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update approval status');
      console.error('Error updating approval status:', err);
    } finally {
      setIsLoading(false);
      handleApprovalClose();
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Position
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Division</TableCell>
              <TableCell align="right">Base Salary</TableCell>
              <TableCell align="right">Monthly Budget Impact</TableCell>
              <TableCell align="right">Yearly Budget Impact</TableCell>
              <TableCell>Expected Start</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Approval</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {positions
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((position) => (
                <TableRow key={position.id}>
                  <TableCell>{position.title}</TableCell>
                  <TableCell>{position.department}</TableCell>
                  <TableCell>{position.division}</TableCell>
                  <TableCell align="right">
                    {formatCurrency(position.baseSalary)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(position.budgetImpact)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(position.yearlyBudgetImpact)}
                  </TableCell>
                  <TableCell>
                    {position.expectedStartMonth ? 
                      new Date(2024, position.expectedStartMonth - 1).toLocaleString('default', { month: 'short' }) 
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={position.status || 'unknown'}
                      color={getStatusChipColor(position.status)}
                      size="small"
                      onClick={(e) => handleStatusClick(e, position)}
                      sx={{ cursor: 'pointer' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={position.approvalStatus || 'pending'}
                      color={getApprovalChipColor(position.approvalStatus)}
                      size="small"
                      onClick={(e) => handleApprovalClick(e, position)}
                      sx={{ cursor: 'pointer' }}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(position)}
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
          count={positions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Status Change Menu */}
      <Menu
        anchorEl={statusAnchorEl}
        open={Boolean(statusAnchorEl)}
        onClose={handleStatusClose}
      >
        {STATUS_OPTIONS.map((status) => (
          <MenuItem
            key={status}
            onClick={() => handleStatusChange(status)}
            disabled={isLoading}
          >
            <Chip
              label={status}
              color={getStatusChipColor(status)}
              size="small"
              sx={{ minWidth: 100 }}
            />
          </MenuItem>
        ))}
      </Menu>

      {/* Approval Change Menu */}
      <Menu
        anchorEl={approvalAnchorEl}
        open={Boolean(approvalAnchorEl)}
        onClose={handleApprovalClose}
      >
        {APPROVAL_OPTIONS.map((status) => (
          <MenuItem
            key={status}
            onClick={() => handleApprovalChange(status)}
            disabled={isLoading}
          >
            <Chip
              label={status}
              color={getApprovalChipColor(status)}
              size="small"
              sx={{ minWidth: 100 }}
            />
          </MenuItem>
        ))}
      </Menu>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm" 
        fullWidth
        onBackdropClick={() => !isLoading && handleCloseDialog()}
      >
        <DialogTitle>
          {editingPosition ? 'Edit Position' : 'Create New Position'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2, mt: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="title"
              label="Title"
              fullWidth
              value={formData.title}
              onChange={handleTextFieldChange}
              disabled={isLoading}
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Department</InputLabel>
              <Select
                name="department"
                value={formData.department}
                label="Department"
                onChange={handleSelectChange}
                disabled={isLoading}
              >
                {DEPARTMENTS.sort().map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Division</InputLabel>
              <Select
                name="division"
                value={formData.division}
                label="Division"
                onChange={handleSelectChange}
                disabled={isLoading}
              >
                {DIVISIONS.sort().map((div) => (
                  <MenuItem key={div} value={div}>
                    {div}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              name="baseSalary"
              label="Base Salary"
              type="number"
              fullWidth
              value={formData.baseSalary === null ? '' : formData.baseSalary}
              onChange={handleTextFieldChange}
              disabled={isLoading}
              required
              InputProps={{
                startAdornment: <Box component="span" sx={{ mr: 1 }}>$</Box>,
              }}
            />
            <FormControl fullWidth required>
              <InputLabel>Expected Start Month</InputLabel>
              <Select
                name="expectedStartMonth"
                value={String(formData.expectedStartMonth || '')}
                label="Expected Start Month"
                onChange={handleSelectChange}
                disabled={isLoading}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <MenuItem key={i + 1} value={String(i + 1)}>
                    {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {editingPosition ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSuccessMessage(null)} 
          severity="success"
          elevation={6}
          variant="filled"
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PositionsTable; 