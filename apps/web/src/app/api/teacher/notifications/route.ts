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

  const notifications = await sql`
    SELECT *
    FROM teacher_notifications
    WHERE teacher_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 50
  `;

  const unread_count = await sql`
    SELECT COUNT(*) as count
    FROM teacher_notifications
    WHERE teacher_id = ${userId} AND is_read = FALSE
  `;

  return Response.json({
    notifications,
    unread_count: unread_count[0]?.count || 0,
  });
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
  const { notification_id, mark_all } = body;

  if (mark_all) {
    await sql`
      UPDATE teacher_notifications
      SET is_read = TRUE
      WHERE teacher_id = ${userId}
    `;
  } else if (notification_id) {
    await sql`
      UPDATE teacher_notifications
      SET is_read = TRUE
      WHERE id = ${notification_id} AND teacher_id = ${userId}
    `;
  }

  return Response.json({ success: true });
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
  const { notification_id } = body;

  await sql`
    DELETE FROM teacher_notifications
    WHERE id = ${notification_id} AND teacher_id = ${userId}
  `;

  return Response.json({ success: true });
}

// Helper function to create a notification (used internally by other routes)
export async function createNotification({
  teacher_id,
  type,
  title,
  message,
  related_id,
}: {
  teacher_id: string;
  type: string;
  title: string;
  message: string;
  related_id?: string;
}) {
  await sql`
    INSERT INTO teacher_notifications (teacher_id, type, title, message, related_id)
    VALUES (${teacher_id}, ${type}, ${title}, ${message}, ${related_id || null})
  `;
}