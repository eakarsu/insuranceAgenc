import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // In a real app, store the token hash and expiry in the database
    // and send an email with the reset link containing the raw token.
    // For now, we log it for development purposes.
    console.log(`[DEV] Password reset token for ${email}: ${resetToken}`);
    console.log(`[DEV] Token hash: ${resetTokenHash}, Expires: ${resetExpires}`);

    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
      // Only in development - remove in production
      ...(process.env.NODE_ENV === 'development' && { devToken: resetToken }),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
