    import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { createNotification } from '@/app/api/teacher/notifications/route';

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const course_id = searchParams.get('course_id');
  const teacher_id = searchParams.get('teacher_id');

  if (course_id) {
    // Get reviews for a specific course
    const reviews = await sql`
      SELECT 
        cr.*,
        u.name as student_name,
        u.image as student_image
      FROM course_reviews cr
      JOIN "user" u ON cr.student_id = u.id
      WHERE cr.course_id = ${course_id}
      ORDER BY cr.created_at DESC
    `;

    const stats = await sql`
      SELECT 
        COUNT(*) as total_reviews,
        COALESCE(AVG(rating), 0) as avg_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
      FROM course_reviews
      WHERE course_id = ${course_id}
    `;

    return Response.json({ reviews, stats: stats[0] });
  }

  if (teacher_id) {
    // Get all reviews for teacher's courses
    const reviews = await sql`
      SELECT 
        cr.*,
        u.name as student_name,
        u.image as student_image,
        c.title as course_title
      FROM course_reviews cr
      JOIN "user" u ON cr.student_id = u.id
      JOIN courses c ON cr.course_id = c.id
      WHERE c.teacher_id = ${teacher_id}
      ORDER BY cr.created_at DESC
    `;

    const stats = await sql`
      SELECT 
        COUNT(*) as total_reviews,
        COALESCE(AVG(cr.rating), 0) as avg_rating
      FROM course_reviews cr
      JOIN courses c ON cr.course_id = c.id
      WHERE c.teacher_id = ${teacher_id}
    `;

    return Response.json({ reviews, stats: stats[0] });
  }

  return Response.json({ error: 'course_id or teacher_id is required' }, { status: 400 });
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
  const { course_id, rating, comment } = body;

  if (!course_id || !rating) {
    return Response.json({ error: 'course_id and rating are required' }, { status: 400 });
  }

  if (rating < 1 || rating > 5) {
    return Response.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
  }

  // Check if student is enrolled
  const enrollment = await sql`
    SELECT id FROM enrollments
    WHERE student_id = ${userId} AND course_id = ${course_id}
  `;

  if (!enrollment.length) {
    return Response.json({ error: 'You must be enrolled to review this course' }, { status: 403 });
  }

  // Upsert review
  const review = await sql`
    INSERT INTO course_reviews (course_id, student_id, rating, comment)
    VALUES (${course_id}, ${userId}, ${rating}, ${comment || null})
    ON CONFLICT (course_id, student_id) DO UPDATE SET
      rating = EXCLUDED.rating,
      comment = EXCLUDED.comment
    RETURNING *
  `;

  // Award points to student for leaving a review
  await sql`
    UPDATE "user" SET points = points + 5 WHERE id = ${userId}
  `;

  // Notify teacher
  const course = await sql`
    SELECT teacher_id, title FROM courses WHERE id = ${course_id}
  `;

  const student = await sql`
    SELECT name FROM "user" WHERE id = ${userId}
  `;

  if (course.length) {
    await createNotification({
      teacher_id: course[0].teacher_id,
      type: 'new_review',
      title: 'New Course Review',
      message: `${student[0]?.name} left a ${rating}⭐ review on "${course[0].title}"`,
      related_id: course_id,
    });
  }

  return Response.json({
    success: true,
    review: review[0],
  });
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
  const { review_id } = body;

  // Student can delete their own review, admin can delete any
  const user = await sql`
    SELECT role FROM "user" WHERE id = ${userId}
  `;

  if (user[0]?.role === 'admin') {
    await sql`
      DELETE FROM course_reviews WHERE id = ${review_id}
    `;
  } else {
    await sql`
      DELETE FROM course_reviews
      WHERE id = ${review_id} AND student_id = ${userId}
    `;
  }

  return Response.json({ success: true });
}