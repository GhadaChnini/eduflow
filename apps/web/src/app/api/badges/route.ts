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
  const user_id = searchParams.get('user_id') || userId;

  // Get all badges with earned status for user
  const badges = await sql`
    SELECT 
      b.*,
      CASE WHEN ub.id IS NOT NULL THEN TRUE ELSE FALSE END as earned,
      ub.earned_at
    FROM badges b
    LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = ${user_id}
    ORDER BY earned DESC, b.condition_value ASC
  `;

  // Get user stats for badge progress
  const user = await sql`
    SELECT points FROM "user" WHERE id = ${user_id}
  `;

  const games_played = await sql`
    SELECT COUNT(*) as count FROM game_completions WHERE student_id = ${user_id}
  `;

  const games_won = await sql`
    SELECT COUNT(*) as count FROM game_completions
    WHERE student_id = ${user_id} AND score = max_score
  `;

  const game_types = await sql`
    SELECT COUNT(DISTINCT g.type) as count
    FROM game_completions gc
    JOIN games g ON gc.game_id = g.id
    WHERE gc.student_id = ${user_id}
  `;

  const courses_completed = await sql`
    SELECT COUNT(*) as count FROM enrollments
    WHERE student_id = ${user_id} AND completed = TRUE
  `;

  const forum_posts = await sql`
    SELECT COUNT(*) as count FROM forum_posts
    WHERE user_id = ${user_id}
  `;

  const enrollments = await sql`
    SELECT COUNT(*) as count FROM enrollments WHERE student_id = ${user_id}
  `;

  const perfect_quizzes = await sql`
    SELECT COUNT(*) as count FROM game_completions
    WHERE student_id = ${user_id} AND score = max_score AND max_score > 0
  `;

  const progress = {
    points: parseInt(user[0]?.points) || 0,
    games_played: parseInt(games_played[0]?.count) || 0,
    games_won: parseInt(games_won[0]?.count) || 0,
    game_types: parseInt(game_types[0]?.count) || 0,
    courses_completed: parseInt(courses_completed[0]?.count) || 0,
    forum_posts: parseInt(forum_posts[0]?.count) || 0,
    enrollments: parseInt(enrollments[0]?.count) || 0,
    perfect_quiz: parseInt(perfect_quizzes[0]?.count) || 0,
  };

  const earned_count = badges.filter((b: { earned: boolean }) => b.earned).length;

  return Response.json({
    badges,
    progress,
    earned_count,
    total_count: badges.length,
  });
}

// Admin: create a new badge
export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Check admin role
  const user = await sql`
    SELECT role FROM "user" WHERE id = ${userId}
  `;

  if (user[0]?.role !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const body = await request.json();
  const { name, description, icon, condition_type, condition_value } = body;

  if (!name || !condition_type || !condition_value) {
    return Response.json({ error: 'name, condition_type and condition_value are required' }, { status: 400 });
  }

  const badge = await sql`
    INSERT INTO badges (name, description, icon, condition_type, condition_value)
    VALUES (${name}, ${description || null}, ${icon || '🏅'}, ${condition_type}, ${condition_value})
    RETURNING *
  `;

  return Response.json({ success: true, badge: badge[0] });
}

// Manually award badge to user (admin or teacher)
export async function PUT(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json();
  const { user_id, badge_id } = body;

  if (!user_id || !badge_id) {
    return Response.json({ error: 'user_id and badge_id are required' }, { status: 400 });
  }

  // Only admin or teacher can manually award badges
  const requester = await sql`
    SELECT role FROM "user" WHERE id = ${userId}
  `;

  if (!['admin', 'teacher'].includes(requester[0]?.role)) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  await sql`
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (${user_id}, ${badge_id})
    ON CONFLICT (user_id, badge_id) DO NOTHING
  `;

  const badge = await sql`
    SELECT * FROM badges WHERE id = ${badge_id}
  `;

  return Response.json({
    success: true,
    message: `Badge "${badge[0]?.name}" awarded successfully`,
  });
}