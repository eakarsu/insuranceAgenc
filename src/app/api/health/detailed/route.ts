import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Memory usage
    const memUsage = process.memoryUsage();
    const memory = {
      rss: `${(memUsage.rss / 1024 / 1024).toFixed(1)} MB`,
      heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(1)} MB`,
      heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(1)} MB`,
    };

    // Record counts
    const [users, clients, policies, claims, quotes] = await Promise.all([
      prisma.user.count(),
      prisma.client.count(),
      prisma.policy.count(),
      prisma.claim.count(),
      prisma.quote.count(),
    ]);

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: `${(process.uptime() / 60).toFixed(1)} minutes`,
      memory,
      records: { users, clients, policies, claims, quotes },
      nodeVersion: process.version,
    });
  } catch (error) {
    console.error('Detailed health check error:', error);
    return NextResponse.json({ error: 'Health check failed' }, { status: 500 });
  }
}
