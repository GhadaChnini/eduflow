import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';
import { cookies, headers } from 'next/headers';
import { sendWorkflowEmail } from '../../utils/email';

// Helper function to check if a valid administrative clearance exists
async function verifyAdminAccess() {
  const cookieStore = await cookies();
  const customAdminToken = cookieStore.get('eduflow_admin_token')?.value;

  if (customAdminToken === 'admin_authenticated_secure_seal') {
    return true; // Bypass granted!
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.id) {
    const adminUser = await sql`SELECT role FROM "user" WHERE id = ${session.user.id}`;
    if (adminUser?.[0]?.role === 'admin') {
      return true; // Access granted via active session
    }
  }

  return false; 
}

export async function GET() {
  const isAuthorized = await verifyAdminAccess();
  
  if (!isAuthorized) {
    return Response.json({ error: 'Unauthorized administration clearance' }, { status: 401 });
  }

  // Included "resumeUrl" in the selection query
  const requests = await sql`
    SELECT id, name, email, bio, status, "rejectionReason", "resumeUrl" 
    FROM "teacher_application" 
    WHERE status = 'pending'
    ORDER BY "createdAt" DESC
  `;

  return Response.json({ requests });
}

export async function POST(request: Request) {
  const isAuthorized = await verifyAdminAccess();
  
  if (!isAuthorized) {
    return Response.json({ error: 'Unauthorized administration clearance' }, { status: 401 });
  }

  const body = await request.json();
  const { teacherId, status, rejectionReason } = body || {};

  // Find applicant details BEFORE deleting the record from the database
  const applicationRows = await sql`SELECT * FROM "teacher_application" WHERE id = ${teacherId}`;
  const applicant = applicationRows?.[0];
  if (!applicant) {
    return Response.json({ error: 'Application record not found' }, { status: 404 });
  }

  if (status === 'approved') {
    const randomSegment = () => Math.random().toString(36).slice(-4).toUpperCase();
    const randomSegmentLower = () => Math.random().toString(36).slice(-4).toLowerCase();
    const cleanPassword = `Edu-${randomSegment()}-${randomSegmentLower()}-!2026`;

    const userCheck = await sql`SELECT id FROM "user" WHERE email = ${applicant.email}`;
    let targetUserId = userCheck?.[0]?.id;

    if (!targetUserId) {
      try {
        const newUser = await auth.api.signUpEmail({
          body: {
            email: applicant.email,
            password: cleanPassword,
            name: applicant.name,
          },
        });
        
        targetUserId = newUser.user.id;

        await sql`
          UPDATE "user" 
          SET role = 'teacher', teacher_status = 'approved', bio = ${applicant.bio} 
          WHERE id = ${targetUserId}
        `;
      } catch (authError: any) {
        return Response.json({ error: `Auth registration failed: ${authError.message}` }, { status: 500 });
      }
    } else {
      await sql`
        UPDATE "user" 
        SET role = 'teacher', teacher_status = 'approved', bio = ${applicant.bio} 
        WHERE id = ${targetUserId}
      `;
    }

    // 🔥 1. DELETE THE COMPLETED APPLICATION FROM THE DATABASE
    await sql`DELETE FROM "teacher_application" WHERE id = ${teacherId}`;

    // 📧 2. SEND THE REAL EMAIL THROUGH GMAIL SMTP
    try {
      await sendWorkflowEmail({
        to: applicant.email,
        subject: 'Welcome to EduFlow! Your Teacher Application is Approved! 🍎',
        html: `
          <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #4f46e5;">Congratulations, ${applicant.name}! 🎉</h2>
            <p>Your application to join EduFlow as an instructor has been verified and approved by administration.</p>
            <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <strong>Your New Access Credentials:</strong><br/>
              <span style="display: inline-block; margin-top: 5px;"><strong>Email:</strong> ${applicant.email}</span><br/>
              <span><strong>Temporary Password:</strong> <code style="background: #ffffff; padding: 3px 6px; border-radius: 4px; border: 1px solid #ch1;">${cleanPassword}</code></span>
            </div>
            <p style="font-size: 0.9em; color: #64748b;">Please log in to your dashboard and immediately update your password under account settings.</p>
          </div>
        `,
      });
    } catch (e) {
      console.log("⚠️ Background email dispatch failed to send, but user was created.");
    }

    return Response.json({ success: true, message: 'Approved and request record removed.', password: cleanPassword });

  } else if (status === 'rejected') {
    // 🔥 1. DELETE THE REJECTED APPLICATION FROM THE DATABASE
    await sql`DELETE FROM "teacher_application" WHERE id = ${teacherId}`;

    // 📧 2. SEND THE REAL REJECTION EMAIL THROUGH GMAIL SMTP
    try {
      await sendWorkflowEmail({
        to: applicant.email,
        subject: 'Update regarding your EduFlow Instructor Application',
        html: `
          <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2>Hello ${applicant.name},</h2>
            <p>Thank you for your interest in joining EduFlow. Our administration team has carefully reviewed your profile details.</p>
            <p>We regret to inform you that your application has been declined at this time for the following reason:</p>
            <blockquote style="background: #FFF1F2; border-left: 4px solid #F43F5E; padding: 10px 15px; margin: 15px 0; font-style: italic; color: #9f1239;">
              "${rejectionReason || 'The details provided do not match our current platform criteria requirements.'}"
            </blockquote>
            <p>You are welcome to adjust your profile presentation and re-apply for consideration in the future.</p>
          </div>
        `,
      });
    } catch (e) {
      console.log("⚠️ Background rejection email failed to send, but database was cleaned up.");
    }

    return Response.json({ success: true, message: 'Rejected and request record removed.' });
  }

  return Response.json({ error: 'Invalid Status action' }, { status: 400 });
}