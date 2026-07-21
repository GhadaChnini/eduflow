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
    SELECT id, title, max_students FROM live_sessions
    WHERE id = ${session_id} AND teacher_id = ${userId}
  `;

  if (!session_check.length) {
    return Response.json({ error: 'Session not found' }, { status: 404 });
  }

  const waiting_list = await sql`
    SELECT 
      wl.*,
      u.name as student_name,
      u.image as student_image,
      u.email as student_email
    FROM waiting_list wl
    JOIN "user" u ON wl.student_id = u.id
    WHERE wl.session_id = ${session_id}
    ORDER BY wl.created_at ASC
  `;

  // Get current enrollment count
  const enrolled_count = await sql`
    SELECT COUNT(*) as count
    FROM session_attendance
    WHERE session_id = ${session_id}
  `;

  return Response.json({
    waiting_list,
    session: session_check[0],
    enrolled_count: enrolled_count[0]?.count || 0,
    spots_available: session_check[0].max_students - (enrolled_count[0]?.count || 0),
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
  const { session_id } = body;

  if (!session_id) {
    return Response.json({ error: 'session_id is required' }, { status: 400 });
  }

  // Check if already on waiting list
  const existing = await sql`
    SELECT id FROM waiting_list
    WHERE session_id = ${session_id} AND student_id = ${userId}
  `;

  if (existing.length) {
    return Response.json({ error: 'Already on waiting list' }, { status: 400 });
  }

  const result = await sql`
    INSERT INTO waiting_list (session_id, student_id)
    VALUES (${session_id}, ${userId})
    RETURNING *
  `;

  // Get session teacher and notify them
  const live_session = await sql`
    SELECT teacher_id, title FROM live_sessions WHERE id = ${session_id}
  `;

  const student = await sql`
    SELECT name FROM "user" WHERE id = ${userId}
  `;

  if (live_session.length) {
    await createNotification({
      teacher_id: live_session[0].teacher_id,
      type: 'student_waiting',
      title: 'New Student on Waiting List',
      message: `${student[0]?.name} joined the waiting list for "${live_session[0].title}"`,
      related_id: session_id,
    });
  }

  return Response.json({ waiting: result[0] });
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
  const { session_id, student_id } = body;

  // Teacher can remove any student, student can remove themselves
  await sql`
    DELETE FROM waiting_list
    WHERE session_id = ${session_id}
      AND student_id = ${student_id || userId}
  `;

  return Response.json({ success: true });
}

// Admit student from waiting list
export async function PUT(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json();
  const { session_id, student_id } = body;

  // Verify teacher owns this session
  const session_check = await sql`
    SELECT id, title FROM live_sessions
    WHERE id = ${session_id} AND teacher_id = ${userId}
  `;

  if (!session_check.length) {
    return Response.json({ error: 'Session not found' }, { status: 404 });
  }

  // Add to attendance (admit the student)
  await sql`
    INSERT INTO session_attendance (session_id, student_id, attended)
    VALUES (${session_id}, ${student_id}, FALSE)
    ON CONFLICT (session_id, student_id) DO NOTHING
  `;

  // Remove from waiting list
  await sql`
    DELETE FROM waiting_list
    WHERE session_id = ${session_id} AND student_id = ${student_id}
  `;

  return Response.json({ success: true, message: 'Student admitted from waiting list' });
}