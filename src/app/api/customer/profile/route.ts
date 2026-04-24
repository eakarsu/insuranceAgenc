import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCustomerFromCookie } from '@/lib/customer-auth';

export async function GET(request: NextRequest) {
  try {
    const customer = await getCustomerFromCookie();
    if (!customer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { id: customer.clientId },
      select: {
        id: true,
        type: true,
        status: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        mobile: true,
        dateOfBirth: true,
        businessName: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        createdAt: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Customer profile GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const customer = await getCustomerFromCookie();
    if (!customer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Only allow updating contact info fields
    const allowedFields = ['email', 'phone', 'mobile', 'address', 'city', 'state', 'zipCode'];
    const updateData: Record<string, string | null> = {};

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field] || null;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const client = await prisma.client.update({
      where: { id: customer.clientId },
      data: updateData,
      select: {
        id: true,
        type: true,
        status: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        mobile: true,
        dateOfBirth: true,
        businessName: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Customer profile PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
