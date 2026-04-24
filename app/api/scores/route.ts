import { NextResponse } from 'next/server';
import { getAllStudentsWithScores } from '@/lib/mock-data';

export async function GET() {
  const students = getAllStudentsWithScores();
  return NextResponse.json({ students, count: students.length });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { student_id, type, score } = body;
    // In production, this would write to Supabase and trigger realtime
    return NextResponse.json({
      success: true,
      message: `Score logged: ${type} = ${score} for student ${student_id}`,
      realtime: 'Supabase Realtime event would fire here',
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
