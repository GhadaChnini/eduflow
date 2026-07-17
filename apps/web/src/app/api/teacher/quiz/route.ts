import { NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const { title, questions } = await request.json();
    const quizId = randomUUID();

    // 1. Insert the main quiz record
    await sql`INSERT INTO "quizzes" (id, title) VALUES (${quizId}, ${title})`;

    // 2. Insert all questions associated with this quizId
    for (const q of questions) {
      await sql`
        INSERT INTO "quiz_questions" (id, quiz_id, question_text, points)
        VALUES (${randomUUID()}, ${quizId}, ${q.text}, ${q.points})
      `;
    }

    return NextResponse.json({ success: true, quizId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}