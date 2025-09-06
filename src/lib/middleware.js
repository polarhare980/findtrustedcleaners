import { verifyToken } from './auth';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const token = req.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const user = verifyToken(token);

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Pass user info to request
  req.user = user;
  return NextResponse.next();
}