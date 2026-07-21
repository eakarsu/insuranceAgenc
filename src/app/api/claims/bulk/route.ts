import { NextResponse } from 'next/server';

const retired = () => NextResponse.json(
  { error: 'Bulk claim mutation is incompatible with governed case history', code: 'RETIRED_UNSAFE_MUTATION' },
  { status: 410 },
);

export const DELETE = retired;
export const PATCH = retired;
