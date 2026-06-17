import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacherId');

  let rows;
  if (teacherId) {
    rows = await sql`
      SELECT c.*, u.name as teacher_name 
      FROM courses c
      JOIN "user" u ON c.teacher_id = u.id
      WHERE c.teacher_id = ${teacherId}
      ORDER BY c.created_at DESC
    `;
  } else {
    rows = await sql`
      SELECT c.*, u.name as teacher_name 
      FROM courses c
      JOIN "user" u ON c.teacher_id = u.id
      WHERE c.status = 'published'
      ORDER BY c.created_at DESC
    `;
  }

  return Response.json({ courses: rows });
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
  const { title, description, price, type, file_url, thumbnail_url } = body;

  const result = await sql`
    INSERT INTO courses (teacher_id, title, description, price, type, file_url, thumbnail_url)
    VALUES (${userId}, ${title}, ${description}, ${price}, ${type}, ${file_url}, ${thumbnail_url})
    RETURNING *
  `;

  return Response.json({ course: result[0] });
}
