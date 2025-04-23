'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface FaceDetectionContextType {
  capturedImage: string | null;
  setCapturedImage: (image: string | null) => void;
}

const FaceDetectionContext = createContext<FaceDetectionContextType | undefined>(undefined);

export function FaceDetectionProvider({ children }: { children: ReactNode }) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  return (
    <FaceDetectionContext.Provider value={{ capturedImage, setCapturedImage }}>
      {children}
    </FaceDetectionContext.Provider>
  );
}

export function useFaceDetection() {
  const context = useContext(FaceDetectionContext);
  if (context === undefined) {
    throw new Error('useFaceDetection must be used within a FaceDetectionProvider');
  }
  return context;
} 