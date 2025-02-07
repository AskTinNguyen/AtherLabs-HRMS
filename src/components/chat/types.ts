import { CustomDashboard } from '../../types/dashboard';

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  sender: 'user' | 'ai';
  dashboard?: CustomDashboard;
}

export type ModelProvider = 'gemini' | 'openai' | 'claude';

export interface ChatSettings {
  apiKey: string;
  modelProvider: ModelProvider;
  theme: 'light' | 'dark';
  retainHistory: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  settings: ChatSettings;
  isLoading: boolean;
  error: string | null;
} 