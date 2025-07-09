"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Loading...');

  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  const showLoading = (message: string = 'Loading...') => {
    setLoadingMessage(message);
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  return (
    <LoadingContext.Provider value={{ 
      isLoading, 
      setLoading, 
      showLoading, 
      hideLoading 
    }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <LoadingSpinner size="lg" text={loadingMessage} />
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}; 