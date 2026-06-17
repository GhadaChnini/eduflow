import sql from '@/app/api/utils/sql';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, bio } = body || {};

    // Validate that the required fields are filled out
    if (!name || !email || !bio) {
      return Response.json({ error: 'Missing required profile fields' }, { status: 400 });
    }

    // Generate a standard UUID string pattern to match database format expectations perfectly
    const id = typeof window === 'undefined' ? require('crypto').randomUUID() : self.crypto.randomUUID();

    // Insert the public form details straight into your teacher_application database table queue
    await sql`
      INSERT INTO "teacher_application" (id, name, email, bio, status, "createdAt")
      VALUES (${id}, ${name}, ${email}, ${bio}, 'pending', NOW())
    `;

    return Response.json({ success: true, message: 'Application queued!' });
  } catch (error: any) {
    return Response.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}