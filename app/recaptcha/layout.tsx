// app/recaptcha/layout.tsx
import React from 'react';
import { RobotProvider } from './robocontext';

export default function RecaptchaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RobotProvider>
      {children}
    </RobotProvider>
  );
}
