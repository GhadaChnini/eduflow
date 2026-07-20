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

  // Total earnings overview
  const overview = await sql`
    SELECT 
      COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_earned,
      COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending,
      COALESCE(SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END), 0) as refunded,
      COUNT(*) as total_transactions
    FROM payments
    WHERE teacher_id = ${userId}
  `;

  // Earnings per course
  const per_course = await sql`
    SELECT 
      c.id,
      c.title,
      c.thumbnail_url,
      c.price,
      COUNT(p.id) as total_sales,
      COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) as earned,
      COALESCE(SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END), 0) as pending
    FROM courses c
    LEFT JOIN payments p ON p.course_id = c.id AND p.teacher_id = ${userId}
    WHERE c.teacher_id = ${userId}
    GROUP BY c.id, c.title, c.thumbnail_url, c.price
    ORDER BY earned DESC
  `;

  // Earnings per live session
  const per_session = await sql`
    SELECT 
      ls.id,
      ls.title,
      ls.price,
      ls.scheduled_at,
      COUNT(p.id) as total_sales,
      COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) as earned
    FROM live_sessions ls
    LEFT JOIN payments p ON p.session_id = ls.id AND p.teacher_id = ${userId}
    WHERE ls.teacher_id = ${userId} AND ls.is_paid = TRUE
    GROUP BY ls.id, ls.title, ls.price, ls.scheduled_at
    ORDER BY ls.scheduled_at DESC
  `;

  // Recent transactions
  const transactions = await sql`
    SELECT 
      p.*,
      u.name as student_name,
      u.image as student_image,
      c.title as course_title,
      ls.title as session_title
    FROM payments p
    JOIN "user" u ON p.student_id = u.id
    LEFT JOIN courses c ON p.course_id = c.id
    LEFT JOIN live_sessions ls ON p.session_id = ls.id
    WHERE p.teacher_id = ${userId}
    ORDER BY p.created_at DESC
    LIMIT 20
  `;

  // Monthly earnings (last 6 months)
  const monthly = await sql`
    SELECT 
      TO_CHAR(created_at, 'Mon YYYY') as month,
      COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as earned
    FROM payments
    WHERE teacher_id = ${userId}
      AND created_at >= NOW() - INTERVAL '6 months'
    GROUP BY TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at)
    ORDER BY DATE_TRUNC('month', created_at) ASC
  `;

  return Response.json({
    overview: overview[0],
    per_course,
    per_session,
    transactions,
    monthly,
  });
}