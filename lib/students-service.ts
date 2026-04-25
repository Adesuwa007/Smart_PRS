// Unified student service — always fetches FRESH from Supabase
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
  usn: string;
  plan: string;
  isDemo: boolean;
  joinedAt: string;
}

// Helper: format name properly even if it looks like an email fragment
function formatName(name: string, email: string): string {
  if (!name || name.includes('@') || name.length < 3) {
    return email.split('@')[0].replace(/[0-9]/g, '').trim() || 'Student';
  }
  return name;
}

// Helper: generate display USN from email or usn field
function displayUSN(student: { usn?: string; email?: string; department?: string }, index: number): string {
  if (student.usn && !student.usn.includes('@')) return student.usn;
  if (student.email) return student.email.split('@')[0].toUpperCase();
  const dept = student.department === 'ECE' ? 'EC' : (student.department || 'CS');
  return `4VV24${dept}${String(index + 1).padStart(3, '0')}`;
}

// Build demo students from mock data
function buildDemoStudents(): UnifiedStudent[] {
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

export async function getAllStudents(): Promise<UnifiedStudent[]> {
  // Always clear any cached/stale student data
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('cached_students');
      localStorage.removeItem('registered_users');
    } catch { /* SSR safe */ }
  }

  const demoStudents = buildDemoStudents();

  // Always fetch FRESH from Supabase — never use cached data
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*, student_scores(*)')
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    // If error or null → return only demo students
    if (error || !profiles) {
      console.warn('Supabase fetch failed, showing demo only:', error?.message);
      return demoStudents;
    }

    // Map real profiles → UnifiedStudent format
    const realStudents: UnifiedStudent[] = profiles.map((profile, i) => {
      // student_scores is joined via select('*, student_scores(*)')
      const scoreArr = profile.student_scores;
      const sc = (Array.isArray(scoreArr) ? scoreArr[0] : scoreArr) || {
        aptitude: 50, coding: 50, core_subjects: 50, soft_skills: 50,
        attendance: 75, backlogs: 0, department: 'CS',
      };
      const prsScore = calculatePRS(sc);
      const analysis = analyzeStudent(sc);
      const dept = sc.department || 'CS';

      return {
        id: profile.id,
        name: formatName(profile.name, profile.email),
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
        usn: displayUSN({ usn: profile.usn, email: profile.email, department: dept }, i),
        plan: profile.plan || 'free',
        isDemo: false,
        joinedAt: profile.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      };
    });

    // Return real students PLUS demo students (always show both)
    return [...realStudents, ...demoStudents];
  } catch (err) {
    console.error('Error in getAllStudents:', err);
    // On failure → show ONLY demo students
    return demoStudents;
  }
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
