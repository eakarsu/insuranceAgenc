import { NextResponse } from 'next/server'

export async function GET() {
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const email = process.env.DEMO_EMAIL || ''
  const password = process.env.DEMO_PASSWORD || ''
  if (!email || !password) return NextResponse.json({ error: 'Demo credentials unavailable' }, { status: 503 })
  return NextResponse.json({ email, password }, { headers: { 'Cache-Control': 'no-store' } })
}
