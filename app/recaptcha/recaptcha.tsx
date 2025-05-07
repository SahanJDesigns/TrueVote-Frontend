'use client'

import React, { useState, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useRobot } from './robocontext';

const SITE_KEY = '6LfaMTArAAAAALD2BVOI4ZP8MjcL_esx4_LBZhTT';

interface ReCaptchaProps {
  onVerify: (token: string | null) => void;
  onLock: () => void;
  attempts: number; // Add this line
  setAttempts: React.Dispatch<React.SetStateAction<number>>; // Add this line
}

const ReCaptcha: React.FC<ReCaptchaProps> = ({ onVerify, onLock, attempts, setAttempts }) => {
  const [token, setToken] = useState<string | null>(null);
  const { setIsRobot } = useRobot();
  const MAX_ATTEMPTS = 3;

  useEffect(() => {
    const storedAttempts = localStorage.getItem('attempts');
    if (storedAttempts) {
      const parsed = parseInt(storedAttempts);
      setAttempts(parsed);
      if (parsed >= 1) {
        setIsRobot(1);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('attempts', attempts.toString());
    if (attempts >= 1) {
      setIsRobot(1);
    }
  }, [attempts]);

  const handleChange = (value: string | null) => {
    if (attempts >= MAX_ATTEMPTS) return;

    if (value) {
      setToken(value);
      onVerify(value);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      onVerify(null);
      if (newAttempts >= MAX_ATTEMPTS) {
        onLock();
      }
    }
  };

  const resetAttempts = () => {
    setAttempts(0);
    setIsRobot(0);
    localStorage.setItem('attempts', '0');
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* ReCAPTCHA component */}
      {attempts < MAX_ATTEMPTS && (
        <ReCAPTCHA
          sitekey={SITE_KEY}
          onChange={handleChange}
          onExpired={() => handleChange(null)}
          onErrored={() => handleChange(null)}
          theme="light"
          className="mt-6"
        />
      )}

      {/* Small reset button at the bottom */}
      <button
        onClick={resetAttempts}
        className="text-xs text-gray-400 hover:text-gray-300 mt-2"
      >
        Reset Attempts (Test Only)
      </button>
    </div>
  );
};

export default ReCaptcha;