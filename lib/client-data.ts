import { supabase } from './supabase';
import type { MeetingRecord, StudentPortfolio, ViolationRecord, ImprovementSession, Notification } from '@/types';

const PORTFOLIO_KEY = 'studentPortfolioMap';
const MEETINGS_KEY = 'smartprsMeetings';
const VIOLATIONS_KEY = 'smartprsViolations';
const VIOLATION_READ_TS_KEY = 'smartprsViolationLastReadAt';
const LEGACY_MEETINGS_KEY = 'meetings';
const LEGACY_VIOLATIONS_KEY = 'violations';

function getMap<T>(key: string): Record<string, T> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(key) || '{}') as Record<string, T>;
  } catch {
    return {};
  }
}

function setMap<T>(key: string, value: Record<string, T>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getStudentPortfolio(studentId: string, studentName: string): StudentPortfolio {
  const map = getMap<StudentPortfolio>(PORTFOLIO_KEY);
  return map[studentId] || {
    studentId,
    studentName,
    linkedInUrl: '',
    githubUsername: '',
    topProjects: ['', '', ''],
    updatedAt: new Date().toISOString(),
  };
}

export function saveStudentPortfolio(portfolio: StudentPortfolio) {
  const map = getMap<StudentPortfolio>(PORTFOLIO_KEY);
  map[portfolio.studentId] = { ...portfolio, updatedAt: new Date().toISOString() };
  setMap(PORTFOLIO_KEY, map);
}

export function getMeetings(): MeetingRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const primary = localStorage.getItem(MEETINGS_KEY);
    const legacy = localStorage.getItem(LEGACY_MEETINGS_KEY);
    return JSON.parse(primary || legacy || '[]') as MeetingRecord[];
  } catch {
    return [];
  }
}

export function saveMeetings(meetings: MeetingRecord[]) {
  if (typeof window === 'undefined') return;
  const payload = JSON.stringify(meetings);
  localStorage.setItem(MEETINGS_KEY, payload);
  localStorage.setItem(LEGACY_MEETINGS_KEY, payload);
}

export async function createMeeting(meeting: MeetingRecord) {
  const current = getMeetings();
  saveMeetings([meeting, ...current]);
  try {
    await supabase.from('meetings').insert(meeting);
  } catch {
    // demo/local fallback is already persisted
  }
}

export async function updateMeetingOutcome(meetingId: string, outcome: string) {
  const next = getMeetings().map(m => (m.id === meetingId ? { ...m, outcome } : m));
  saveMeetings(next);
  try {
    await supabase.from('meetings').update({ outcome }).eq('id', meetingId);
  } catch {
    // local fallback only
  }
}

export async function recordViolation(violation: ViolationRecord) {
  const withId = { ...violation, id: violation.id || `vio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
  const current = getViolationFallback();
  const next = [withId, ...current].slice(0, 200);
  const payload = JSON.stringify(next);
  localStorage.setItem(VIOLATIONS_KEY, payload);
  localStorage.setItem(LEGACY_VIOLATIONS_KEY, payload);
  localStorage.setItem('smartprsUnreadViolationCount', String(getUnreadViolationCount(next)));
  try {
    await supabase.from('exam_violations').insert(violation);
  } catch {
    // local fallback already done
  }
}

export function getViolationFallback(): ViolationRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const primary = localStorage.getItem(VIOLATIONS_KEY);
    const legacy = localStorage.getItem(LEGACY_VIOLATIONS_KEY);
    return JSON.parse(primary || legacy || '[]') as ViolationRecord[];
  } catch {
    return [];
  }
}

export async function getViolationFeed(limit = 15): Promise<ViolationRecord[]> {
  try {
    const { data } = await supabase.from('exam_violations').select('*').order('occurred_at', { ascending: false }).limit(limit);
    if (data && data.length > 0) return data as ViolationRecord[];
  } catch {
    // fallback below
  }
  return getViolationFallback().slice(0, limit);
}

export function getUnreadViolationCount(violations: ViolationRecord[]) {
  if (typeof window === 'undefined') return 0;
  const lastReadAt = localStorage.getItem(VIOLATION_READ_TS_KEY);
  if (!lastReadAt) return violations.length;
  return violations.filter(v => new Date(v.occurred_at).getTime() > new Date(lastReadAt).getTime()).length;
}

export function markViolationsRead() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VIOLATION_READ_TS_KEY, new Date().toISOString());
}

// ============================================================================
// Improvement Sessions
// ============================================================================
const SESSIONS_KEY = 'smartprsImprovementSessions';

export function getImprovementSessions(): ImprovementSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) {
      // Pre-seed demo sessions for Student (demo-student)
      const demoSessions: ImprovementSession[] = [
        {
          id: 'demo-sess-1',
          faculty_id: 'fac-1',
          faculty_name: 'Faculty',
          student_id: 'demo-student',
          student_name: 'Student',
          weak_area: 'Soft Skills',
          target_score: 85,
          current_score: 71,
          session_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          meet_link: 'https://meet.google.com/abc-defg-hij',
          agenda: 'HR round preparation, communication techniques, mock behavioral questions',
          status: 'scheduled',
          created_at: new Date().toISOString()
        },
        {
          id: 'demo-sess-2',
          faculty_id: 'fac-1',
          faculty_name: 'Faculty',
          student_id: 'demo-student',
          student_name: 'Student',
          weak_area: 'Aptitude',
          target_score: 90,
          current_score: 82,
          session_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          agenda: 'Time management, percentages, number series',
          status: 'completed',
          outcome_notes: 'Student showed improvement in time management. Focus on percentage and profit-loss problems next week.',
          outcome_rating: 'Good',
          score_after_session: 86,
          materials: 'Practice here: https://www.indiabix.com/aptitude/questions\nFocus on: Time & Work, Percentages, Number Series',
          created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(demoSessions));
      // Also seed an unread notification for the upcoming session
      const notifKey = NOTIFICATIONS_KEY;
      const existingNotifs = localStorage.getItem(notifKey);
      if (!existingNotifs || JSON.parse(existingNotifs).length === 0) {
        const demoNotif = [{
          id: 'notif-demo-1',
          user_id: 'demo-student',
          type: 'session_scheduled',
          title: 'New Improvement Session Scheduled',
          message: 'Faculty scheduled a Soft Skills session in 3 days',
          meet_link: 'https://meet.google.com/abc-defg-hij',
          read: false,
          created_at: new Date().toISOString()
        }];
        localStorage.setItem(notifKey, JSON.stringify(demoNotif));
      }
      return demoSessions;
    }
    return JSON.parse(raw) as ImprovementSession[];
  } catch {
    return [];
  }
}

export function saveImprovementSessions(sessions: ImprovementSession[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export async function createImprovementSession(session: ImprovementSession) {
  const current = getImprovementSessions();
  saveImprovementSessions([session, ...current]);
  try {
    await supabase.from('improvement_sessions').insert(session);
  } catch {}
}

export async function updateImprovementSession(sessionId: string, updates: Partial<ImprovementSession>) {
  const next = getImprovementSessions().map(s => (s.id === sessionId ? { ...s, ...updates } : s));
  saveImprovementSessions(next);
  try {
    await supabase.from('improvement_sessions').update(updates).eq('id', sessionId);
  } catch {}
}

// ============================================================================
// Notifications
// ============================================================================
const NOTIFICATIONS_KEY = 'smartprsNotifications';

export function getNotifications(): Notification[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]') as Notification[];
  } catch {
    return [];
  }
}

export function saveNotifications(notifications: Notification[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

export async function createNotification(notification: Notification) {
  const current = getNotifications();
  saveNotifications([notification, ...current]);
  try {
    await supabase.from('notifications').insert(notification);
  } catch {}
}
