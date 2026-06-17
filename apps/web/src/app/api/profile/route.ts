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
    SELECT id, name, email, image, role, teacher_status, bio, points, stripe_id 
    FROM "user" 
    WHERE id = ${userId}
  `;

  const user = rows?.[0] || null;
  return Response.json({ user });
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
  const { role, bio, teacher_status } = body || {};

  const setClauses = [];
  const values = [];

  if (role) {
    setClauses.push(`role = $${values.length + 1}`);
    values.push(role);
  }

  if (bio !== undefined) {
    setClauses.push(`bio = $${values.length + 1}`);
    values.push(bio);
  }

  if (teacher_status) {
    setClauses.push(`teacher_status = $${values.length + 1}`);
    values.push(teacher_status);
  }

  if (setClauses.length === 0) {
    return Response.json({ error: 'No fields to update' }, { status: 400 });
  }

  const query = `
    UPDATE "user" 
    SET ${setClauses.join(', ')}, "updatedAt" = NOW() 
    WHERE id = $${values.length + 1} 
    RETURNING id, role, teacher_status, bio
  `;

  const result = await sql(query, [...values, userId]);
  return Response.json({ user: result[0] });
}
