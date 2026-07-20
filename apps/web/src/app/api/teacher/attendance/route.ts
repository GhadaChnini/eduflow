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
  const session_id = searchParams.get('session_id');

  if (!session_id) {
    return Response.json({ error: 'session_id is required' }, { status: 400 });
  }

  // Verify teacher owns this session
  const session_check = await sql`
    SELECT id FROM live_sessions
    WHERE id = ${session_id} AND teacher_id = ${userId}
  `;

  if (!session_check.length) {
    return Response.json({ error: 'Session not found' }, { status: 404 });
  }

  // Get attendance list with student details
  const attendance = await sql`
    SELECT 
      sa.*,
      u.name as student_name,
      u.image as student_image,
      u.email as student_email
    FROM session_attendance sa
    JOIN "user" u ON sa.student_id = u.id
    WHERE sa.session_id = ${session_id}
    ORDER BY sa.attended DESC, u.name ASC
  `;

  // Get enrolled students who haven't joined yet
  const not_attended = await sql`
    SELECT 
      u.id,
      u.name,
      u.image,
      u.email
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    JOIN live_sessions ls ON ls.id = ${session_id}
    JOIN "user" u ON e.student_id = u.id
    WHERE c.teacher_id = ${userId}
      AND e.student_id NOT IN (
        SELECT student_id FROM session_attendance WHERE session_id = ${session_id}
      )
  `;

  const stats = await sql`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN attended = TRUE THEN 1 END) as attended,
      COUNT(CASE WHEN attended = FALSE THEN 1 END) as absent
    FROM session_attendance
    WHERE session_id = ${session_id}
  `;

  return Response.json({
    attendance,
    not_attended,
    stats: stats[0],
  });
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
  const { session_id, student_id, attended } = body;

  if (!session_id || !student_id) {
    return Response.json({ error: 'session_id and student_id are required' }, { status: 400 });
  }

  // Verify teacher owns this session
  const session_check = await sql`
    SELECT id FROM live_sessions
    WHERE id = ${session_id} AND teacher_id = ${userId}
  `;

  if (!session_check.length) {
    return Response.json({ error: 'Session not found' }, { status: 404 });
  }

  // Upsert attendance
  const result = await sql`
    INSERT INTO session_attendance (session_id, student_id, attended, joined_at)
    VALUES (${session_id}, ${student_id}, ${attended}, NOW())
    ON CONFLICT (session_id, student_id) DO UPDATE SET
      attended = EXCLUDED.attended,
      joined_at = CASE WHEN EXCLUDED.attended = TRUE THEN NOW() ELSE session_attendance.joined_at END
    RETURNING *
  `;

  // Award points to student if attended
  if (attended) {
    await sql`
      UPDATE "user" SET points = points + 15 WHERE id = ${student_id}
    `;

    // Notify teacher
    const student = await sql`
      SELECT name FROM "user" WHERE id = ${student_id}
    `;

    await createNotification({
      teacher_id: userId,
      type: 'student_attended',
      title: 'Student Attended',
      message: `${student[0]?.name} attended your live session`,
      related_id: session_id,
    });
  }

  return Response.json({ attendance: result[0] });
}

export async function PUT(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json();
  const { session_id, attendances } = body;

  // attendances = [{ student_id, attended }]
  if (!session_id || !attendances?.length) {
    return Response.json({ error: 'session_id and attendances are required' }, { status: 400 });
  }

  // Verify teacher owns this session
  const session_check = await sql`
    SELECT id FROM live_sessions
    WHERE id = ${session_id} AND teacher_id = ${userId}
  `;

  if (!session_check.length) {
    return Response.json({ error: 'Session not found' }, { status: 404 });
  }

  // Bulk upsert attendance
  for (const att of attendances) {
    await sql`
      INSERT INTO session_attendance (session_id, student_id, attended)
      VALUES (${session_id}, ${att.student_id}, ${att.attended})
      ON CONFLICT (session_id, student_id) DO UPDATE SET
        attended = EXCLUDED.attended
    `;

    // Award points to attended students
    if (att.attended) {
      await sql`
        UPDATE "user" SET points = points + 15 WHERE id = ${att.student_id}
      `;
    }
  }

  return Response.json({ success: true, updated: attendances.length });
}