import { NextRequest, NextResponse } from 'next/server';
import { clearCustomerCookie } from '@/lib/customer-auth';

export async function POST(request: NextRequest) {
  try {
    clearCustomerCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Customer logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
