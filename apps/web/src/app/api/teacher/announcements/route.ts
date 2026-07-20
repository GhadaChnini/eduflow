import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { createNotification } from '@/app/api/teacher/notifications/route';

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const course_id = searchParams.get('course_id');

  let announcements;

  if (course_id) {
    announcements = await sql`
      SELECT 
        a.*,
        u.name as teacher_name,
        u.image as teacher_image,
        c.title as course_title
      FROM announcements a
      JOIN "user" u ON a.teacher_id = u.id
      LEFT JOIN courses c ON a.course_id = c.id
      WHERE a.teacher_id = ${userId} AND a.course_id = ${course_id}
      ORDER BY a.created_at DESC
    `;
  } else {
    announcements = await sql`
      SELECT 
        a.*,
        u.name as teacher_name,
        u.image as teacher_image,
        c.title as course_title
      FROM announcements a
      JOIN "user" u ON a.teacher_id = u.id
      LEFT JOIN courses c ON a.course_id = c.id
      WHERE a.teacher_id = ${userId}
      ORDER BY a.created_at DESC
    `;
  }

  return Response.json({ announcements });
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
  const { title, content, course_id } = body;

  if (!title || !content) {
    return Response.json({ error: 'Title and content are required' }, { status: 400 });
  }

  const result = await sql`
    INSERT INTO announcements (teacher_id, course_id, title, content)
    VALUES (${userId}, ${course_id || null}, ${title}, ${content})
    RETURNING *
  `;

  // Get all enrolled students for this course or all teacher's courses
  let students;
  if (course_id) {
    students = await sql`
      SELECT DISTINCT e.student_id
      FROM enrollments e
      WHERE e.course_id = ${course_id}
    `;
  } else {
    students = await sql`
      SELECT DISTINCT e.student_id
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE c.teacher_id = ${userId}
    `;
  }

  // Get teacher name
  const teacher = await sql`
    SELECT name FROM "user" WHERE id = ${userId}
  `;

  // Send notification to each student (stored as teacher notification for now)
  // In a full implementation this would notify students too
  await createNotification({
    teacher_id: userId,
    type: 'announcement_sent',
    title: 'Announcement Sent',
    message: `Your announcement "${title}" was sent to ${students.length} student(s)`,
    related_id: result[0].id,
  });

  return Response.json({
    announcement: result[0],
    sent_to: students.length,
  });
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json();
  const { announcement_id } = body;

  await sql`
    DELETE FROM announcements
    WHERE id = ${announcement_id} AND teacher_id = ${userId}
  `;

  return Response.json({ success: true });
}