import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { requiredSecret } from './claims-runtime-config';
import prisma from './prisma';

function customerJwtSecret() {
  return new TextEncoder().encode(requiredSecret('CUSTOMER_JWT_SECRET'));
}

const COOKIE_NAME = 'customer-token';

export interface CustomerTokenPayload {
  sub: string; // customerAuth.id
  clientId: string;
  email: string;
}

export async function createCustomerToken(payload: CustomerTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('insureflow-customer-portal')
    .setAudience('insureflow-customer-api')
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(customerJwtSecret());
}

export async function verifyCustomerToken(token: string): Promise<CustomerTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, customerJwtSecret(), {
      issuer: 'insureflow-customer-portal',
      audience: 'insureflow-customer-api',
    });
    if (typeof payload.sub !== 'string' || typeof payload.clientId !== 'string' || typeof payload.email !== 'string') {
      return null;
    }
    const current = await prisma.customerAuth.findFirst({
      where: {
        id: payload.sub,
        clientId: payload.clientId,
        email: payload.email,
        isActive: true,
      },
      select: { id: true },
    });
    if (!current) return null;
    return { sub: payload.sub, clientId: payload.clientId, email: payload.email };
  } catch {
    return null;
  }
}

export async function getCustomerFromAuthorizationHeader(value: string | null): Promise<CustomerTokenPayload | null> {
  if (!value?.startsWith('Bearer ')) return null;
  const token = value.slice('Bearer '.length).trim();
  return token ? verifyCustomerToken(token) : null;
}

export async function getCustomerFromCookie(): Promise<CustomerTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyCustomerToken(token);
}

export async function setCustomerCookie(token: string) {
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

export async function clearCustomerCookie() {
  (await cookies()).set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
