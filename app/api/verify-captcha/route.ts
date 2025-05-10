import { NextResponse } from 'next/server';

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const SECRET_KEY = '6LfaMTArAAAAAJ9L4Qd2bY8FZ1YXJu9eE98gaYoy'; // Replace with your secret key

export async function POST(req: Request) {
  const body = await req.json();
  const { token } = body;

  if (!token) {
    return NextResponse.json({ success: false, message: 'No token provided' }, { status: 400 });
  }

  const response = await fetch(`${VERIFY_URL}?secret=${SECRET_KEY}&response=${token}`, {
    method: 'POST',
  });

  const data = await response.json();

  if (data.success) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  return NextResponse.json({ success: false, message: 'CAPTCHA verification failed' }, { status: 400 });
}
