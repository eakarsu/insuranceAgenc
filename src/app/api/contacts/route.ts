import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const clientId = searchParams.get('clientId') || '';

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { relationship: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      contacts: contacts.map((contact) => ({
        ...contact,
        clientName: `${contact.client.firstName} ${contact.client.lastName}`,
      })),
    });
  } catch (error) {
    console.error('Contacts GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const contact = await prisma.contact.create({
      data: {
        clientId: body.clientId,
        type: body.type,
        name: body.name,
        relationship: body.relationship || null,
        email: body.email || null,
        phone: body.phone || null,
        isPrimary: body.isPrimary || false,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('Contacts POST error:', error);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }
}
