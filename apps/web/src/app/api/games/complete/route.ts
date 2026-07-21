import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json();
  const { game_id, score, max_score } = body;

  if (!game_id) {
    return Response.json({ error: 'game_id is required' }, { status: 400 });
  }

  // Get game info
  const game = await sql`
    SELECT id, title, type, points_reward FROM games WHERE id = ${game_id}
  `;

  if (!game.length) {
    return Response.json({ error: 'Game not found' }, { status: 404 });
  }

  // Record completion
  const completion = await sql`
    INSERT INTO game_completions (game_id, student_id, score, max_score)
    VALUES (${game_id}, ${userId}, ${score || 0}, ${max_score || 100})
    RETURNING *
  `;

  // Calculate points to award based on score percentage
  const score_percentage = max_score > 0 ? (score / max_score) * 100 : 0;
  let points_to_award = game[0].points_reward;

  if (score_percentage === 100) {
    points_to_award = game[0].points_reward * 2; // Double points for perfect score
  } else if (score_percentage >= 75) {
    points_to_award = Math.floor(game[0].points_reward * 1.5);
  }

  // Award points
  await sql`
    UPDATE "user" SET points = points + ${points_to_award} WHERE id = ${userId}
  `;

  // Get updated user points and stats
  const user = await sql`
    SELECT points FROM "user" WHERE id = ${userId}
  `;

  const total_games_played = await sql`
    SELECT COUNT(*) as count FROM game_completions WHERE student_id = ${userId}
  `;

  const total_games_won = await sql`
    SELECT COUNT(*) as count FROM game_completions
    WHERE student_id = ${userId} AND score = max_score
  `;

  const game_types_played = await sql`
    SELECT COUNT(DISTINCT g.type) as count
    FROM game_completions gc
    JOIN games g ON gc.game_id = g.id
    WHERE gc.student_id = ${userId}
  `;

  const perfect_quizzes = await sql`
    SELECT COUNT(*) as count FROM game_completions
    WHERE student_id = ${userId} AND score = max_score AND max_score > 0
  `;

  // Check and award badges
  const badges_earned = [];

  const badge_checks = [
    {
      condition_type: 'games_played',
      count: parseInt(total_games_played[0]?.count),
    },
    {
      condition_type: 'games_won',
      count: parseInt(total_games_won[0]?.count),
    },
    {
      condition_type: 'game_types',
      count: parseInt(game_types_played[0]?.count),
    },
    {
      condition_type: 'perfect_quiz',
      count: parseInt(perfect_quizzes[0]?.count),
    },
    {
      condition_type: 'points',
      count: parseInt(user[0]?.points),
    },
  ];

  for (const check of badge_checks) {
    const eligible_badges = await sql`
      SELECT id, name, icon FROM badges
      WHERE condition_type = ${check.condition_type}
        AND condition_value <= ${check.count}
        AND id NOT IN (
          SELECT badge_id FROM user_badges WHERE user_id = ${userId}
        )
    `;

    for (const badge of eligible_badges) {
      await sql`
        INSERT INTO user_badges (user_id, badge_id)
        VALUES (${userId}, ${badge.id})
        ON CONFLICT (user_id, badge_id) DO NOTHING
      `;
      badges_earned.push(badge);
    }
  }

  return Response.json({
    success: true,
    completion: completion[0],
    points_awarded: points_to_award,
    total_points: user[0]?.points,
    score_percentage: Math.round(score_percentage),
    perfect_score: score_percentage === 100,
    badges_earned,
  });
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const game_id = searchParams.get('game_id');

  if (game_id) {
    // Get completions for specific game
    const completions = await sql`
      SELECT 
        gc.*,
        u.name as student_name,
        u.image as student_image
      FROM game_completions gc
      JOIN "user" u ON gc.student_id = u.id
      WHERE gc.game_id = ${game_id}
      ORDER BY gc.score DESC, gc.completed_at ASC
    `;

    return Response.json({ completions });
  }

  // Get all completions for current user
  const completions = await sql`
    SELECT 
      gc.*,
      g.title as game_title,
      g.type as game_type,
      g.points_reward
    FROM game_completions gc
    JOIN games g ON gc.game_id = g.id
    WHERE gc.student_id = ${userId}
    ORDER BY gc.completed_at DESC
  `;

  const stats = await sql`
    SELECT
      COUNT(*) as total_played,
      COUNT(CASE WHEN score = max_score THEN 1 END) as total_perfect,
      COALESCE(AVG(CASE WHEN max_score > 0 THEN (score::float / max_score) * 100 END), 0) as avg_score_percentage
    FROM game_completions
    WHERE student_id = ${userId}
  `;

  return Response.json({
    completions,
    stats: stats[0],
  });
}