import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const template = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    return NextResponse.json(template);
  } catch (error) {
    console.error('Template GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    // Extract variables from content
    const variableMatches = body.content?.match(/\{\{(\w+)\}\}/g) || [];
    const variables = variableMatches.map((v: string) => v.replace(/\{\{|\}\}/g, ''));

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        name: body.name,
        type: body.type,
        subject: body.subject,
        content: body.content,
        variables: [...new Set(variables)],
        status: body.status,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Template PUT error:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await prisma.emailTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Template DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
