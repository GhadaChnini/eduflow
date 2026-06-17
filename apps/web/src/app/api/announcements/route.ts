import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacherId');

  let rows;
  if (teacherId) {
    rows = await sql`
      SELECT a.*, u.name as teacher_name
      FROM announcements a
      JOIN "user" u ON a.teacher_id = u.id
      WHERE a.teacher_id = ${teacherId}
      ORDER BY a.created_at DESC
    `;
  } else {
    rows = await sql`
      SELECT a.*, u.name as teacher_name
      FROM announcements a
      JOIN "user" u ON a.teacher_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 20
    `;
  }

  return Response.json({ announcements: rows });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json();
  const { content } = body;

  const result = await sql`
    INSERT INTO announcements (teacher_id, content)
    VALUES (${userId}, ${content})
    RETURNING *
  `;

  return Response.json({ announcement: result[0] });
}
