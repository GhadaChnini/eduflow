import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { createNotification } from '@/app/api/teacher/notifications/route';

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  const messages = await sql`
    SELECT 
      m.*,
      u.name as sender_name,
      u.image as sender_image
    FROM messages m
    JOIN "user" u ON m.sender_id = u.id
    WHERE m.sender_id = ${userId}
    ORDER BY m.created_at DESC
  `;

  return Response.json({ messages });
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
  const { title, content, target } = body;

  if (!title || !content) {
    return Response.json({ error: 'Title and content are required' }, { status: 400 });
  }

  const result = await sql`
    INSERT INTO messages (sender_id, title, content, target)
    VALUES (${userId}, ${title}, ${content}, ${target || 'all'})
    RETURNING *
  `;

  // Count recipients
  let recipients;
  if (target === 'students') {
    recipients = await sql`
      SELECT COUNT(*) as count FROM "user" WHERE role = 'student'
    `;
  } else if (target === 'teachers') {
    recipients = await sql`
      SELECT COUNT(*) as count FROM "user" WHERE role = 'teacher'
    `;
  } else {
    recipients = await sql`
      SELECT COUNT(*) as count FROM "user"
    `;
  }

  // Notify teacher that message was sent
  await createNotification({
    teacher_id: userId,
    type: 'message_sent',
    title: 'Message Sent',
    message: `Your message "${title}" was broadcast to ${recipients[0]?.count || 0} user(s)`,
    related_id: result[0].id,
  });

  return Response.json({
    message: result[0],
    sent_to: recipients[0]?.count || 0,
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
  const { message_id } = body;

  await sql`
    DELETE FROM messages
    WHERE id = ${message_id} AND sender_id = ${userId}
  `;

  return Response.json({ success: true });
}