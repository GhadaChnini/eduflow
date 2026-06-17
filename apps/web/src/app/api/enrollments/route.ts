import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const rows = await sql`
    SELECT e.*, c.title, c.description, c.thumbnail_url, c.type, u.name as teacher_name
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    JOIN "user" u ON c.teacher_id = u.id
    WHERE e.student_id = ${userId}
    ORDER BY e.enrolled_at DESC
  `;

  return Response.json({ enrollments: rows });
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
  const { courseId } = body;

  // Check if already enrolled
  const existing = await sql`
    SELECT id FROM enrollments 
    WHERE student_id = ${userId} AND course_id = ${courseId}
  `;

  if (existing.length > 0) {
    return Response.json({ error: 'Already enrolled' }, { status: 400 });
  }

  const result = await sql`
    INSERT INTO enrollments (student_id, course_id)
    VALUES (${userId}, ${courseId})
    RETURNING *
  `;

  // Award points
  await sql`
    UPDATE "user" SET points = points + 10 WHERE id = ${userId}
  `;

  return Response.json({ enrollment: result[0] });
}
