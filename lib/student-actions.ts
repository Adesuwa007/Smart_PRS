'use server';
import { createServerClient } from './supabase';
import { calculatePRS, analyzeStudent } from './ai-engine';
import { STUDENT_PROFILES, STUDENT_SCORES } from './mock-data';
import { type UnifiedStudent } from './students-service';

export async function fetchAllStudentsServer(): Promise<UnifiedStudent[]> {
  const supabase = createServerClient();
  const today = new Date().toISOString().split('T')[0];

  try {
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    if (pErr) throw pErr;
    if (!profiles || profiles.length === 0) return [];

    const { data: scores, error: sErr } = await supabase
      .from('student_scores')
      .select('*')
      .in('student_id', profiles.map(p => p.id));

    if (sErr) throw sErr;

    return profiles.map((profile, i) => {
      const studentScore = scores?.find(s => s.student_id === profile.id);
      const sc = studentScore || { aptitude: 0, coding: 0, core_subjects: 0, soft_skills: 0, attendance: 75, backlogs: 0 };
      const prsScore = calculatePRS(sc);
      const analysis = analyzeStudent(sc);
      const dept = studentScore?.department || 'CS';
      
      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        department: dept,
        aptitude: sc.aptitude || 0,
        coding: sc.coding || 0,
        core_subjects: sc.core_subjects || 0,
        soft_skills: sc.soft_skills || 0,
        attendance: sc.attendance || 75,
        backlogs: sc.backlogs || 0,
        prs: prsScore,
        status: analysis.probability,
        usn: `4VV24${dept === 'ECE' ? 'EC' : dept}${String(i + 1).padStart(3, '0')}`,
        plan: profile.plan || 'free',
        isDemo: false,
        joinedAt: profile.created_at?.split('T')[0] || today,
      };
    });
  } catch (err) {
    console.error('Server Action Error fetching students:', err);
    return []; // Return empty if failed to avoid showing deleted/mock students
  }
}

export async function getMockStudents(): Promise<UnifiedStudent[]> {
  return STUDENT_PROFILES.map((p, i) => {
    const scores = STUDENT_SCORES[i] || {} as typeof STUDENT_SCORES[0];
    const prsScore = calculatePRS(scores);
    const analysis = analyzeStudent(scores);
    return {
      id: p.id,
      name: p.name,
      email: p.email,
      department: p.department || 'CSE',
      aptitude: scores.aptitude || 0,
      coding: scores.coding || 0,
      core_subjects: scores.core_subjects || 0,
      soft_skills: scores.soft_skills || 0,
      attendance: scores.attendance || 75,
      backlogs: scores.backlogs || 0,
      prs: prsScore,
      status: analysis.probability,
      usn: `4VV24${p.department === 'ECE' ? 'EC' : (p.department || 'CS')}${String(i + 1).padStart(3, '0')}`,
      plan: 'pro',
      isDemo: true,
      joinedAt: '2025-01-15',
    };
  });
}
