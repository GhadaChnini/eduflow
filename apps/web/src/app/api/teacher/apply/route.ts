import { NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const bio = formData.get('bio') as string;

    if (!name || !email || !bio) {
      return NextResponse.json(
        { error: 'Missing required field details.' },
        { status: 400 }
      );
    }

    // Generate a unique ID to satisfy the database 'id' NOT NULL constraint
    const id = randomUUID();

    // Insert the data into the teacher_application table
    await sql`
      INSERT INTO "teacher_application" 
      (id, name, email, bio, status, "createdAt") 
      VALUES 
      (${id}, ${name}, ${email}, ${bio}, 'pending', NOW())
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Application processed successfully!' 
    });

  } catch (error: any) {
    console.error('Submission Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}