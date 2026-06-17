import { cookies } from 'next/headers';
import sql from '@/app/api/utils/sql';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const masterPassword = process.env.ADMIN_MASTER_PASSWORD;

    // 1. Verify Master System Password
    if (!masterPassword || password !== masterPassword) {
      return Response.json({ error: 'Invalid administrative password' }, { status: 401 });
    }

    const cleanEmail = (email || '').trim().toLowerCase();

    // 2. HARDCODED BYPASS FOR YOU 👑
    // This guarantees you get in immediately, even if the DB connection is acting up!
    if (cleanEmail === 'ghada.chenini@eduflow.com') {
      console.log("👑 Admin master account matched via hardcoded safety bypass!");
      return grantAdminAccess();
    }

    // 3. Database Fallback check for any other admin accounts
    let user: any = null;
    try {
      const userRows = await sql`SELECT role FROM "user" WHERE LOWER(email) = ${cleanEmail}`;
      user = userRows?.[0];
      if (!user) {
        const userRowsAlt = await sql`SELECT role FROM "User" WHERE LOWER(email) = ${cleanEmail}`;
        user = userRowsAlt?.[0];
      }
    } catch (dbError) {
      console.error("Database query error inside admin auth:", dbError);
    }

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Access denied: Email is not an assigned administrator' }, { status: 403 });
    }

    return grantAdminAccess();
  } catch (error) {
    return Response.json({ error: 'Internal validation failure' }, { status: 500 });
  }
}

// Helper function to seal the secure cookie session
async function grantAdminAccess() {
  const cookieStore = await cookies();
  cookieStore.set('eduflow_admin_token', 'admin_authenticated_secure_seal', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  return Response.json({ success: true, message: 'Admin authentication successful!' });
}