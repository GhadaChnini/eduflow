import { NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const { title, price, url } = await request.json();
    const id = randomUUID();

    await sql`
      INSERT INTO "courses" (id, title, price, file_url, "createdAt")
      VALUES (${id}, ${title}, ${price}, ${url}, NOW())
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}