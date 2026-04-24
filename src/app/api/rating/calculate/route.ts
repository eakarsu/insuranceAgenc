import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { calculatePremium, RatingInput } from '@/lib/rating-engine';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: RatingInput = await request.json();

    if (!body.lineOfBusiness) {
      return NextResponse.json({ error: 'lineOfBusiness is required' }, { status: 400 });
    }

    const result = await calculatePremium(body);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Rating calculation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
