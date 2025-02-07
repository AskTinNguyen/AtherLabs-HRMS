import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Box,
  Paper,
  InputAdornment,
  useTheme,
  CircularProgress,
  alpha,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ChatMessageItem from './ChatMessageItem';
import { ChatMessage, ChatSettings, ChatState } from './types';
import { getAIService } from '../../services/ai';
import { SalaryData } from '../../types/salary';
import { CustomDashboard, DashboardComponent } from '../../types/dashboard';
import { v4 as uuidv4 } from 'uuid';

// Helper function to generate a simple ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

interface ChatDialogProps {
  open: boolean;
  onClose: () => void;
  hrData: SalaryData;
  settings: ChatSettings;
  onSettingsSave: (settings: ChatSettings) => void;
  isSidebarExpanded: boolean;
  onDashboardGenerated?: (dashboard: CustomDashboard) => void;
}

const defaultSettings: ChatSettings = {
  apiKey: '',
  modelProvider: 'gemini',
  theme: 'light',
  retainHistory: true,
};

const ChatDialog: React.FC<ChatDialogProps> = ({ 
  open, 
  onClose, 
  hrData,
  settings = defaultSettings,
  onSettingsSave,
  isSidebarExpanded,
  onDashboardGenerated,
}) => {
  const [message, setMessage] = useState('');
  const [chatState, setChatState] = useState<ChatState>(() => {
    try {
      const savedState = localStorage.getItem('chatState');
      if (savedState) {
        const parsed = JSON.parse(savedState, (key, value) => {
          if (key === 'timestamp') return new Date(value);
          return value;
        });
        return {
          ...parsed,
          settings, // Use provided settings
        };
      }
    } catch (error) {
      console.warn('Could not load chat state from localStorage:', error);
    }
    return {
      messages: [],
      settings, // Use provided settings
      isLoading: false,
      error: null,
    };
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages]);

  useEffect(() => {
    if (chatState.settings.retainHistory) {
      try {
        localStorage.setItem('chatState', JSON.stringify(chatState));
      } catch (error) {
        console.warn('Could not save chat state to localStorage:', error);
      }
    }
  }, [chatState]);

  // Create a stable reference to the AI service
  const aiServiceRef = useRef<any>(null);

  useEffect(() => {
    if (!aiServiceRef.current && chatState.settings.apiKey) {
      const service = getAIService(chatState.settings.apiKey, chatState.settings.modelProvider);
      if (hrData) {
        service.setHRData(hrData);
      }
      aiServiceRef.current = service;
    }
  }, [chatState.settings.apiKey, chatState.settings.modelProvider, hrData]);

  // Update chat state when settings change
  useEffect(() => {
    setChatState(prev => ({
      ...prev,
      settings,
    }));
  }, [settings]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !chatState.settings.apiKey) return;

    const newMessage: ChatMessage = {
      id: uuidv4(),
      content: message,
      sender: 'user',
      timestamp: new Date()
    };

    setChatState((prev) => ({
      ...prev,
      messages: [...prev.messages, newMessage],
      isLoading: true,
      error: null,
    }));

    setMessage('');

    try {
      const service = getAIService(chatState.settings.apiKey, chatState.settings.modelProvider);
      if (hrData) {
        service.setHRData(hrData);
      }

      // Check if this is a dashboard generation request
      const isDashboardRequest = /generate.*dashboard|create.*dashboard|show.*dashboard|compare.*department/i.test(message);

      let response: string;
      let generatedDashboard: CustomDashboard | undefined;

      if (isDashboardRequest) {
        try {
          const dashboard = await service.generateDashboard(message);
          if (dashboard) {
            generatedDashboard = dashboard;
            response = "✨ Dashboard generated successfully! I've created a dashboard with the following components:\n\n" +
              dashboard.components.map(comp => 
                `- ${comp.config.title}: ${comp.config.description}`
              ).join('\n');
            
            // Notify parent component about the new dashboard
            onDashboardGenerated?.(dashboard);
          } else {
            throw new Error('Failed to generate dashboard');
          }
        } catch (error) {
          console.error('Error generating dashboard:', error);
          response = "I encountered an error while generating the dashboard. Let me provide you with the data in text format instead:\n\n" +
                    await service.chatWithAI(message);
        }
      } else {
        response = await service.chatWithAI(message);
      }

      const aiMessage: ChatMessage = {
        id: uuidv4(),
        content: response,
        sender: 'ai',
        timestamp: new Date(),
        dashboard: generatedDashboard
      };

      setChatState((prev) => ({
        ...prev,
        messages: [...prev.messages, aiMessage],
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error in AI chat:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while processing your request';
      
      const aiMessage: ChatMessage = {
        id: uuidv4(),
        content: `Error: ${errorMessage}`,
        sender: 'ai',
        timestamp: new Date()
      };

      setChatState((prev) => ({
        ...prev,
        messages: [...prev.messages, aiMessage],
        isLoading: false,
        error: errorMessage,
      }));
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage(message);
    }
  };

  const handleSaveSettings = (newSettings: ChatSettings) => {
    setChatState((prev) => ({
      ...prev,
      settings: newSettings,
    }));
  };

  const handleClearHistory = () => {
    setChatState(prev => ({
      ...prev,
      messages: [],
      error: null,
    }));
    
    if (chatState.settings.retainHistory) {
      try {
        localStorage.removeItem('chatState');
      } catch (error) {
        console.warn('Could not clear chat state from localStorage:', error);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      PaperProps={{
        sx: {
          position: 'fixed',
          left: '50%',
          bottom: 20,
          transform: 'translateX(-50%)',
          width: '600px',
          minHeight: chatState.messages.length === 0 ? '100px' : '300px',
          maxHeight: '80vh',
          m: 0,
          backgroundColor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.background.paper, 0.95)
            : alpha(theme.palette.background.paper, 0.98),
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          boxShadow: theme.shadows[8],
          border: `1px solid ${alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.1 : 0.05)}`,
          display: 'flex',
          flexDirection: 'column',
          transition: theme.transitions.create(['height', 'min-height'], {
            duration: theme.transitions.duration.standard,
            easing: theme.transitions.easing.easeInOut,
          }),
        },
      }}
      sx={{
        '& .MuiDialog-container': {
          alignItems: 'flex-end',
          justifyContent: 'center',
        },
        '& .MuiBackdrop-root': {
          backgroundColor: 'transparent',
        },
        '& .MuiDialog-paper': {
          margin: 0,
          maxWidth: 'none',
        },
      }}
      TransitionProps={{
        timeout: {
          enter: 225,
          exit: 195,
        },
      }}
    >
      <DialogTitle 
        sx={{ 
          m: 0, 
          py: 1.5,
          px: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          minHeight: '48px',
        }}
      >
        <Box component="span" sx={{ 
          fontWeight: 500,
          fontSize: '0.95rem',
          color: theme.palette.mode === 'dark' ? alpha(theme.palette.text.primary, 0.9) : theme.palette.text.primary,
        }}>
          HR Assistant
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Clear chat history">
            <IconButton
              size="small"
              aria-label="clear history"
              onClick={handleClearHistory}
              sx={{ 
                color: theme.palette.text.secondary,
                padding: '4px',
                '&:hover': {
                  color: theme.palette.error.main,
                  backgroundColor: alpha(theme.palette.error.main, 0.05),
                }
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton
            size="small"
            aria-label="close"
            onClick={onClose}
            sx={{ 
              color: theme.palette.text.secondary,
              padding: '4px',
              '&:hover': {
                color: theme.palette.text.primary,
                backgroundColor: alpha(theme.palette.text.primary, 0.05),
              }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          p: 2, 
          gap: 1.5,
          height: chatState.messages.length === 0 ? 'auto' : 'calc(100% - 48px)',
          minHeight: chatState.messages.length === 0 ? '52px' : '252px',
          overflow: 'hidden',
          transition: theme.transitions.create(['height', 'min-height'], {
            duration: theme.transitions.duration.standard,
            easing: theme.transitions.easing.easeInOut,
          }),
        }}
      >
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            backgroundColor: 'transparent',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column-reverse',
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: alpha(theme.palette.text.primary, 0.1),
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {!chatState.settings.apiKey && (
              <Box sx={{ 
                textAlign: 'center', 
                color: theme.palette.text.secondary, 
                mt: 2,
                fontSize: '0.9rem',
              }}>
                Please configure your API key in settings to start chatting
              </Box>
            )}
            {chatState.messages.map((msg) => (
              <ChatMessageItem key={msg.id} message={msg} />
            ))}
            {chatState.isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={20} thickness={4} />
              </Box>
            )}
            {chatState.error && (
              <Box sx={{ 
                color: theme.palette.error.main, 
                textAlign: 'center', 
                mt: 2,
                fontSize: '0.9rem',
              }}>
                {chatState.error}
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>
        </Paper>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={chatState.settings.apiKey ? "Ask me anything..." : "Please set up your API key first"}
          disabled={!chatState.settings.apiKey || chatState.isLoading}
          size="small"
          sx={{
            mt: 'auto',
            '& .MuiOutlinedInput-root': {
              backgroundColor: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.background.paper, 0.3)
                : alpha(theme.palette.background.paper, 0.5),
              fontSize: '0.9rem',
              borderRadius: '8px',
              '& fieldset': {
                borderColor: alpha(theme.palette.divider, 0.1),
              },
              '&:hover fieldset': {
                borderColor: alpha(theme.palette.text.primary, 0.2),
              },
              '&.Mui-focused fieldset': {
                borderColor: alpha(theme.palette.primary.main, 0.5),
              }
            }
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton 
                  size="small"
                  onClick={() => handleSendMessage(message)} 
                  disabled={!message.trim() || !chatState.settings.apiKey || chatState.isLoading}
                  sx={{
                    color: message.trim() && chatState.settings.apiKey && !chatState.isLoading
                      ? theme.palette.primary.main
                      : theme.palette.text.disabled,
                    padding: '4px',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    }
                  }}
                >
                  {chatState.isLoading ? (
                    <CircularProgress size={18} thickness={4} />
                  ) : (
                    <SendIcon fontSize="small" />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ChatDialog; 