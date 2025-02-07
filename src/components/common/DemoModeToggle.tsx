import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Typography,
  Alert,
  Paper,
} from '@mui/material';
import { useDemoMode } from '../../context/DemoModeContext';

// In a real application, this should be stored securely, not hardcoded
const ADMIN_PASSWORD = 'demo123';

export const DemoModeToggle: React.FC = () => {
  const { isDemoMode, setIsDemoMode, isAdminVerified, setIsAdminVerified } = useDemoMode();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handlePasswordSubmit = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAdminVerified(true);
      setError('');
    } else {
      setError('Invalid password');
    }
    setPassword('');
  };

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsDemoMode(event.target.checked);
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 400, mx: 'auto', my: 2 }}>
      <Typography variant="h6" gutterBottom>
        Demo Mode Settings
      </Typography>
      
      {!isAdminVerified ? (
        <Box>
          <TextField
            fullWidth
            type="password"
            label="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!error}
            helperText={error}
            margin="normal"
          />
          <Button
            variant="contained"
            onClick={handlePasswordSubmit}
            fullWidth
            sx={{ mt: 1 }}
          >
            Verify
          </Button>
        </Box>
      ) : (
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={isDemoMode}
                onChange={handleToggle}
                color="primary"
              />
            }
            label="Enable Demo Mode"
          />
          {isDemoMode && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Demo mode is active. Employee names and salaries are being obfuscated.
            </Alert>
          )}
          <Button
            variant="outlined"
            onClick={() => setIsAdminVerified(false)}
            sx={{ mt: 2 }}
            fullWidth
          >
            Lock Settings
          </Button>
        </Box>
      )}
    </Paper>
  );
}; 