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

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const course_id = searchParams.get('course_id');

  if (course_id) {
    // Get certificates for a specific course
    const certificates = await sql`
      SELECT 
        cert.*,
        u.name as student_name,
        u.image as student_image,
        u.email as student_email,
        c.title as course_title
      FROM certificates cert
      JOIN "user" u ON cert.student_id = u.id
      JOIN courses c ON cert.course_id = c.id
      WHERE cert.course_id = ${course_id} AND cert.teacher_id = ${userId}
      ORDER BY cert.issued_at DESC
    `;

    return Response.json({ certificates });
  }

  // Get all certificates issued by teacher
  const certificates = await sql`
    SELECT 
      cert.*,
      u.name as student_name,
      u.image as student_image,
      c.title as course_title
    FROM certificates cert
    JOIN "user" u ON cert.student_id = u.id
    JOIN courses c ON cert.course_id = c.id
    WHERE cert.teacher_id = ${userId}
    ORDER BY cert.issued_at DESC
  `;

  return Response.json({ certificates });
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
  const { student_id, course_id } = body;

  if (!student_id || !course_id) {
    return Response.json({ error: 'student_id and course_id are required' }, { status: 400 });
  }

  // Verify teacher owns this course
  const course = await sql`
    SELECT id, title FROM courses
    WHERE id = ${course_id} AND teacher_id = ${userId}
  `;

  if (!course.length) {
    return Response.json({ error: 'Course not found' }, { status: 404 });
  }

  // Check if certificate already exists
  const existing = await sql`
    SELECT id FROM certificates
    WHERE student_id = ${student_id} AND course_id = ${course_id}
  `;

  if (existing.length) {
    return Response.json({ error: 'Certificate already issued' }, { status: 400 });
  }

  // Get student and teacher info
  const student = await sql`
    SELECT name FROM "user" WHERE id = ${student_id}
  `;

  const teacher = await sql`
    SELECT name FROM "user" WHERE id = ${userId}
  `;

  // Generate certificate URL (in production this would generate a PDF)
  const certificate_url = `${process.env.NEXT_PUBLIC_CREATE_BASE_URL}/certificates/${course_id}/${student_id}`;

  // Issue certificate
  const certificate = await sql`
    INSERT INTO certificates (student_id, course_id, teacher_id, certificate_url)
    VALUES (${student_id}, ${course_id}, ${userId}, ${certificate_url})
    RETURNING *
  `;

  // Mark enrollment as completed
  await sql`
    UPDATE enrollments
    SET completed = TRUE, progress = 100
    WHERE student_id = ${student_id} AND course_id = ${course_id}
  `;

  // Award points to student
  await sql`
    UPDATE "user" SET points = points + 50 WHERE id = ${student_id}
  `;

  // Notify teacher
  await createNotification({
    teacher_id: userId,
    type: 'certificate_issued',
    title: 'Certificate Issued',
    message: `Certificate issued to ${student[0]?.name} for completing "${course[0].title}"`,
    related_id: certificate[0].id,
  });

  // Check and award badges
  const completions = await sql`
    SELECT COUNT(*) as count FROM enrollments
    WHERE student_id = ${student_id} AND completed = TRUE
  `;

  // Award Bookworm badge if 3 courses completed
  if (parseInt(completions[0]?.count) >= 3) {
    const badge = await sql`
      SELECT id FROM badges WHERE condition_type = 'courses_completed'
    `;
    if (badge.length) {
      await sql`
        INSERT INTO user_badges (user_id, badge_id)
        VALUES (${student_id}, ${badge[0].id})
        ON CONFLICT (user_id, badge_id) DO NOTHING
      `;
    }
  }

  return Response.json({
    success: true,
    certificate: certificate[0],
    certificate_url,
  });
}

// Bulk issue certificates for all completed students in a course
export async function PUT(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json();
  const { course_id } = body;

  if (!course_id) {
    return Response.json({ error: 'course_id is required' }, { status: 400 });
  }

  // Verify teacher owns this course
  const course = await sql`
    SELECT id, title FROM courses
    WHERE id = ${course_id} AND teacher_id = ${userId}
  `;

  if (!course.length) {
    return Response.json({ error: 'Course not found' }, { status: 404 });
  }

  // Get all completed students without certificates
  const students = await sql`
    SELECT e.student_id FROM enrollments e
    WHERE e.course_id = ${course_id}
      AND e.completed = TRUE
      AND e.student_id NOT IN (
        SELECT student_id FROM certificates WHERE course_id = ${course_id}
      )
  `;

  let issued = 0;
  for (const s of students) {
    const certificate_url = `${process.env.NEXT_PUBLIC_CREATE_BASE_URL}/certificates/${course_id}/${s.student_id}`;
    await sql`
      INSERT INTO certificates (student_id, course_id, teacher_id, certificate_url)
      VALUES (${s.student_id}, ${course_id}, ${userId}, ${certificate_url})
      ON CONFLICT (student_id, course_id) DO NOTHING
    `;
    await sql`
      UPDATE "user" SET points = points + 50 WHERE id = ${s.student_id}
    `;
    issued++;
  }

  await createNotification({
    teacher_id: userId,
    type: 'certificates_bulk_issued',
    title: 'Certificates Issued',
    message: `${issued} certificate(s) issued for "${course[0].title}"`,
    related_id: course_id,
  });

  return Response.json({ success: true, issued });
}