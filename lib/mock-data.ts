// ============================================================================
// SmartPRS — Mock Data Store
// All 15 students + demo accounts for fully demoable MVP
// ============================================================================

import { Profile, StudentScores, Assessment, College, Notification, StudentWithScores } from '@/types';
import { analyzeStudent } from './ai-engine';

// ---------------------------------------------------------------------------
// College
// ---------------------------------------------------------------------------
export const DEMO_COLLEGE: College = {
  id: 'college-001',
  name: 'Vidyavardhaka College of Engineering, Mysuru',
  plan: 'free',
  student_count: 180,
  stripe_customer_id: '',
  stripe_subscription_id: '',
};

// ---------------------------------------------------------------------------
// Demo Users
// ---------------------------------------------------------------------------
export const DEMO_USERS: Profile[] = [
  { id: 'user-student-001', name: 'Arjun Sharma', email: 'student@demo.com', role: 'student', college_id: 'college-001', plan: 'free', department: 'CS', created_at: '2025-06-15' },
  { id: 'user-faculty-001', name: 'Dr. Ramesh Kumar', email: 'faculty@demo.com', role: 'faculty', college_id: 'college-001', plan: 'free', created_at: '2025-01-10' },
  { id: 'user-admin-001', name: 'Prof. Anitha Desai', email: 'admin@demo.com', role: 'admin', college_id: 'college-001', plan: 'free', created_at: '2024-08-01' },
];

// ---------------------------------------------------------------------------
// 15 Student Profiles
// ---------------------------------------------------------------------------
export const STUDENT_PROFILES: Profile[] = [
  { id: 'student-001', name: 'Arjun Sharma', email: 'arjun@vvce.edu', role: 'student', college_id: 'college-001', plan: 'free', department: 'CS', created_at: '2025-06-15' },
  { id: 'student-002', name: 'Priya Nair', email: 'priya@vvce.edu', role: 'student', college_id: 'college-001', plan: 'free', department: 'CS', created_at: '2025-06-15' },
  { id: 'student-003', name: 'Rohit Desai', email: 'rohit@vvce.edu', role: 'student', college_id: 'college-001', plan: 'free', department: 'IS', created_at: '2025-06-15' },
  { id: 'student-004', name: 'Sneha Kulkarni', email: 'sneha@vvce.edu', role: 'student', college_id: 'college-001', plan: 'free', department: 'CS', created_at: '2025-06-15' },
  { id: 'student-005', name: 'Karthik Rao', email: 'karthik@vvce.edu', role: 'student', college_id: 'college-001', plan: 'free', department: 'ECE', created_at: '2025-06-15' },
  { id: 'student-006', name: 'Divya Menon', email: 'divya@vvce.edu', role: 'student', college_id: 'college-001', plan: 'free', department: 'IS', created_at: '2025-06-15' },
  { id: 'student-007', name: 'Aditya Kumar', email: 'aditya@vvce.edu', role: 'student', college_id: 'college-001', plan: 'free', department: 'CS', created_at: '2025-06-15' },
  { id: 'student-008', name: 'Meghna Pillai', email: 'meghna@vvce.edu', role: 'student', college_id: 'college-001', plan: 'free', department: 'ECE', created_at: '2025-06-15' },
  { id: 'student-009', name: 'Suresh Babu', email: 'suresh@vvce.edu', role: 'student', college_id: 'college-001', plan: 'free', department: 'IS', created_at: '2025-06-15' },
  { id: 'student-010', name: 'Anjali Singh', email: 'anjali@vvce.edu', role: 'student', college_id: 'college-001', plan: 'free', department: 'CS', created_at: '2025-06-15' },
  { id: 'student-011', name: 'Vikram Nayak', email: 'vikram@vvce.edu', role: 'student', college_id: 'college-001', plan: 'free', department: 'ECE', created_at: '2025-06-15' },
  { id: 'student-012', name: 'Pooja Iyer', email: 'pooja@vvce.edu', role: 'student', college_id: 'college-001', plan: 'free', department: 'CS', created_at: '2025-06-15' },
  { id: 'student-013', name: 'Rahul Gowda', email: 'rahul@vvce.edu', role: 'student', college_id: 'college-001', plan: 'free', department: 'IS', created_at: '2025-06-15' },
  { id: 'student-014', name: 'Lakshmi Prasad', email: 'lakshmi@vvce.edu', role: 'student', college_id: 'college-001', plan: 'free', department: 'ECE', created_at: '2025-06-15' },
  { id: 'student-015', name: 'Nikhil Joshi', email: 'nikhil@vvce.edu', role: 'student', college_id: 'college-001', plan: 'free', department: 'CS', created_at: '2025-06-15' },
];

// ---------------------------------------------------------------------------
// Student Scores
// ---------------------------------------------------------------------------
export const STUDENT_SCORES: StudentScores[] = [
  { id: 'score-001', student_id: 'student-001', aptitude: 82, coding: 88, core_subjects: 79, soft_skills: 71, attendance: 91, mock_tests_completed: 8, backlogs: 0, updated_at: '2026-04-20' },
  { id: 'score-002', student_id: 'student-002', aptitude: 65, coding: 72, core_subjects: 68, soft_skills: 80, attendance: 88, mock_tests_completed: 5, backlogs: 0, updated_at: '2026-04-20' },
  { id: 'score-003', student_id: 'student-003', aptitude: 45, coding: 52, core_subjects: 58, soft_skills: 62, attendance: 72, mock_tests_completed: 3, backlogs: 1, updated_at: '2026-04-20' },
  { id: 'score-004', student_id: 'student-004', aptitude: 91, coding: 94, core_subjects: 88, soft_skills: 85, attendance: 96, mock_tests_completed: 12, backlogs: 0, updated_at: '2026-04-20' },
  { id: 'score-005', student_id: 'student-005', aptitude: 58, coding: 41, core_subjects: 71, soft_skills: 55, attendance: 65, mock_tests_completed: 2, backlogs: 2, updated_at: '2026-04-20' },
  { id: 'score-006', student_id: 'student-006', aptitude: 78, coding: 80, core_subjects: 74, soft_skills: 88, attendance: 90, mock_tests_completed: 7, backlogs: 0, updated_at: '2026-04-20' },
  { id: 'score-007', student_id: 'student-007', aptitude: 52, coding: 67, core_subjects: 60, soft_skills: 49, attendance: 80, mock_tests_completed: 4, backlogs: 0, updated_at: '2026-04-20' },
  { id: 'score-008', student_id: 'student-008', aptitude: 88, coding: 76, core_subjects: 82, soft_skills: 91, attendance: 93, mock_tests_completed: 9, backlogs: 0, updated_at: '2026-04-20' },
  { id: 'score-009', student_id: 'student-009', aptitude: 40, coding: 35, core_subjects: 48, soft_skills: 52, attendance: 60, mock_tests_completed: 1, backlogs: 3, updated_at: '2026-04-20' },
  { id: 'score-010', student_id: 'student-010', aptitude: 74, coding: 85, core_subjects: 77, soft_skills: 70, attendance: 87, mock_tests_completed: 6, backlogs: 0, updated_at: '2026-04-20' },
  { id: 'score-011', student_id: 'student-011', aptitude: 61, coding: 58, core_subjects: 65, soft_skills: 60, attendance: 78, mock_tests_completed: 3, backlogs: 1, updated_at: '2026-04-20' },
  { id: 'score-012', student_id: 'student-012', aptitude: 95, coding: 91, core_subjects: 92, soft_skills: 89, attendance: 98, mock_tests_completed: 14, backlogs: 0, updated_at: '2026-04-20' },
  { id: 'score-013', student_id: 'student-013', aptitude: 55, coding: 60, core_subjects: 55, soft_skills: 65, attendance: 75, mock_tests_completed: 3, backlogs: 0, updated_at: '2026-04-20' },
  { id: 'score-014', student_id: 'student-014', aptitude: 70, coding: 48, core_subjects: 72, soft_skills: 75, attendance: 82, mock_tests_completed: 4, backlogs: 1, updated_at: '2026-04-20' },
  { id: 'score-015', student_id: 'student-015', aptitude: 83, coding: 79, core_subjects: 81, soft_skills: 77, attendance: 89, mock_tests_completed: 7, backlogs: 0, updated_at: '2026-04-20' },
];

// ---------------------------------------------------------------------------
// Mock Assessments (history for progress charts)
// ---------------------------------------------------------------------------
export const MOCK_ASSESSMENTS: Assessment[] = [
  // Arjun's assessment history
  { id: 'assess-001', student_id: 'student-001', type: 'coding', score: 72, taken_at: '2025-11-15', notes: 'Mid-semester coding test' },
  { id: 'assess-002', student_id: 'student-001', type: 'aptitude', score: 68, taken_at: '2025-12-01', notes: 'Aptitude practice test' },
  { id: 'assess-003', student_id: 'student-001', type: 'coding', score: 78, taken_at: '2026-01-10', notes: 'DSA assessment' },
  { id: 'assess-004', student_id: 'student-001', type: 'mock', score: 75, taken_at: '2026-02-01', notes: 'Full mock placement test' },
  { id: 'assess-005', student_id: 'student-001', type: 'coding', score: 84, taken_at: '2026-03-01', notes: 'Advanced DSA test' },
  { id: 'assess-006', student_id: 'student-001', type: 'mock', score: 82, taken_at: '2026-04-01', notes: 'Pre-placement mock' },
];

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'notif-001', user_id: 'student-001', message: '📊 Your coding score was updated to 88!', read: false, created_at: '2026-04-20T10:30:00' },
  { id: 'notif-002', user_id: 'student-001', message: '🎯 New assessment available: Core Subjects Mock Test', read: false, created_at: '2026-04-19T14:00:00' },
  { id: 'notif-003', user_id: 'student-001', message: '🏆 You moved up 3 ranks in your batch!', read: true, created_at: '2026-04-18T09:15:00' },
  { id: 'notif-004', user_id: 'student-001', message: '💡 Pro tip: Solve 3 more DSA problems to reach Product tier', read: true, created_at: '2026-04-17T16:45:00' },
];

// ---------------------------------------------------------------------------
// Historical PRS data for progress chart
// ---------------------------------------------------------------------------
export const PRS_HISTORY = [
  { date: 'Nov 2025', prs: 62 },
  { date: 'Dec 2025', prs: 66 },
  { date: 'Jan 2026', prs: 71 },
  { date: 'Feb 2026', prs: 75 },
  { date: 'Mar 2026', prs: 79 },
  { date: 'Apr 2026', prs: 82 },
];

// ---------------------------------------------------------------------------
// Helper: Get all students with scores and PRS
// ---------------------------------------------------------------------------
export function getAllStudentsWithScores(): StudentWithScores[] {
  const base = STUDENT_PROFILES.map(profile => {
    const scores = STUDENT_SCORES.find(s => s.student_id === profile.id);
    const prs = scores ? analyzeStudent(scores) : undefined;
    return { ...profile, scores, prs };
  });

  if (typeof window === 'undefined') return base;

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
  const user = currentAuthUser || {
    id: 'demo-student',
    name: localStorage.getItem('demoName') || 'Arjun Sharma',
    email: localStorage.getItem('demoEmail') || 'student@demo.com',
    role: demoRole || '',
  };

  if (user.role !== 'student') return base;

  const currentStudent = base.find(s => s.email.toLowerCase() === user.email.toLowerCase());
  if (currentStudent) return base;

  // If NOT found: Inject into list
  base.push({
    id: user.id,
    name: user.name,
    email: user.email,
    role: 'student',
    college_id: 'college-001',
    plan: 'free',
    department: 'CS',
    created_at: new Date().toISOString(),
    scores: { id: `score-${user.id}`, student_id: user.id, aptitude: 0, coding: 0, core_subjects: 0, soft_skills: 0, attendance: 0, mock_tests_completed: 0, backlogs: 0, updated_at: new Date().toISOString() },
    prs: { score: 0, probability: 'Low', probabilityRange: '0%', weakAreas: [], recommendations: [], companyTiers: [] }
  });

  return base;
}

// Batch average scores (for radar chart overlay)
export function getBatchAverageScores() {
  const total = STUDENT_SCORES.length;
  return {
    aptitude: Math.round(STUDENT_SCORES.reduce((a, s) => a + s.aptitude, 0) / total),
    coding: Math.round(STUDENT_SCORES.reduce((a, s) => a + s.coding, 0) / total),
    core_subjects: Math.round(STUDENT_SCORES.reduce((a, s) => a + s.core_subjects, 0) / total),
    soft_skills: Math.round(STUDENT_SCORES.reduce((a, s) => a + s.soft_skills, 0) / total),
    attendance: Math.round(STUDENT_SCORES.reduce((a, s) => a + s.attendance, 0) / total),
  };
}
