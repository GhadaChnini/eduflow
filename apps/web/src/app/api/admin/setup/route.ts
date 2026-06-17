import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Promote current user to admin
  await sql`
    UPDATE "user" 
    SET role = 'admin', teacher_status = 'approved'
    WHERE id = ${userId}
  `;

  return Response.json({
    success: true,
    message: 'You are now an administrator. Please refresh the dashboard.',
  });
}
