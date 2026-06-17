import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacherId');

  let rows;
  if (teacherId) {
    rows = await sql`
      SELECT ls.*, u.name as teacher_name
      FROM live_sessions ls
      JOIN "user" u ON ls.teacher_id = u.id
      WHERE ls.teacher_id = ${teacherId}
      ORDER BY ls.start_time ASC
    `;
  } else {
    rows = await sql`
      SELECT ls.*, u.name as teacher_name
      FROM live_sessions ls
      JOIN "user" u ON ls.teacher_id = u.id
      WHERE ls.status IN ('scheduled', 'live')
      ORDER BY ls.start_time ASC
    `;
  }

  return Response.json({ sessions: rows });
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
  const { title, start_time, price, meeting_link } = body;

  const result = await sql`
    INSERT INTO live_sessions (teacher_id, title, start_time, price, meeting_link)
    VALUES (${userId}, ${title}, ${start_time}, ${price}, ${meeting_link})
    RETURNING *
  `;

  return Response.json({ session: result[0] });
}
