import { NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function POST(request: Request) {
  try {
    const { participationId, score } = await request.json();
    await sql`
      UPDATE "student_participations" 
      SET score = ${score} 
      WHERE id = ${participationId}
    `;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}