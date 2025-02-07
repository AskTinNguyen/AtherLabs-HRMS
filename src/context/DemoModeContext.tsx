import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DemoModeContextType {
  isDemoMode: boolean;
  setIsDemoMode: (value: boolean) => void;
  isAdminVerified: boolean;
  setIsAdminVerified: (value: boolean) => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export const DemoModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isAdminVerified, setIsAdminVerified] = useState(false);

  return (
    <DemoModeContext.Provider 
      value={{ 
        isDemoMode, 
        setIsDemoMode, 
        isAdminVerified, 
        setIsAdminVerified 
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
};

export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  if (context === undefined) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
}; 