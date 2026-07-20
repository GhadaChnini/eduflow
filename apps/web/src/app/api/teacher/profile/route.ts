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

  const profile = await sql`
    SELECT 
      u.id,
      u.name,
      u.email,
      u.image,
      u.points,
      tp.bio,
      tp.avatar_url,
      tp.specialization,
      tp.paypal_email,
      tp.bank_name,
      tp.bank_account,
      tp.bank_iban,
      tp.earnings_total,
      tp.earnings_pending
    FROM "user" u
    LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
    WHERE u.id = ${userId}
  `;

  const courses = await sql`
    SELECT COUNT(*) as total_courses
    FROM courses
    WHERE teacher_id = ${userId}
  `;

  const students = await sql`
    SELECT COUNT(DISTINCT e.student_id) as total_students
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE c.teacher_id = ${userId}
  `;

  return Response.json({
    profile: profile[0],
    stats: {
      total_courses: courses[0]?.total_courses || 0,
      total_students: students[0]?.total_students || 0,
    },
  });
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
  const {
    name,
    bio,
    avatar_url,
    specialization,
    paypal_email,
    bank_name,
    bank_account,
    bank_iban,
  } = body;

  // Update user name
  if (name) {
    await sql`
      UPDATE "user" SET name = ${name} WHERE id = ${userId}
    `;
  }

  // Upsert teacher profile
  await sql`
    INSERT INTO teacher_profiles (user_id, bio, avatar_url, specialization, paypal_email, bank_name, bank_account, bank_iban, updated_at)
    VALUES (${userId}, ${bio}, ${avatar_url}, ${specialization}, ${paypal_email}, ${bank_name}, ${bank_account}, ${bank_iban}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      bio = EXCLUDED.bio,
      avatar_url = EXCLUDED.avatar_url,
      specialization = EXCLUDED.specialization,
      paypal_email = EXCLUDED.paypal_email,
      bank_name = EXCLUDED.bank_name,
      bank_account = EXCLUDED.bank_account,
      bank_iban = EXCLUDED.bank_iban,
      updated_at = NOW()
  `;

  return Response.json({ success: true, message: 'Profile updated successfully' });
}