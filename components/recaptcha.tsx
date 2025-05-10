'use client';

import { Shield } from 'lucide-react';
import React, { useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

const SITE_KEY = '6LfaMTArAAAAALD2BVOI4ZP8MjcL_esx4_LBZhTT';

interface ReCaptchaProps {
  attempts: number;
  setAttempts: React.Dispatch<React.SetStateAction<number>>;
  setIsVerified: React.Dispatch<React.SetStateAction<boolean>>;
}

const ReCaptcha: React.FC<ReCaptchaProps> = ({ attempts, setAttempts, setIsVerified}) => {
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleSubmit = async (verifiedToken: string | null) => {
    setAttempts(attempts + 1);
  
    if (!verifiedToken) {
      alert('CAPTCHA verification failed. Please try again.');
      setIsVerified(true);
      recaptchaRef.current?.reset(); // Reset the CAPTCHA
      return;
    }

    try {
      const response = await fetch('/api/verify-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verifiedToken }),
      });

      const data = await response.json();
      if (data.success) {
        setIsVerified(true);
      } else {
        alert('CAPTCHA verification failed. Please try again.');
        setIsVerified(false);
        recaptchaRef.current?.reset(); // Reset the CAPTCHA
      }
    } catch (error) {
      console.error('Error verifying CAPTCHA:', error);
      alert('An error occurred during CAPTCHA verification. Please try again.');
      setIsVerified(true);
      recaptchaRef.current?.reset(); // Reset the CAPTCHA
    }
  };

  return (
  <>
    <div
      className="rounded-xl overflow-hidden w-[300px] h-[75px] bg-transparent"
      style={{ boxShadow: '0 0 0 1px #333' }}
    >
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={SITE_KEY}
        onChange={handleSubmit}
        onExpired={() => handleSubmit(null)}
        onErrored={() => handleSubmit(null)}
        theme="dark"
      />
    </div>
       <div className="flex items-center justify-center text-xs text-slate-500">   
            <Shield className="h-3 w-3 mr-1" />
        <span>Protected by reCAPTCHA</span>
      </div>
  </>
  );
};

export default ReCaptcha;
