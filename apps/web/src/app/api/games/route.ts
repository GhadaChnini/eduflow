import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

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
  const session_id = searchParams.get('session_id');
  const category = searchParams.get('category');

  // Get all games with access info
  let games;

  if (course_id || session_id) {
    // Get games unlocked for a specific course or session
    games = await sql`
      SELECT 
        g.*,
        ga.unlocked_at,
        ga.expires_at,
        CASE WHEN gc.id IS NOT NULL THEN TRUE ELSE FALSE END as completed_by_user,
        gc.score as user_score,
        gc.max_score as user_max_score
      FROM games g
      JOIN game_access ga ON ga.game_id = g.id
      LEFT JOIN game_completions gc ON gc.game_id = g.id AND gc.student_id = ${userId}
      WHERE 
        (${course_id || null}::uuid IS NULL OR ga.course_id = ${course_id || null})
        AND (${session_id || null}::uuid IS NULL OR ga.session_id = ${session_id || null})
        AND (ga.expires_at IS NULL OR ga.expires_at > NOW())
      ORDER BY g.created_at DESC
    `;
  } else {
    // Get all games (for teacher game zone management)
    games = await sql`
      SELECT 
        g.*,
        COUNT(DISTINCT gc.student_id) as times_played,
        COALESCE(AVG(gc.score), 0) as avg_score
      FROM games g
      LEFT JOIN game_completions gc ON gc.game_id = g.id
      WHERE ${category || null} IS NULL OR g.category = ${category || null}
      GROUP BY g.id
      ORDER BY g.type, g.title
    `;
  }

  // Get categories
  const categories = await sql`
    SELECT DISTINCT category FROM games WHERE category IS NOT NULL ORDER BY category
  `;

  return Response.json({
    games,
    categories: categories.map((c: { category: string }) => c.category),
  });
}

// Teacher unlocks a game for students
export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json();
  const { game_id, course_id, session_id, expires_at } = body;

  if (!game_id) {
    return Response.json({ error: 'game_id is required' }, { status: 400 });
  }

  // Verify game exists
  const game = await sql`
    SELECT id, title FROM games WHERE id = ${game_id}
  `;

  if (!game.length) {
    return Response.json({ error: 'Game not found' }, { status: 404 });
  }

  // Grant access
  const access = await sql`
    INSERT INTO game_access (game_id, teacher_id, course_id, session_id, expires_at)
    VALUES (
      ${game_id},
      ${userId},
      ${course_id || null},
      ${session_id || null},
      ${expires_at || null}
    )
    RETURNING *
  `;

  return Response.json({
    success: true,
    access: access[0],
    message: `Game "${game[0].title}" unlocked for students`,
  });
}

// Teacher adds a custom external game
export async function PUT(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, type, category, embed_url, points_reward } = body;

  if (!title || !type) {
    return Response.json({ error: 'title and type are required' }, { status: 400 });
  }

  const game = await sql`
    INSERT INTO games (title, description, type, category, embed_url, points_reward)
    VALUES (
      ${title},
      ${description || null},
      ${type},
      ${category || null},
      ${embed_url || null},
      ${points_reward || 10}
    )
    RETURNING *
  `;

  return Response.json({ success: true, game: game[0] });
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
  const { access_id } = body;

  await sql`
    DELETE FROM game_access
    WHERE id = ${access_id} AND teacher_id = ${userId}
  `;

  return Response.json({ success: true });
}