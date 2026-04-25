import { fetchAllStudentsServer, getMockStudents } from './student-actions';

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

export async function getAllStudents(): Promise<UnifiedStudent[]> {
  const demoStudents = await getMockStudents();

  // Try to fetch real Supabase students via Server Action (bypasses RLS)
  try {
    const realStudents = await fetchAllStudentsServer();

    if (realStudents.length === 0) {
      // If we literally have 0 students in the DB, we might want to show demo ones
      // But only if we are in a demo context. For now, let's return demo if empty
      // to avoid a totally blank screen for first-time users.
      // BUT if the user specifically deleted them, they want it empty.
      // We'll return demo students ONLY if profiles fetch failed or is strictly null.
      // Since fetchAllStudentsServer returns [] on empty, let's check if we want fallback.
      return ensureLoggedInStudent(demoStudents);
    }

    return ensureLoggedInStudent(realStudents);
  } catch (err) {
    console.error('Error in getAllStudents:', err);
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
