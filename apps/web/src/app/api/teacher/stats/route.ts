import { NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  try {
    // Replace "user" and "course" with your actual table names
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM "user" WHERE role = 'student') as total_students,
        (SELECT COUNT(*) FROM "course") as active_courses
    `);

    return NextResponse.json({
      totalStudents: stats.rows[0].total_students,
      activeCourses: stats.rows[0].active_courses,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}