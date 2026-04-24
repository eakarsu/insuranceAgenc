import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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
    const policyId = searchParams.get('policyId') || '';
    const claimId = searchParams.get('claimId') || '';

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (policyId) {
      where.policyId = policyId;
    }

    if (claimId) {
      where.claimId = claimId;
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        policy: {
          select: {
            id: true,
            policyNumber: true,
          },
        },
        claim: {
          select: {
            id: true,
            claimNumber: true,
          },
        },
      },
    });

    // Format file size for display
    const formattedDocs = documents.map((doc) => ({
      ...doc,
      fileSize: doc.fileSize ? formatFileSize(doc.fileSize) : '-',
    }));

    return NextResponse.json({ documents: formattedDocs });
  } catch (error) {
    console.error('Documents GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const name = formData.get('name') as string;
    const type = formData.get('type') as string;
    const description = formData.get('description') as string;
    const clientId = formData.get('clientId') as string | null;

    const timestamp = Date.now();
    let fileName = `document_${timestamp}.pdf`;
    let fileUrl = `/uploads/${fileName}`;
    let fileSize: number | null = null;
    let mimeType = 'application/pdf';

    // Handle file upload if file is provided
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (e) {
        // Directory might already exist
      }

      // Generate unique filename
      const ext = file.name.split('.').pop() || 'pdf';
      fileName = `${name.replace(/\s+/g, '_')}_${timestamp}.${ext}`;
      const filePath = path.join(uploadDir, fileName);

      // Write file to disk
      await writeFile(filePath, buffer);

      fileUrl = `/uploads/${fileName}`;
      fileSize = file.size;
      mimeType = file.type || 'application/octet-stream';
    }

    const document = await prisma.document.create({
      data: {
        clientId: clientId || null,
        type: (type || 'OTHER') as any,
        name: name || 'Untitled Document',
        fileName,
        fileUrl,
        fileSize,
        mimeType,
        description: description || null,
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

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Documents POST error:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}
