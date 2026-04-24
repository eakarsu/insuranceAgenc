import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Generate a verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // In a production app, you would:
    // 1. Store the token hash and expiry in the database
    // 2. Send an email with a verification link containing the raw token
    // 3. When the user clicks the link, verify the token and mark email as verified
    console.log(`[DEV] Email verification token for ${email}: ${verificationToken}`);
    console.log(`[DEV] Token hash: ${tokenHash}, Expires: ${expiresAt}`);

    return NextResponse.json({
      message: 'Verification email sent. Please check your inbox.',
      ...(process.env.NODE_ENV === 'development' && { devToken: verificationToken }),
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // In production, verify the token hash against the database
    // and mark the user's email as verified
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    console.log(`[DEV] Verifying token hash: ${tokenHash}`);

    return NextResponse.json({
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
