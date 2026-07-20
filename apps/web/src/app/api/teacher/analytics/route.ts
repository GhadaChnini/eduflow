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

  if (course_id) {
    // Single course analytics
    const course = await sql`
      SELECT 
        c.*,
        cc.name as category_name,
        COUNT(DISTINCT e.student_id) as total_enrolled,
        COUNT(DISTINCT CASE WHEN e.completed = TRUE THEN e.student_id END) as total_completed,
        COALESCE(AVG(cr.rating), 0) as avg_rating,
        COUNT(DISTINCT cr.id) as total_reviews,
        c.views as total_views
      FROM courses c
      LEFT JOIN course_categories cc ON c.category_id = cc.id
      LEFT JOIN enrollments e ON e.course_id = c.id
      LEFT JOIN course_reviews cr ON cr.course_id = c.id
      WHERE c.id = ${course_id} AND c.teacher_id = ${userId}
      GROUP BY c.id, cc.name
    `;

    if (!course.length) {
      return Response.json({ error: 'Course not found' }, { status: 404 });
    }

    // Enrolled students with progress
    const students = await sql`
      SELECT 
        u.id,
        u.name,
        u.image,
        e.progress,
        e.completed,
        e.enrolled_at,
        COALESCE(qr.avg_score, 0) as avg_quiz_score
      FROM enrollments e
      JOIN "user" u ON e.student_id = u.id
      LEFT JOIN (
        SELECT student_id, AVG(score) as avg_score
        FROM game_completions
        GROUP BY student_id
      ) qr ON qr.student_id = u.id
      WHERE e.course_id = ${course_id}
      ORDER BY e.enrolled_at DESC
    `;

    // Enrollment over time (last 30 days)
    const enrollment_trend = await sql`
      SELECT 
        TO_CHAR(enrolled_at, 'DD Mon') as date,
        COUNT(*) as count
      FROM enrollments
      WHERE course_id = ${course_id}
        AND enrolled_at >= NOW() - INTERVAL '30 days'
      GROUP BY TO_CHAR(enrolled_at, 'DD Mon'), DATE_TRUNC('day', enrolled_at)
      ORDER BY DATE_TRUNC('day', enrolled_at) ASC
    `;

    return Response.json({
      course: course[0],
      students,
      enrollment_trend,
    });
  }

  // Overall analytics for all courses
  const overview = await sql`
    SELECT 
      COUNT(DISTINCT c.id) as total_courses,
      COUNT(DISTINCT e.student_id) as total_students,
      COUNT(DISTINCT e.id) as total_enrollments,
      COUNT(DISTINCT CASE WHEN e.completed = TRUE THEN e.id END) as total_completions,
      COALESCE(AVG(cr.rating), 0) as avg_rating,
      SUM(c.views) as total_views
    FROM courses c
    LEFT JOIN enrollments e ON e.course_id = c.id
    LEFT JOIN course_reviews cr ON cr.course_id = c.id
    WHERE c.teacher_id = ${userId}
  `;

  // Per course summary
  const courses = await sql`
    SELECT 
      c.id,
      c.title,
      c.thumbnail_url,
      c.status,
      c.views,
      c.price,
      c.created_at,
      COUNT(DISTINCT e.student_id) as total_enrolled,
      COUNT(DISTINCT CASE WHEN e.completed = TRUE THEN e.student_id END) as total_completed,
      COALESCE(AVG(cr.rating), 0) as avg_rating
    FROM courses c
    LEFT JOIN enrollments e ON e.course_id = c.id
    LEFT JOIN course_reviews cr ON cr.course_id = c.id
    WHERE c.teacher_id = ${userId}
    GROUP BY c.id, c.title, c.thumbnail_url, c.status, c.views, c.price, c.created_at
    ORDER BY c.created_at DESC
  `;

  // Top performing students across all courses
  const top_students = await sql`
    SELECT 
      u.id,
      u.name,
      u.image,
      u.points,
      COUNT(DISTINCT e.course_id) as courses_enrolled,
      COUNT(DISTINCT CASE WHEN e.completed = TRUE THEN e.course_id END) as courses_completed
    FROM enrollments e
    JOIN "user" u ON e.student_id = u.id
    JOIN courses c ON e.course_id = c.id
    WHERE c.teacher_id = ${userId}
    GROUP BY u.id, u.name, u.image, u.points
    ORDER BY u.points DESC
    LIMIT 10
  `;

  return Response.json({
    overview: overview[0],
    courses,
    top_students,
  });
}

// Increment course views
export async function POST(request: Request) {
  const body = await request.json();
  const { course_id } = body;

  if (!course_id) {
    return Response.json({ error: 'course_id is required' }, { status: 400 });
  }

  await sql`
    UPDATE courses SET views = views + 1 WHERE id = ${course_id}
  `;

  return Response.json({ success: true });
}