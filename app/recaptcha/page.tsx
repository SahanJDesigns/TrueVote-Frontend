'use client'

import React, { useState } from 'react';
import ReCaptcha from './recaptcha';
import { useRobot } from './robocontext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const ReCaptchaPage = () => {
  const { isRobot, setIsRobot } = useRobot();
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);
  const [lockedOut, setLockedOut] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0); // Add this state
  const MAX_ATTEMPTS = 3; // Add this constant

  const handleVerify = (token: string | null) => {
    setVerifiedToken(token);
  };

  const handleLock = () => {
    setLockedOut(true);
    setIsRobot(1);
  };

  const handleSubmit = async () => {
    if (attempts >= MAX_ATTEMPTS) { // Change this condition
      alert('You cannot submit anymore. You have reached the maximum number of CAPTCHA attempts.');
      return;
    }

    if (!verifiedToken) {
      alert('Please complete the reCAPTCHA');
      return;
    }

    const response = await fetch('/api/verify-captcha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: verifiedToken }),
    });

    const data = await response.json();
    alert(data.success ? 'CAPTCHA verified!' : 'CAPTCHA failed!');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <main className="container mx-auto px-4 py-8">
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Please verify that you are not a robot</CardTitle>
            <CardDescription className="text-slate-400">Complete the CAPTCHA to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ReCaptcha 
              onVerify={handleVerify} 
              onLock={handleLock} 
              attempts={attempts} 
              setAttempts={setAttempts} 
            />
            {attempts >= MAX_ATTEMPTS && ( // Change this condition
              <p className="text-red-500">You are locked out due to too many failed attempts.</p>
            )}

            <Button
              className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={handleSubmit}
              disabled={attempts >= MAX_ATTEMPTS} // Change this condition
            >
              Cast your vote
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ReCaptchaPage;