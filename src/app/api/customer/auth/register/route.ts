import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clientId, email, password } = body;

    if (!clientId || !email || !password) {
      return NextResponse.json({ error: 'clientId, email, and password are required' }, { status: 400 });
    }

    // Verify the client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Check if customer auth already exists for this client
    const existingAuth = await prisma.customerAuth.findUnique({
      where: { clientId },
    });

    if (existingAuth) {
      return NextResponse.json({ error: 'Customer portal account already exists for this client' }, { status: 409 });
    }

    // Check if email is already in use
    const existingEmail = await prisma.customerAuth.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create customer auth record
    await prisma.customerAuth.create({
      data: {
        clientId,
        email,
        passwordHash,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Customer register error:', error);
    return NextResponse.json({ error: 'Failed to register customer' }, { status: 500 });
  }
}
