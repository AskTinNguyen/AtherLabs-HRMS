import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  TablePagination,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
  Typography,
  TableSortLabel,
  Toolbar,
  Autocomplete,
  AutocompleteRenderInputParams,
  SelectChangeEvent,
  Switch,
  FormControlLabel,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  PersonOutline as PersonOutlineIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Employee } from '../../types/salary';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { useDemoMode } from '../../context/DemoModeContext';
import { transformEmployeesData } from '../../utils/demoDataTransform';

interface SalaryTableProps {
  data: Employee[];
  onDataUpdate: (newEmployees: Employee[]) => void;
  sidebarExpanded?: boolean;
}

type SortOrder = 'asc' | 'desc';
type SortField = keyof Employee | '';

// Add new interface for Snackbar state
interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

interface NewEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (employee: Omit<Employee, 'id'>) => void;
  departments: string[];
  divisions: string[];
}

function NewEmployeeDialog({ open, onClose, onAdd, departments, divisions }: NewEmployeeDialogProps) {
  const [newEmployee, setNewEmployee] = useState<Omit<Employee, 'id'>>({
    name: '',
    position: '',
    department: '',
    specialty: '',
    division: '',
    salary: 0,
    termination_month: null,
    isLeadership: false
  });

  const handleSubmit = () => {
    onAdd(newEmployee);
    onClose();
    setNewEmployee({
      name: '',
      position: '',
      department: '',
      specialty: '',
      division: '',
      salary: 0,
      termination_month: null,
      isLeadership: false
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Employee</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField
            label="Name"
            fullWidth
            value={newEmployee.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmployee({ ...newEmployee, name: e.target.value })}
          />
          <TextField
            label="Position"
            fullWidth
            value={newEmployee.position}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmployee({ ...newEmployee, position: e.target.value })}
          />
          <FormControl fullWidth>
            <InputLabel>Division</InputLabel>
            <Select
              value={newEmployee.division}
              label="Division"
              onChange={(e: SelectChangeEvent) => setNewEmployee({ ...newEmployee, division: e.target.value })}
            >
              {divisions.map((division) => (
                <MenuItem key={division} value={division}>
                  {division}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Department</InputLabel>
            <Select
              value={newEmployee.department}
              label="Department"
              onChange={(e: SelectChangeEvent) => setNewEmployee({ ...newEmployee, department: e.target.value })}
            >
              {departments.map((department) => (
                <MenuItem key={department} value={department}>
                  {department}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Sub Department"
            fullWidth
            value={newEmployee.specialty}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmployee({ ...newEmployee, specialty: e.target.value })}
          />
          <TextField
            label="Salary"
            type="number"
            fullWidth
            value={newEmployee.salary}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmployee({ ...newEmployee, salary: Number(e.target.value) })}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={!newEmployee.name || !newEmployee.position || !newEmployee.department || !newEmployee.division || newEmployee.salary <= 0}
        >
          Add Employee
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  employeeName: string;
}

function DeleteConfirmationDialog({ open, onClose, onConfirm, employeeName }: DeleteConfirmationDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirm Delete</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete employee "{employeeName}"? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Add interface for calculation result
interface TerminationImpactResult {
  impact: number;
  currentMonth: number;
  oldRemainingMonths: number;
  newRemainingMonths: number;
  monthlySalary: number;
}

const calculateTerminationImpact = (
  employee: Employee, 
  oldMonth: number | null, 
  newMonth: number | null
): TerminationImpactResult => {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const monthlySalary = employee.salary;

  // If both are null or same month, no impact
  if (oldMonth === newMonth) return {
    impact: 0,
    currentMonth,
    oldRemainingMonths: 0,
    newRemainingMonths: 0,
    monthlySalary
  };

  // Calculate months difference between termination dates
  const calculateMonthsDifference = (oldTermination: number | null, newTermination: number | null): number => {
    // If either date is null, treat it as working until end of year (month 12)
    const effectiveOldMonth = oldTermination ?? 12;
    const effectiveNewMonth = newTermination ?? 12;

    // Calculate the difference in months
    // Positive means cost savings (terminating earlier)
    // Negative means additional cost (terminating later)
    return effectiveOldMonth - effectiveNewMonth;
  };

  const monthsDifference = calculateMonthsDifference(oldMonth, newMonth);
  const impact = monthsDifference * monthlySalary;

  return {
    impact,
    currentMonth,
    oldRemainingMonths: oldMonth ?? 12,
    newRemainingMonths: newMonth ?? 12,
    monthlySalary
  };
};

export default function SalaryTable({ data, onDataUpdate, sidebarExpanded = false }: SalaryTableProps) {
  const { isDemoMode } = useDemoMode();
  const theme = useTheme();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterText, setFilterText] = useState('');
  const [groupBy, setGroupBy] = useState<keyof Employee | ''>('');
  const [sortField, setSortField] = useState<SortField>('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterField, setFilterField] = useState<keyof Employee | ''>('');
  const [showLeadershipOnly, setShowLeadershipOnly] = useState(false);
  const [showTerminatedOnly, setShowTerminatedOnly] = useState(false);
  const [editingTitleId, setEditingTitleId] = useState<number | null>(null);
  const [editTitleValue, setEditTitleValue] = useState<string>('');
  const [editingSpecialtyId, setEditingSpecialtyId] = useState<number | null>(null);
  const [editSpecialtyValue, setEditSpecialtyValue] = useState<string>('');
  const [isNewEmployeeDialogOpen, setIsNewEmployeeDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [editingTerminationId, setEditingTerminationId] = useState<number | null>(null);
  const [editTerminationValue, setEditTerminationValue] = useState<string>('');
  const [editingDivisionId, setEditingDivisionId] = useState<number | null>(null);
  const [editDivisionValue, setEditDivisionValue] = useState<string>('');
  const [editingDepartmentId, setEditingDepartmentId] = useState<number | null>(null);
  const [editDepartmentValue, setEditDepartmentValue] = useState<string>('');
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Get unique departments and divisions for the dialog dropdowns
  const departments = useMemo(() => Array.from(new Set(data.map(emp => emp.department))), [data]);
  const divisions = useMemo(() => Array.from(new Set(data.map(emp => emp.division))), [data]);

  // Transform data if demo mode is enabled
  const displayData = useMemo(() => {
    return isDemoMode ? transformEmployeesData(data) : data;
  }, [data, isDemoMode]);

  const handleAddEmployee = (newEmployee: Omit<Employee, 'id'>) => {
    // Find the maximum ID and increment by 1 for the new employee
    const maxId = Math.max(...data.map(emp => emp.id), 0);
    const employeeWithId: Employee = {
      ...newEmployee,
      id: maxId + 1
    };
    
    onDataUpdate([...data, employeeWithId]);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const startEdit = (employee: Employee) => {
    setEditingId(employee.id);
    setEditValue(employee.salary.toString());
  };

  const handleSave = (employee: Employee) => {
    const newSalary = parseFloat(editValue);
    if (!isNaN(newSalary) && newSalary >= 0) {
      const newData = data.map(emp =>
        emp.id === employee.id ? { ...emp, salary: newSalary } : emp
      );
      onDataUpdate(newData);
    }
    setEditingId(null);
  };

  const handleSort = (field: keyof Employee) => {
    setSortOrder(sortField === field && sortOrder === 'asc' ? 'desc' : 'asc');
    setSortField(field);
  };

  const handleTitleSave = (employee: Employee) => {
    if (editTitleValue.trim()) {
      const newData = data.map(emp =>
        emp.id === employee.id ? { ...emp, position: editTitleValue.trim() } : emp
      );
      onDataUpdate(newData);
      setEditingTitleId(null);
      setEditTitleValue('');
    }
  };

  const startTitleEdit = (employee: Employee) => {
    setEditingTitleId(employee.id);
    setEditTitleValue(employee.position);
  };

  const toggleLeadership = (employee: Employee) => {
    console.log('Toggle leadership clicked for:', employee);
    
    // Create new data array with the updated isLeadership value
    const newData = data.map(emp =>
      emp.id === employee.id ? { ...emp, isLeadership: !emp.isLeadership } : emp
    );

    console.log('Updating data with new leadership status');
    // Call onDataUpdate to persist changes to parent component
    onDataUpdate(newData);
  };

  const isLeadershipPosition = (employeeOrPosition: Employee | string): boolean => {
    if (typeof employeeOrPosition === 'string') {
      return false; // We no longer use position string to determine leadership
    }
    return employeeOrPosition.isLeadership;
  };

  // Modify the cell render to ensure click handler is properly bound
  const renderPositionCell = (employee: Employee) => {
    if (editingTitleId === employee.id) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            value={editTitleValue}
            onChange={(e) => setEditTitleValue(e.target.value)}
            size="small"
            fullWidth
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleTitleSave(employee);
              }
            }}
          />
          <IconButton onClick={() => handleTitleSave(employee)} size="small">
            <SaveIcon />
          </IconButton>
        </Box>
      );
    }
    
    return (
      <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
          <span>{employee.position}</span>
          <IconButton 
            className="edit-button"
            onClick={() => startTitleEdit(employee)} 
            size="small"
            color="secondary"
            sx={{ 
              opacity: 0,
              transition: 'opacity 0.2s',
              '&:hover': { opacity: 1 }
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{ width: 40, display: 'flex', justifyContent: 'center' }}>
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              console.log('Leadership icon clicked');
              toggleLeadership(employee);
            }}
            color={employee.isLeadership ? "primary" : "default"}
          >
            <Tooltip title={employee.isLeadership ? "Remove Leadership" : "Make Leader"}>
              <span>
                {employee.isLeadership ? 
                  <PersonIcon fontSize="small" /> : 
                  <PersonOutlineIcon fontSize="small" />
                }
              </span>
            </Tooltip>
          </IconButton>
        </Box>
      </Stack>
    );
  };

  const handleTerminationSave = (employee: Employee) => {
    const oldTerminationMonth = employee.termination_month;
    const newTerminationMonth = editTerminationValue === '' ? null : Number(editTerminationValue);
    
    if (newTerminationMonth === null || (newTerminationMonth >= 1 && newTerminationMonth <= 12)) {
      const {
        impact,
        currentMonth,
        oldRemainingMonths,
        newRemainingMonths,
        monthlySalary
      } = calculateTerminationImpact(employee, oldTerminationMonth, newTerminationMonth);
      
      const formattedImpact = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(Math.abs(impact));

      const formattedSalary = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(monthlySalary);

      const message = [
        '<h1>Financial Impact</h1>',
        `${impact > 0 ? 'Cost Savings of' : 'Additional Cost of'} <strong>${formattedImpact}</strong>`,
        '',
        'Calculation:',
        `Monthly Salary: [${formattedSalary}]`,
        `Current Month: [Month ${currentMonth}]`,
        `Old Termination: [${oldTerminationMonth ? `Month ${oldTerminationMonth}` : 'End of Year'}]`,
        `New Termination: [${newTerminationMonth ? `Month ${newTerminationMonth}` : 'End of Year'}]`,
        '',
        'Net Difference:',
        `[${Math.abs(oldRemainingMonths - newRemainingMonths)} month(s)]`,
        '',
        'Impact Calculation:',
        `[${Math.abs(oldRemainingMonths - newRemainingMonths)} months] × [${formattedSalary}] = <strong>${formattedImpact}</strong>`
      ].join('\n');

      const newData = data.map(emp =>
        emp.id === employee.id ? { ...emp, termination_month: newTerminationMonth } : emp
      );
      onDataUpdate(newData);

      setSnackbar({
        open: true,
        message: message,
        severity: impact > 0 ? 'success' : 'info'
      });
    }
    setEditingTerminationId(null);
    setEditTerminationValue('');
  };

  const startTerminationEdit = (employee: Employee) => {
    setEditingTerminationId(employee.id);
    setEditTerminationValue(employee.termination_month !== null ? employee.termination_month.toString() : '');
  };

  const getMonthName = (month: number | null): string => {
    if (!month) return '';
    return dayjs().month(month - 1).format('MMM').toUpperCase();
  };

  const startDivisionEdit = (employee: Employee) => {
    setEditingDivisionId(employee.id);
    setEditDivisionValue(employee.division);
  };

  const handleDivisionSave = (employee: Employee) => {
    if (editDivisionValue.trim()) {
      const newData = data.map(emp =>
        emp.id === employee.id ? { ...emp, division: editDivisionValue.trim() } : emp
      );
      onDataUpdate(newData);
    }
    setEditingDivisionId(null);
  };

  const startDepartmentEdit = (employee: Employee) => {
    setEditingDepartmentId(employee.id);
    setEditDepartmentValue(employee.department);
  };

  const handleDepartmentSave = (employee: Employee) => {
    if (editDepartmentValue.trim()) {
      const newData = data.map(emp =>
        emp.id === employee.id ? { ...emp, department: editDepartmentValue.trim() } : emp
      );
      onDataUpdate(newData);
    }
    setEditingDepartmentId(null);
  };

  const startSpecialtyEdit = (employee: Employee) => {
    setEditingSpecialtyId(employee.id);
    setEditSpecialtyValue(employee.specialty);
  };

  const handleSpecialtySave = (employee: Employee) => {
    if (editSpecialtyValue.trim()) {
      const newData = data.map(emp =>
        emp.id === employee.id ? { ...emp, specialty: editSpecialtyValue.trim() } : emp
      );
      onDataUpdate(newData);
    }
    setEditingSpecialtyId(null);
  };

  const filteredAndSortedData = useMemo(() => {
    let result = [...displayData];

    // Apply leadership filter
    if (showLeadershipOnly) {
      result = result.filter(employee => employee.isLeadership);
    }

    // Apply termination filter
    if (showTerminatedOnly) {
      result = result.filter(employee => employee.termination_month !== null);
    }

    // Apply filtering
    if (filterText && filterField) {
      result = result.filter(employee => {
        const value = employee[filterField];
        return value?.toString().toLowerCase().includes(filterText.toLowerCase()) ?? false;
      });
    }

    // Apply sorting
    if (sortField) {
      result.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortOrder === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        return sortOrder === 'asc'
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      });
    }

    return result;
  }, [displayData, filterText, filterField, sortField, sortOrder, showLeadershipOnly, showTerminatedOnly]);

  const groupedData = useMemo(() => {
    if (!groupBy) return { '': filteredAndSortedData };
    
    return filteredAndSortedData.reduce((acc, employee) => {
      const groupValue = employee[groupBy]?.toString() ?? 'Unspecified';
      if (!acc[groupValue]) {
        acc[groupValue] = [];
      }
      acc[groupValue].push(employee);
      return acc;
    }, {} as Record<string, Employee[]>);
  }, [filteredAndSortedData, groupBy]);

  const renderTableHeader = () => (
    <TableHead>
      <TableRow>
        <TableCell sx={{ minWidth: 50 }}>
          <TableSortLabel
            active={sortField === 'id'}
            direction={sortOrder}
            onClick={() => handleSort('id')}
          >
            ID
          </TableSortLabel>
        </TableCell>
        <TableCell sx={{ minWidth: 150 }}>
          <TableSortLabel
            active={sortField === 'name'}
            direction={sortOrder}
            onClick={() => handleSort('name')}
          >
            Name
          </TableSortLabel>
        </TableCell>
        <TableCell sx={{ minWidth: 200 }}>
          <TableSortLabel
            active={sortField === 'position'}
            direction={sortOrder}
            onClick={() => handleSort('position')}
          >
            Position
          </TableSortLabel>
        </TableCell>
        <TableCell sx={{ minWidth: 150 }}>
          <TableSortLabel
            active={sortField === 'specialty'}
            direction={sortOrder}
            onClick={() => handleSort('specialty')}
          >
            Specialty
          </TableSortLabel>
        </TableCell>
        <TableCell sx={{ minWidth: 150 }}>
          <TableSortLabel
            active={sortField === 'department'}
            direction={sortOrder}
            onClick={() => handleSort('department')}
          >
            Department
          </TableSortLabel>
        </TableCell>
        <TableCell sx={{ minWidth: 150 }}>
          <TableSortLabel
            active={sortField === 'division'}
            direction={sortOrder}
            onClick={() => handleSort('division')}
          >
            Division
          </TableSortLabel>
        </TableCell>
        <TableCell sx={{ minWidth: 120 }}>
          <TableSortLabel
            active={sortField === 'salary'}
            direction={sortOrder}
            onClick={() => handleSort('salary')}
          >
            Salary
          </TableSortLabel>
        </TableCell>
        <TableCell sx={{ minWidth: 150 }}>
          <TableSortLabel
            active={sortField === 'termination_month'}
            direction={sortOrder}
            onClick={() => handleSort('termination_month')}
          >
            Termination
          </TableSortLabel>
        </TableCell>
        <TableCell sx={{ minWidth: 80 }}>Actions</TableCell>
      </TableRow>
    </TableHead>
  );

  const handleDeleteClick = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (employeeToDelete) {
      const newData = data.filter(emp => emp.id !== employeeToDelete.id);
      onDataUpdate(newData);
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      <Box sx={{ 
        height: { xs: 'calc(100vh - 280px)', sm: 'calc(100vh - 300px)', md: 'calc(100vh - 320px)' },
        width: '100%',
        maxWidth: '100%',
        overflow: 'auto',
        mb: { xs: 8, sm: 2 } // Add margin bottom for pagination
      }}>
        <TableContainer 
          component={Paper} 
          sx={{ 
            width: '100%',
            maxWidth: '100%',
            overflowX: 'auto',
            minWidth: '100%'
          }}
        >
          <Toolbar 
            sx={{ 
              pl: { xs: 1, sm: 2 }, 
              pr: { xs: 1, sm: 1 },
              flexWrap: 'wrap',
              gap: 1
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              width: '100%',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 1
              }}>
                <Typography 
                  sx={{ 
                    flex: { xs: '1 1 auto' },
                    mb: { xs: 0 }
                  }} 
                  variant="h6" 
                  component="div"
                >
                  Employees
                  {isDemoMode && (
                    <Chip
                      label="Demo Mode"
                      color="warning"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => setIsNewEmployeeDialogOpen(true)}
                  variant="contained"
                  size="small"
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Add Employee
                </Button>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                gap: 2,
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showLeadershipOnly}
                      onChange={(e) => setShowLeadershipOnly(e.target.checked)}
                      size="small"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PersonIcon fontSize="small" />
                      <Typography variant="body2">Leadership</Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={showTerminatedOnly}
                      onChange={(e) => setShowTerminatedOnly(e.target.checked)}
                      size="small"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="body2" color={theme.palette.error.main}>Terminated</Typography>
                    </Box>
                  }
                />
              </Box>
            </Box>
          </Toolbar>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 50 }}>
                  <TableSortLabel
                    active={sortField === 'id'}
                    direction={sortOrder}
                    onClick={() => handleSort('id')}
                  >
                    ID
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ minWidth: 150 }}>
                  <TableSortLabel
                    active={sortField === 'name'}
                    direction={sortOrder}
                    onClick={() => handleSort('name')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ minWidth: 200 }}>
                  <TableSortLabel
                    active={sortField === 'position'}
                    direction={sortOrder}
                    onClick={() => handleSort('position')}
                  >
                    Position
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ minWidth: 150 }}>
                  <TableSortLabel
                    active={sortField === 'specialty'}
                    direction={sortOrder}
                    onClick={() => handleSort('specialty')}
                  >
                    Specialty
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ minWidth: 150 }}>
                  <TableSortLabel
                    active={sortField === 'department'}
                    direction={sortOrder}
                    onClick={() => handleSort('department')}
                  >
                    Department
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ minWidth: 150 }}>
                  <TableSortLabel
                    active={sortField === 'division'}
                    direction={sortOrder}
                    onClick={() => handleSort('division')}
                  >
                    Division
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ minWidth: 120 }}>
                  <TableSortLabel
                    active={sortField === 'salary'}
                    direction={sortOrder}
                    onClick={() => handleSort('salary')}
                  >
                    Salary
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ minWidth: 150 }}>
                  <TableSortLabel
                    active={sortField === 'termination_month'}
                    direction={sortOrder}
                    onClick={() => handleSort('termination_month')}
                  >
                    Termination
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ minWidth: 80 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groupedData[groupBy]
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((employee: Employee) => (
                  <TableRow key={employee.id}>
                    <TableCell sx={{ width: 60 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 40 }}>
                        {employee.id}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ width: 200 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 40 }}>
                        {employee.name}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ width: 250 }}>
                      {editingTitleId === employee.id ? (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          minHeight: 40,
                          minWidth: 200 
                        }}>
                          <TextField
                            value={editTitleValue}
                            onChange={(e) => setEditTitleValue(e.target.value)}
                            size="small"
                            fullWidth
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleTitleSave(employee);
                              }
                            }}
                          />
                          <IconButton onClick={() => handleTitleSave(employee)} size="small">
                            <SaveIcon />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            minHeight: 40,
                            '& .edit-button': {
                              opacity: 0,
                              transition: 'opacity 0.2s'
                            },
                            '&:hover .edit-button': {
                              opacity: 1
                            }
                          }}
                        >
                          {renderPositionCell(employee)}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={{ width: 200 }}>
                      {editingSpecialtyId === employee.id ? (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          minHeight: 40,
                          minWidth: 150 
                        }}>
                          <TextField
                            value={editSpecialtyValue}
                            onChange={(e) => setEditSpecialtyValue(e.target.value)}
                            size="small"
                            fullWidth
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleSpecialtySave(employee);
                              }
                            }}
                          />
                          <IconButton onClick={() => handleSpecialtySave(employee)} size="small">
                            <SaveIcon />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            minHeight: 40,
                            '& .edit-button': {
                              opacity: 0,
                              transition: 'opacity 0.2s'
                            },
                            '&:hover .edit-button': {
                              opacity: 1
                            }
                          }}
                        >
                          {employee.specialty}
                          <IconButton 
                            className="edit-button"
                            onClick={() => startSpecialtyEdit(employee)} 
                            size="small"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={{ width: 200 }}>
                      {editingDepartmentId === employee.id ? (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          minHeight: 40,
                          minWidth: 150 
                        }}>
                          <FormControl fullWidth size="small">
                            <Select
                              value={editDepartmentValue}
                              onChange={(e) => setEditDepartmentValue(e.target.value)}
                            >
                              {departments.map((dept) => (
                                <MenuItem key={dept} value={dept}>
                                  {dept}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <IconButton onClick={() => handleDepartmentSave(employee)} size="small">
                            <SaveIcon />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            minHeight: 40,
                            '& .edit-button': {
                              opacity: 0,
                              transition: 'opacity 0.2s'
                            },
                            '&:hover .edit-button': {
                              opacity: 1
                            }
                          }}
                        >
                          {employee.department}
                          <IconButton 
                            className="edit-button"
                            onClick={() => startDepartmentEdit(employee)} 
                            size="small"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={{ width: 200 }}>
                      {editingDivisionId === employee.id ? (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          minHeight: 40,
                          minWidth: 150 
                        }}>
                          <TextField
                            value={editDivisionValue}
                            onChange={(e) => setEditDivisionValue(e.target.value)}
                            size="small"
                            fullWidth
                          />
                          <IconButton onClick={() => handleDivisionSave(employee)} size="small">
                            <SaveIcon />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            minHeight: 40,
                            '& .edit-button': {
                              opacity: 0,
                              transition: 'opacity 0.2s'
                            },
                            '&:hover .edit-button': {
                              opacity: 1
                            }
                          }}
                        >
                          {employee.division}
                          <IconButton 
                            className="edit-button"
                            onClick={() => startDivisionEdit(employee)} 
                            size="small"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={{ width: 150 }}>
                      {editingId === employee.id ? (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          minHeight: 40,
                          minWidth: 120 
                        }}>
                          <TextField
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            type="number"
                            size="small"
                            fullWidth
                          />
                          <IconButton onClick={() => handleSave(employee)} size="small">
                            <SaveIcon />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            minHeight: 40,
                            '& .edit-button': {
                              opacity: 0,
                              transition: 'opacity 0.2s'
                            },
                            '&:hover .edit-button': {
                              opacity: 1
                            }
                          }}
                        >
                          {employee.salary}
                          <IconButton 
                            className="edit-button"
                            onClick={() => startEdit(employee)} 
                            size="small"
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={{ width: 200 }}>
                      {editingTerminationId === employee.id ? (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          minHeight: 40,
                          minWidth: 150 
                        }}>
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <DatePicker
                                views={['month']}
                                value={editTerminationValue ? dayjs().month(Number(editTerminationValue) - 1) : null}
                                onChange={(newDate) => {
                                  if (newDate) {
                                    const month = newDate.month() + 1;
                                    setEditTerminationValue(month.toString());
                                  } else {
                                    setEditTerminationValue('');
                                  }
                                }}
                                sx={{ maxWidth: 200 }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => handleTerminationSave(employee)}
                              >
                                <SaveIcon />
                              </IconButton>
                            </Stack>
                          </LocalizationProvider>
                        </Box>
                      ) : (
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            minHeight: 40,
                            '& .edit-button': {
                              opacity: 0,
                              transition: 'opacity 0.2s'
                            },
                            '&:hover .edit-button': {
                              opacity: 1
                            }
                          }}
                        >
                          {getMonthName(employee.termination_month)}
                          <IconButton
                            className="edit-button"
                            size="small"
                            onClick={() => startTerminationEdit(employee)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={{ width: 100 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 40 }}>
                        <Tooltip title="Delete Employee">
                          <IconButton onClick={() => handleDeleteClick(employee)} color="error" size="small">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Box sx={{ 
        position: 'sticky',
        bottom: { xs: 64, sm: 0 }, // Account for bottom navigation on mobile
        backgroundColor: theme.palette.background.default,
        borderTop: `1px solid ${theme.palette.divider}`,
        display: 'flex', 
        justifyContent: 'flex-end',
        width: '100%',
        zIndex: 2
      }}>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={groupedData[groupBy].length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            '.MuiTablePagination-select': {
              display: 'inline-block'
            },
            '.MuiTablePagination-selectLabel': {
              display: 'inline-block'
            },
            '.MuiTablePagination-displayedRows': {
              display: 'inline-block'
            },
            '.MuiTablePagination-actions': {
              display: 'inline-flex',
              marginLeft: 2
            }
          }}
        />
      </Box>
      <Snackbar
        open={snackbar.open}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        autoHideDuration={null}
      >
        <Alert
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            '& .MuiAlert-message': {
              whiteSpace: 'pre-line',
              fontFamily: 'monospace',
              '& h1': {
                fontSize: '1.5em',
                fontWeight: 'bold',
                margin: '0 0 8px 0'
              },
              '& strong': {
                fontWeight: 'bold'
              }
            },
            '& .MuiAlert-action': {
              alignItems: 'flex-start',
              paddingTop: 1
            }
          }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setSnackbar(prev => ({ ...prev, open: false }))}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          <React.Fragment>
            <div dangerouslySetInnerHTML={{ __html: snackbar.message }} />
          </React.Fragment>
        </Alert>
      </Snackbar>
      <NewEmployeeDialog
        open={isNewEmployeeDialogOpen}
        onClose={() => setIsNewEmployeeDialogOpen(false)}
        onAdd={handleAddEmployee}
        departments={departments}
        divisions={divisions}
      />
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        employeeName={employeeToDelete?.name || ''}
      />
    </Box>
  );
} 