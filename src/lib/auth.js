// src/lib/auth.js
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'token';

/* ---------------- Internal: read secret safely ---------------- */
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Don't throw at import-time to avoid breaking Vercel build;
    // throw only when a JWT op is actually attempted.
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return secret;
}

/* ---------------- JWT helpers ---------------- */
export function createToken(payload) {
  const JWT_SECRET = getJwtSecret();
  return jwt.sign(
    { ...payload, _id: payload._id?.toString?.() || payload._id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  try {
    const JWT_SECRET = getJwtSecret();
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('JWT verification failed:', err?.message);
    }
    return null;
  }
}

/* ---------------- Cookie helpers ---------------- */

/** Extract token from a NextRequest (route handlers/middleware) */
export function getTokenFromRequest(req) {
  const cookieHeader = req?.headers?.get?.('cookie') || '';
  const c = parse(cookieHeader);
  return c[COOKIE_NAME];
}

/** SERVER CONTEXT: set cookie using next/headers (Server Component, Server Action, Route Handler). */
export function setAuthCookie(token) {
  // Must be called on server (route handler, server action, or server component)
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/** SERVER CONTEXT: clear cookie using next/headers (✅ this fixes your missing export) */
export function clearAuthCookie() {
  // Must be called on server (route handler, server action, or server component)
  cookies().set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/** API ROUTE STYLE: set cookie on an existing NextResponse and return it. */
export function setAuthCookieOnResponse(res, token) {
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

/** API ROUTE STYLE: clear cookie on an existing NextResponse and return it. */
export function clearAuthCookieOnResponse(res) {
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}

/** SERVER CONTEXT: read current user from cookies() (e.g., in layouts/server actions). */
export function getUserFromServerCookies() {
  const token = cookies().get(COOKIE_NAME)?.value;
  return token ? verifyToken(token) : null;
}

/* ---------------- Route guards ---------------- */

/** For API routes — returns JSON response if invalid */
export async function protectApiRoute(req, expectedRole = null) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return {
      valid: false,
      user: null,
      response: NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      ),
    };
  }

  const user = verifyToken(token);

  if (!user) {
    return {
      valid: false,
      user: null,
      response: NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      ),
    };
  }

  if (expectedRole && user?.type !== expectedRole) {
    return {
      valid: false,
      user: null,
      response: NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      ),
    };
  }

  return { valid: true, user };
}

/** For App Router pages/server actions — returns redirect response if invalid */
export async function protectRoute(req, expectedRole = null) {
  const token = getTokenFromRequest(req);

  const nextPath = (() => {
    try {
      return req?.nextUrl?.pathname || '/';
    } catch {
      return '/';
    }
  })();

  if (!token) {
    return {
      valid: false,
      response: NextResponse.redirect(`/login?next=${encodeURIComponent(nextPath)}`),
    };
  }

  const user = verifyToken(token);

  if (!user) {
    return {
      valid: false,
      response: NextResponse.redirect(`/login?next=${encodeURIComponent(nextPath)}`),
    };
  }

  if (expectedRole && user?.type !== expectedRole) {
    return {
      valid: false,
      response: NextResponse.redirect(`/unauthorized`),
    };
  }

  return { valid: true, user };
}
