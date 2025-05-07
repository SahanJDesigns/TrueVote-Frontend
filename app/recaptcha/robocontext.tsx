// app/recaptcha/robocontext.tsx
'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

interface RobotContextType {
  isRobot: number;
  setIsRobot: React.Dispatch<React.SetStateAction<number>>;
}

const RobotContext = createContext<RobotContextType | undefined>(undefined);

export const useRobot = () => {
  const context = useContext(RobotContext);
  if (!context) {
    throw new Error('useRobot must be used within a RobotProvider');
  }
  return context;
};

export const RobotProvider: React.FC = ({ children }) => {
  const [isRobot, setIsRobot] = useState<number>(0);

  // Load isRobot value from localStorage on mount
  useEffect(() => {
    const storedIsRobot = localStorage.getItem('isRobot');
    if (storedIsRobot) {
      setIsRobot(parseInt(storedIsRobot));
    }
  }, []);

  // Save isRobot to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('isRobot', isRobot.toString());
  }, [isRobot]);

  return (
    <RobotContext.Provider value={{ isRobot, setIsRobot }}>
      {children}
    </RobotContext.Provider>
  );
};
