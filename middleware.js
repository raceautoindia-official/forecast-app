// middleware.js
import { NextResponse } from 'next/server';

const API_SECRET = process.env.API_SECRET;
const BASIC_USER = process.env.BASIC_AUTH_USER;
const BASIC_PASS = process.env.BASIC_AUTH_PASSWORD;

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // ─── Basic Auth for /admin/* ─────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Basic ')) {
      return unauthorizedBasic();
    }

    const base64Credentials = authHeader.slice(6).trim();
    let decoded;
    try {
      decoded = Buffer.from(base64Credentials, 'base64').toString('utf8');
    } catch {
      return unauthorizedBasic();
    }

    const [user, pass] = decoded.split(':');
    if (user !== BASIC_USER || pass !== BASIC_PASS) {
      return unauthorizedBasic();
    }

    return NextResponse.next();
  }

  // ─── Bearer Auth for /api/* ──────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token || token !== API_SECRET) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  return NextResponse.next();
}

function unauthorizedBasic() {
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
};
