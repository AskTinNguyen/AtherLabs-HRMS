import React from 'react';
import { Fab, useTheme, alpha } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';

interface FloatingAIButtonProps {
  onClick: () => void;
  expanded?: boolean;
}

const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({ 
  onClick,
  expanded = true
}) => {
  const theme = useTheme();

  return (
    <Fab
      color="primary"
      aria-label="chat"
      onClick={onClick}
      sx={{
        position: 'fixed',
        right: expanded ? 32 : 88,
        bottom: 32,
        transition: theme.transitions.create(['right'], {
          duration: theme.transitions.duration.standard,
          easing: theme.transitions.easing.easeInOut,
        }),
        backgroundColor: theme.palette.mode === 'dark' 
          ? alpha(theme.palette.primary.main, 0.9)
          : theme.palette.primary.main,
        '&:hover': {
          backgroundColor: theme.palette.mode === 'dark'
            ? alpha(theme.palette.primary.main, 0.7)
            : theme.palette.primary.dark,
        }
      }}
    >
      <SmartToyIcon />
    </Fab>
  );
};

export default FloatingAIButton; 