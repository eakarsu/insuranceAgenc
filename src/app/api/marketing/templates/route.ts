import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const templates = await prisma.emailTemplate.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Templates GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    // Extract variables from content (anything between {{ and }})
    const variableMatches = body.content?.match(/\{\{(\w+)\}\}/g) || [];
    const variables = variableMatches.map((v: string) => v.replace(/\{\{|\}\}/g, ''));

    const template = await prisma.emailTemplate.create({
      data: {
        name: body.name,
        type: body.type,
        subject: body.subject,
        content: body.content,
        variables: [...new Set(variables)], // Remove duplicates
        status: body.status || 'ACTIVE',
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Templates POST error:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
