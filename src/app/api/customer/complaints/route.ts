import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { intakeComplaint } from '@/lib/complaint-service';
import { getCustomerFromAuthorizationHeader } from '@/lib/customer-auth';

export async function GET(request: NextRequest) {
  try {
    const customer = await getCustomerFromAuthorizationHeader(request.headers.get('authorization'));
    if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const clientId = customer.clientId;

    const complaints = await prisma.complaint.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        complaintNumber: true,
        status: true,
        category: true,
        summary: true,
        createdAt: true,
        resolvedAt: true,
      },
    });

    return NextResponse.json(complaints);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const customer = await getCustomerFromAuthorizationHeader(request.headers.get('authorization'));
    if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const clientId = customer.clientId;

    const body = await request.json();
    const complaint = await intakeComplaint({
      ...body,
      source: 'PORTAL',
      clientId,
    });

    return NextResponse.json(complaint, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
