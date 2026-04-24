// ============================================================================
// SmartPRS — Type Definitions
// ============================================================================

export type Role = 'student' | 'faculty' | 'admin';
export type Plan = 'free' | 'pro' | 'enterprise';
export type AssessmentType = 'aptitude' | 'coding' | 'core' | 'soft_skills' | 'mock';
export type Department = 'CS' | 'IS' | 'ECE';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: Role;
  college_id: string;
  plan: Plan;
  department?: Department;
  created_at: string;
}

export interface StudentScores {
  id: string;
  student_id: string;
  aptitude: number;
  coding: number;
  core_subjects: number;
  soft_skills: number;
  attendance: number;
  mock_tests_completed: number;
  backlogs: number;
  updated_at: string;
}

export interface Assessment {
  id: string;
  student_id: string;
  type: AssessmentType;
  score: number;
  taken_at: string;
  notes: string;
}

export interface College {
  id: string;
  name: string;
  plan: Plan;
  student_count: number;
  stripe_customer_id: string;
  stripe_subscription_id: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type?: string;
  title?: string;
  message: string;
  meet_link?: string;
  read: boolean;
  created_at: string;
}

// AI Engine Types
export interface PRSResult {
  score: number;
  probability: string;
  probabilityRange: string;
  weakAreas: WeakArea[];
  recommendations: Recommendation[];
  companyTiers: string[];
  rank?: number;
  totalStudents?: number;
}

export interface WeakArea {
  skill: string;
  score: number;
  severity: 'critical' | 'needs_improvement' | 'good';
  recommendation: string;
}

export interface Recommendation {
  icon: string;
  title: string;
  description: string;
  impact: string;
}

export interface StudentWithScores extends Profile {
  scores?: StudentScores;
  prs?: PRSResult;
}

// Chat types for SmartCoach
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Feature gate
export interface FeatureGateResult {
  allowed: boolean;
  reason: string;
}

export interface StudentPortfolio {
  studentId: string;
  studentName: string;
  linkedInUrl: string;
  githubUsername: string;
  topProjects: string[];
  updatedAt: string;
}

export interface MeetingRecord {
  id: string;
  studentId: string;
  studentName: string;
  facultyName: string;
  scheduledAt: string;
  agenda: string;
  notes: string;
  meetingLink?: string;
  outcome?: string;
  createdAt: string;
}

export interface ViolationRecord {
  id?: string;
  student_id: string;
  student_name: string;
  exam_type: string;
  violation_type: string;
  message: string;
  occurred_at: string;
}

export interface ImprovementSession {
  id: string;
  faculty_id: string;
  faculty_name: string;
  student_id: string;
  student_name: string;
  weak_area: string;
  target_score: number;
  current_score: number;
  session_date: string;
  meet_link?: string;
  agenda: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  outcome_notes?: string;
  outcome_rating?: 'Excellent' | 'Good' | 'Needs More Work';
  score_after_session?: number;
  materials?: string;
  created_at: string;
}
