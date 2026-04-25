// Unified student service — merges real Supabase users with demo mock data
import { supabase } from './supabase';
import { STUDENT_PROFILES, STUDENT_SCORES } from './mock-data';
import { calculatePRS, analyzeStudent } from './ai-engine';

export interface UnifiedStudent {
  id: string;
  name: string;
  email: string;
  department: string;
  aptitude: number;
  coding: number;
  core_subjects: number;
  soft_skills: number;
  attendance: number;
  backlogs: number;
  prs: number;
  status: string;
  plan: string;
  isDemo: boolean;
  joinedAt: string;
}

export async function getAllStudents(): Promise<UnifiedStudent[]> {
  // Start with demo/mock students
  const demoStudents: UnifiedStudent[] = STUDENT_PROFILES.map((p, i) => {
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
      plan: 'pro',
      isDemo: true,
      joinedAt: '2025-01-15',
    };
  });

  // Try to fetch real Supabase students
  try {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    if (!profiles || profiles.length === 0) return demoStudents;

    const { data: scores } = await supabase
      .from('student_scores')
      .select('*')
      .in('student_id', profiles.map(p => p.id));

    const today = new Date().toISOString().split('T')[0];

    const realStudents: UnifiedStudent[] = profiles.map(profile => {
      const studentScore = scores?.find(s => s.student_id === profile.id);
      const sc = studentScore || { aptitude: 0, coding: 0, core_subjects: 0, soft_skills: 0, attendance: 75, backlogs: 0 };
      const prsScore = calculatePRS(sc);
      const analysis = analyzeStudent(sc);
      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        department: studentScore?.department || 'CSE',
        aptitude: sc.aptitude || 0,
        coding: sc.coding || 0,
        core_subjects: sc.core_subjects || 0,
        soft_skills: sc.soft_skills || 0,
        attendance: sc.attendance || 75,
        backlogs: sc.backlogs || 0,
        prs: prsScore,
        status: analysis.probability,
        plan: profile.plan || 'free',
        isDemo: false,
        joinedAt: profile.created_at?.split('T')[0] || today,
      };
    });

    // Real students first, then demo
    const merged = [...realStudents, ...demoStudents];
    return ensureLoggedInStudent(merged);
  } catch {
    return ensureLoggedInStudent(demoStudents);
  }
}

function ensureLoggedInStudent(students: UnifiedStudent[]): UnifiedStudent[] {
  if (typeof window === 'undefined') return students;

  let currentAuthUser: { id: string; name: string; email: string; role: string } | null = null;
  try {
    currentAuthUser = JSON.parse(localStorage.getItem('smartprsCurrentAuthUser') || 'null') as {
      id: string;
      name: string;
      email: string;
      role: string;
    } | null;
  } catch {
    currentAuthUser = null;
  }

  const demoRole = localStorage.getItem('demoRole');
  const authUser = currentAuthUser || {
    id: 'demo-student',
    name: localStorage.getItem('demoName') || 'Student',
    email: localStorage.getItem('demoEmail') || 'student@demo.com',
    role: demoRole || '',
  };

  const hasByName = students.some(s => s.name.toLowerCase() === authUser.name.toLowerCase());
  const hasByEmail = students.some(s => s.email.toLowerCase() === authUser.email.toLowerCase());
  const hasById = students.some(s => s.id === authUser.id);

  if (authUser.role === 'student' && !hasByName && !hasByEmail && !hasById) {
    const demoStudent = students.find(s => s.name === 'Student');
    const fallback = demoStudent || students[0];
    if (!fallback) return students;
    return [
      {
        ...fallback,
        id: authUser.id || 'demo-student',
        name: authUser.name || fallback.name,
        email: authUser.email || fallback.email,
        isDemo: authUser.id.startsWith('demo-') || fallback.isDemo,
      },
      ...students,
    ];
  }

  return students;
}

export function subscribeToStudentUpdates(callback: () => void) {
  return supabase
    .channel('student-updates')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'profiles',
    }, callback)
    .subscribe();
}
