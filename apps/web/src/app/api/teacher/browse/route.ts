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

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'teachers'; // 'teachers' or 'students'
  const search = searchParams.get('search') || '';
  const id = searchParams.get('id');

  // Get single profile
  if (id) {
    const user = await sql`
      SELECT 
        u.id,
        u.name,
        u.image,
        u.email,
        u.role,
        u.points,
        tp.bio,
        tp.specialization,
        tp.avatar_url
      FROM "user" u
      LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
      WHERE u.id = ${id}
    `;

    if (!user.length) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    if (user[0].role === 'teacher') {
      // Get teacher's courses
      const courses = await sql`
        SELECT 
          c.*,
          cc.name as category_name,
          COUNT(DISTINCT e.student_id) as total_enrolled,
          COALESCE(AVG(cr.rating), 0) as avg_rating
        FROM courses c
        LEFT JOIN course_categories cc ON c.category_id = cc.id
        LEFT JOIN enrollments e ON e.course_id = c.id
        LEFT JOIN course_reviews cr ON cr.course_id = c.id
        WHERE c.teacher_id = ${id} AND c.status = 'published'
        GROUP BY c.id, cc.name
        ORDER BY c.created_at DESC
      `;

      // Get teacher stats
      const stats = await sql`
        SELECT 
          COUNT(DISTINCT c.id) as total_courses,
          COUNT(DISTINCT e.student_id) as total_students,
          COALESCE(AVG(cr.rating), 0) as avg_rating
        FROM courses c
        LEFT JOIN enrollments e ON e.course_id = c.id
        LEFT JOIN course_reviews cr ON cr.course_id = c.id
        WHERE c.teacher_id = ${id}
      `;

      return Response.json({
        profile: user[0],
        courses,
        stats: stats[0],
      });
    } else {
      // Get student's enrolled courses and badges
      const enrollments = await sql`
        SELECT 
          c.id,
          c.title,
          c.thumbnail_url,
          c.type,
          e.progress,
          e.completed,
          e.enrolled_at,
          u.name as teacher_name
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        JOIN "user" u ON c.teacher_id = u.id
        WHERE e.student_id = ${id}
        ORDER BY e.enrolled_at DESC
      `;

      const badges = await sql`
        SELECT b.* FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = ${id}
        ORDER BY ub.earned_at DESC
      `;

      return Response.json({
        profile: user[0],
        enrollments,
        badges,
      });
    }
  }

  // Browse teachers
  if (type === 'teachers') {
    const teachers = await sql`
      SELECT 
        u.id,
        u.name,
        u.image,
        u.points,
        tp.bio,
        tp.specialization,
        tp.avatar_url,
        COUNT(DISTINCT c.id) as total_courses,
        COUNT(DISTINCT e.student_id) as total_students,
        COALESCE(AVG(cr.rating), 0) as avg_rating
      FROM "user" u
      LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
      LEFT JOIN courses c ON c.teacher_id = u.id
      LEFT JOIN enrollments e ON e.course_id = c.id
      LEFT JOIN course_reviews cr ON cr.course_id = c.id
      WHERE u.role = 'teacher'
        AND u.teacher_status = 'approved'
        AND (
          ${search} = '' OR
          u.name ILIKE ${'%' + search + '%'} OR
          tp.specialization ILIKE ${'%' + search + '%'}
        )
      GROUP BY u.id, u.name, u.image, u.points, tp.bio, tp.specialization, tp.avatar_url
      ORDER BY total_students DESC
    `;

    return Response.json({ teachers });
  }

  // Browse students
  const students = await sql`
    SELECT 
      u.id,
      u.name,
      u.image,
      u.points,
      COUNT(DISTINCT e.course_id) as total_enrolled,
      COUNT(DISTINCT ub.badge_id) as total_badges
    FROM "user" u
    LEFT JOIN enrollments e ON e.student_id = u.id
    LEFT JOIN user_badges ub ON ub.user_id = u.id
    WHERE u.role = 'student'
      AND (
        ${search} = '' OR
        u.name ILIKE ${'%' + search + '%'}
      )
    GROUP BY u.id, u.name, u.image, u.points
    ORDER BY u.points DESC
  `;

  return Response.json({ students });
}