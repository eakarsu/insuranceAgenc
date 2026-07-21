import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { createCustomerToken, setCustomerCookie } from '@/lib/customer-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Find customer auth record
    const customerAuth = await prisma.customerAuth.findUnique({
      where: { email },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!customerAuth || !customerAuth.isActive) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, customerAuth.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create JWT token
    const token = await createCustomerToken({
      sub: customerAuth.id,
      clientId: customerAuth.clientId,
      email: customerAuth.email,
    });

    // Set cookie
    await setCustomerCookie(token);

    // Update last login
    await prisma.customerAuth.update({
      where: { id: customerAuth.id },
      data: { lastLoginAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      client: {
        id: customerAuth.client.id,
        firstName: customerAuth.client.firstName,
        lastName: customerAuth.client.lastName,
        email: customerAuth.client.email,
      },
    });
  } catch (error) {
    console.error('Customer login error:', error);
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 });
  }
}
