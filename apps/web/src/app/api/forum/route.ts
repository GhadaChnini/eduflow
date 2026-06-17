import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get('parentId');

  let rows;
  if (parentId) {
    rows = await sql`
      SELECT f.*, u.name as user_name, u.image as user_image
      FROM forum_posts f
      JOIN "user" u ON f.user_id = u.id
      WHERE f.parent_id = ${parentId}
      ORDER BY f.created_at ASC
    `;
  } else {
    rows = await sql`
      SELECT f.*, u.name as user_name, u.image as user_image, (SELECT count(*) FROM forum_posts WHERE parent_id = f.id) as reply_count
      FROM forum_posts f
      JOIN "user" u ON f.user_id = u.id
      WHERE f.parent_id IS NULL
      ORDER BY f.created_at DESC
    `;
  }

  return Response.json({ posts: rows });
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
  const { title, content, parentId } = body;

  const result = await sql`
    INSERT INTO forum_posts (user_id, title, content, parent_id)
    VALUES (${userId}, ${title}, ${content}, ${parentId})
    RETURNING *
  `;

  // Award points for participation
  await sql`
    UPDATE "user" SET points = points + 5 WHERE id = ${userId}
  `;

  return Response.json({ post: result[0] });
}
