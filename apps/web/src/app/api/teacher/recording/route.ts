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

  if (session_id) {
    // Get recording for specific session
    const recording = await sql`
      SELECT 
        ls.id,
        ls.title,
        ls.recording_url,
        ls.converted_course_id,
        ls.scheduled_at,
        ls.status,
        c.title as converted_course_title
      FROM live_sessions ls
      LEFT JOIN courses c ON ls.converted_course_id = c.id
      WHERE ls.id = ${session_id} AND ls.teacher_id = ${userId}
    `;

    if (!recording.length) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    return Response.json({ recording: recording[0] });
  }

  // Get all sessions with recordings
  const recordings = await sql`
    SELECT 
      ls.id,
      ls.title,
      ls.recording_url,
      ls.converted_course_id,
      ls.scheduled_at,
      ls.status,
      c.title as converted_course_title
    FROM live_sessions ls
    LEFT JOIN courses c ON ls.converted_course_id = c.id
    WHERE ls.teacher_id = ${userId} AND ls.recording_url IS NOT NULL
    ORDER BY ls.scheduled_at DESC
  `;

  return Response.json({ recordings });
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
  const { session_id, recording_url } = body;

  if (!session_id || !recording_url) {
    return Response.json({ error: 'session_id and recording_url are required' }, { status: 400 });
  }

  // Verify teacher owns this session
  const session_check = await sql`
    SELECT id, title FROM live_sessions
    WHERE id = ${session_id} AND teacher_id = ${userId}
  `;

  if (!session_check.length) {
    return Response.json({ error: 'Session not found' }, { status: 404 });
  }

  // Save recording URL
  await sql`
    UPDATE live_sessions
    SET recording_url = ${recording_url}, status = 'ended'
    WHERE id = ${session_id} AND teacher_id = ${userId}
  `;

  await createNotification({
    teacher_id: userId,
    type: 'recording_saved',
    title: 'Recording Saved',
    message: `Recording for "${session_check[0].title}" has been saved successfully`,
    related_id: session_id,
  });

  return Response.json({ success: true });
}

// Convert recording to course
export async function PUT(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json();
  const { session_id, title, description, price, category_id } = body;

  if (!session_id || !title) {
    return Response.json({ error: 'session_id and title are required' }, { status: 400 });
  }

  // Get session recording
  const live_session = await sql`
    SELECT id, title, recording_url FROM live_sessions
    WHERE id = ${session_id} AND teacher_id = ${userId} AND recording_url IS NOT NULL
  `;

  if (!live_session.length) {
    return Response.json({ error: 'Session or recording not found' }, { status: 404 });
  }

  // Create new course from recording
  const new_course = await sql`
    INSERT INTO courses (teacher_id, title, description, price, type, file_url, category_id, status)
    VALUES (
      ${userId},
      ${title},
      ${description || ''},
      ${price || 0},
      'video',
      ${live_session[0].recording_url},
      ${category_id || null},
      'published'
    )
    RETURNING *
  `;

  // Link course to session
  await sql`
    UPDATE live_sessions
    SET converted_course_id = ${new_course[0].id}
    WHERE id = ${session_id}
  `;

  await createNotification({
    teacher_id: userId,
    type: 'recording_converted',
    title: 'Recording Converted to Course',
    message: `"${live_session[0].title}" recording has been published as a new course: "${title}"`,
    related_id: new_course[0].id,
  });

  return Response.json({ success: true, course: new_course[0] });
}