import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limit store (per-process; for production use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
let lastCleanup = Date.now();

function getRateLimitConfig(path: string) {
  if (path.startsWith('/api/auth/') || path.startsWith('/api/customer/auth/')) {
    return { windowMs: 15 * 60 * 1000, maxRequests: 10 }; // 10 per 15 min for auth
  }
  if (path.startsWith('/api/customer/')) {
    return { windowMs: 60 * 1000, maxRequests: 60 }; // 60 per minute for customer API
  }
  if (path.startsWith('/api/payments/webhook')) {
    return { windowMs: 60 * 1000, maxRequests: 200 }; // Higher limit for webhooks
  }
  return { windowMs: 60 * 1000, maxRequests: 100 }; // 100 per minute for API
}

function checkRateLimit(ip: string, path: string): { allowed: boolean; remaining: number } {
  const config = getRateLimitConfig(path);
  const key = `${ip}:${path.split('/').slice(0, 4).join('/')}`;
  const now = Date.now();

  // Cleanup expired entries every 5 minutes to prevent memory leak
  if (now - lastCleanup > 5 * 60 * 1000) {
    rateLimitStore.forEach((v, k) => {
      if (now > v.resetTime) rateLimitStore.delete(k);
    });
    lastCleanup = now;
  }

  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1 };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count };
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ============ SECURITY HEADERS (Helmet-like) ============
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'"
  );

  // ============ RATE LIMITING (API routes only) ============
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const { allowed, remaining } = checkRateLimit(ip, request.nextUrl.pathname);

    response.headers.set('X-RateLimit-Remaining', String(remaining));

    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // ============ INPUT SANITIZATION (block common injection patterns) ============
    const url = request.nextUrl.toString();
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /union\s+select/gi,
      /;\s*drop\s+table/gi,
      /--\s*$/gm,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(url)) {
        return NextResponse.json(
          { error: 'Invalid request' },
          { status: 400 }
        );
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|uploads/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};
