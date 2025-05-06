// pages/api/verify-captcha.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const SECRET_KEY = '6LfaMTArAAAAAJ9L4Qd2bY8FZ1YXJu9eE98gaYoy'; // Replace with your secret key

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: 'No token provided' });
  }

  const response = await fetch(`${VERIFY_URL}?secret=${SECRET_KEY}&response=${token}`, {
    method: 'POST',
  });

  const data = await response.json();

  if (data.success) {
    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ success: false, message: 'CAPTCHA verification failed' });
}
