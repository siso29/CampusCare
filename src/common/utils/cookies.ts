import type { Response } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

export const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME || 'campuscare_session';
export const CSRF_COOKIE_NAME =
  process.env.CSRF_COOKIE_NAME || 'campuscare_csrf';

export function setSessionCookie(
  response: Response,
  token: string,
  ttlDays = 7,
): void {
  response.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: ttlDays * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSessionCookie(response: Response): void {
  response.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  });
}

export function setCsrfCookie(response: Response, token: string): void {
  response.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Accessible by client JavaScript to set X-CSRF-Token header
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearCsrfCookie(response: Response): void {
  response.clearCookie(CSRF_COOKIE_NAME, {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  });
}
