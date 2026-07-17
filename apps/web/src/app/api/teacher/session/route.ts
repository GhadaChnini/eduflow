import { NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const { title, date, url, price } = await request.json();
    await sql`
      INSERT INTO "live_sessions" (id, title, session_date, meeting_url, price)
      VALUES (${randomUUID()}, ${title}, ${date}, ${url}, ${price})
    `;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}