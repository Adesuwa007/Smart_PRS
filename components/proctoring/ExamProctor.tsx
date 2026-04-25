'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

interface ExamProctorProps {
  children: React.ReactNode;
  examType: string;
  timeLeft: number;
  onTerminate: (reason: string) => void;
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function ExamProctor({ children, examType, timeLeft, onTerminate }: ExamProctorProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [examBlocked, setExamBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [warning, setWarning] = useState('');
  const [showChecklist, setShowChecklist] = useState(true);
  const [examStarted, setExamStarted] = useState(false);
  const [rightClickBlocked, setRightClickBlocked] = useState(false);
  const [keyboardBlocked, setKeyboardBlocked] = useState(false);

  const showWarning = useCallback((msg: string) => {
    setWarning(msg);
    setTimeout(() => setWarning(''), 4000);
  }, []);

  const logViolation = useCallback(async (violationType: string) => {
    // Use localStorage identity keys for consistent demo identity
    const studentId = localStorage.getItem('userId') || user?.id || 'demo-student';
    const studentName = localStorage.getItem('userName') || user?.name || 'Student';

    let message = 'Violation recorded';
    if (violationType === 'tab_switch') message = 'Student switched tabs during exam';
    if (violationType === 'right_click') message = 'Right click attempted during exam';
    if (violationType === 'camera_denied') message = 'Camera permission denied';
    if (violationType === 'copy_paste') message = 'Copy/paste attempted during exam';
    if (violationType === 'keyboard_shortcut') message = 'Keyboard shortcut blocked';
    if (violationType === 'window_blur') message = 'Browser focus lost';

    const violation = {
      student_id: studentId,
      student_name: studentName,
      exam_type: examType,
      violation_type: violationType,
      message,
      occurred_at: new Date().toISOString()
    };
    
    // ALWAYS write to exam_violations immediately (admin reads this key)
    const existing = JSON.parse(
      localStorage.getItem('exam_violations') || '[]'
    );
    existing.unshift(violation);
    localStorage.setItem(
      'exam_violations', 
      JSON.stringify(existing.slice(0, 100))
    );
    
    // Then try Supabase
    try {
      await supabase
        .from('exam_violations')
        .insert(violation);
    } catch {
      // localStorage fallback already saved
    }
  }, [user, examType]);

  // ── 1. Mobile detection (runs immediately on mount) ─────────────────────
  useEffect(() => {
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    const isSmallScreen = window.screen.width < 768;
    if (isMobile || isSmallScreen) {
      setExamBlocked(true);
      setBlockReason('Proctored exams must be taken on a desktop or laptop. Mobile devices are not permitted.');
    }
  }, []);

  // ── 2. Camera request (runs immediately, non-blocking if denied) ─────────
  useEffect(() => {
    if (examBlocked) return;
    let stream: MediaStream | null = null;
    navigator.mediaDevices?.getUserMedia({ video: true, audio: false })
      .then(s => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setCameraActive(true);
      })
      .catch(() => {
        // Camera denied: warn but don't block (not all setups have cameras)
        setCameraError(true);
        logViolation('camera_denied');
      });
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, [examBlocked, logViolation]);

  // ── 3. Right-click blocked IMMEDIATELY (not gated on examStarted) ────────
  useEffect(() => {
    const block = (e: Event) => {
      e.preventDefault();
      showWarning('⚠️ Right-click is disabled during the exam.');
      logViolation('right_click');
    };
    document.addEventListener('contextmenu', block);
    setRightClickBlocked(true);
    return () => document.removeEventListener('contextmenu', block);
  }, [showWarning, logViolation]);

  // ── 4. Keyboard shortcuts blocked IMMEDIATELY ───────────────────────────
  useEffect(() => {
    const blockKeys = (e: KeyboardEvent) => {
      const lowerKey = e.key.toLowerCase();
      const isCopyPaste = e.ctrlKey && ['c', 'v'].includes(lowerKey);
      const blocked =
        (e.ctrlKey && ['c', 'v', 'u', 'a', 's'].includes(lowerKey)) ||
        (e.altKey && e.key === 'Tab') ||
        e.key === 'F12' ||
        e.key === 'PrintScreen';
      if (blocked) {
        e.preventDefault();
        showWarning(`⚠️ Keyboard shortcut blocked: ${e.key.toUpperCase()}`);
        logViolation(isCopyPaste ? 'copy_paste' : 'keyboard_shortcut');
      }
    };
    document.addEventListener('keydown', blockKeys);
    setKeyboardBlocked(true);

    const blockCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      logViolation('copy_paste');
      showWarning('⚠️ Copying is disabled during the exam.');
    };
    document.addEventListener('copy', blockCopy);

    return () => {
      document.removeEventListener('keydown', blockKeys);
      document.removeEventListener('copy', blockCopy);
    };
  }, [showWarning, logViolation]);

  // ── 5. Tab switch detection (only after exam starts) ────────────────────
  useEffect(() => {
    if (!examStarted) return;
    const handleVisibility = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          logViolation('tab_switch');
          if (newCount === 1) showWarning('⚠️ Warning 1/3: Do not switch tabs during the exam!');
          else if (newCount === 2) showWarning('⚠️ Warning 2/3: One more violation will terminate the exam!');
          else if (newCount >= 3) onTerminate('Exam terminated: 3 tab-switch violations recorded.');
          return newCount;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [examStarted, showWarning, onTerminate, logViolation]);

  // ── 6. Window/app focus loss (only after exam starts) ───────────────────
  useEffect(() => {
    if (!examStarted) return;
    const handleBlur = () => {
      logViolation('window_blur');
      showWarning('⚠️ Browser focus lost! Return to the exam immediately.');
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [examStarted, showWarning, logViolation]);

  // ── Blocked screen ───────────────────────────────────────────────────────
  if (examBlocked) {
    return (
      <div className="fixed inset-0 bg-[#F8F7FF] flex items-center justify-center z-50 p-4">
        <div className="text-center max-w-md bg-white border-4 border-[#1A1035] p-8 rounded-2xl shadow-[8px_8px_0px_#1A1035]">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-black text-[#FF4D6D] uppercase tracking-tight mb-2">Exam Access Blocked</h1>
          <p className="text-sm font-bold text-[#1A1035]/70 mb-6">{blockReason}</p>
          <div className="bg-[#FF4D6D]/10 border-2 border-[#1A1035] rounded-xl p-4 text-sm font-bold text-[#1A1035] text-left space-y-2 mb-6 shadow-[inset_0px_2px_4px_rgba(0,0,0,0.05)]">
            <p>✓ Use a laptop or desktop computer</p>
            <p>✓ Allow camera access when prompted</p>
            <p>✓ Ensure stable internet connection</p>
            <p>✓ Close all other browser tabs first</p>
          </div>
          <button onClick={() => window.location.reload()} className="bg-[#1A1035] text-white border-4 border-[#1A1035] py-3 px-8 rounded-xl font-black uppercase tracking-widest shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1 transition-all">Try Again</button>
        </div>
      </div>
    );
  }

  // ── Pre-exam checklist ───────────────────────────────────────────────────
  if (showChecklist) {
    return (
      <div className="fixed inset-0 bg-[#1A1035]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white border-4 border-[#1A1035] p-8 max-w-md w-full animate-fade-in rounded-2xl shadow-[8px_8px_0px_#1A1035]">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">🎓</div>
            <h2 className="text-2xl font-black text-[#1A1035] uppercase tracking-tight">Before You Begin</h2>
            <p className="text-[10px] font-black text-[#1A1035]/50 mt-1 uppercase tracking-widest">Proctored Assessment</p>
          </div>

          <div className="space-y-3 mb-6">
            {[
              { done: cameraActive, warn: cameraError, label: cameraActive ? 'Camera active ✓' : cameraError ? 'Camera unavailable (you may proceed)' : 'Waiting for camera...' },
              { done: rightClickBlocked, label: 'Right-click protection active' },
              { done: keyboardBlocked, label: 'Keyboard shortcut blocking active' },
              { done: true, label: 'Tab-switch monitoring active' },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border-2 shadow-[2px_2px_0px_#1A1035] ${
                item.done
                  ? 'border-[#1A1035] bg-[#00C9A7]/10'
                  : (item as { warn?: boolean }).warn
                    ? 'border-[#1A1035] bg-[#FFB347]/10'
                    : 'border-[#1A1035] bg-[#F8F7FF]'
              }`}>
                <span className="text-lg">{item.done ? '✅' : (item as { warn?: boolean }).warn ? '⚠️' : '⏳'}</span>
                <span className={`text-sm font-black uppercase tracking-tight ${
                  item.done ? 'text-[#00C9A7]' : (item as { warn?: boolean }).warn ? 'text-[#FFB347]' : 'text-[#1A1035]/50'
                }`}>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-[#FFB347]/10 border-2 border-[#1A1035] rounded-xl mb-6 shadow-[inset_0px_2px_4px_rgba(0,0,0,0.05)]">
            <p className="text-xs text-[#FFB347] font-black mb-1 uppercase tracking-widest">⚠️ Integrity Notice</p>
            <p className="text-xs font-bold text-[#1A1035]/70">
              Switching tabs, right-clicking, or using keyboard shortcuts during the exam is monitored and recorded.
              3 tab-switch violations = automatic submission.
            </p>
          </div>

          <button
            onClick={() => { setShowChecklist(false); setExamStarted(true); }}
            className="w-full bg-[#6C47FF] text-white border-4 border-[#1A1035] py-3 px-6 rounded-xl font-black uppercase tracking-widest shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1 transition-all"
          >
            Start Proctored Exam →
          </button>
        </div>
      </div>
    );
  }

  // ── Active exam view ─────────────────────────────────────────────────────
  return (
    <div className="relative">
      {/* Proctor status bar */}
      <div className="fixed top-0 left-0 right-0 h-12 bg-white border-b-4 border-[#1A1035] shadow-[0px_4px_0px_#1A1035] flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#00C9A7] border-2 border-[#1A1035] animate-pulse" />
          <span className="text-xs text-[#1A1035] font-black uppercase tracking-widest">Proctored Session</span>
        </div>

        <div className="flex items-center gap-5 text-[10px] font-black uppercase tracking-widest">
          {/* Camera */}
          <span className={cameraActive ? 'text-[#00C9A7]' : 'text-[#FFB347]'}>
            {cameraActive ? '📷 Cam ON' : '📷 Cam OFF'}
          </span>
          {/* Right-click */}
          <span className="text-[#00C9A7]">🖱️ RC Blocked</span>
          {/* Keyboard */}
          <span className="text-[#00C9A7]">⌨️ Keys Blocked</span>
          {/* Violations */}
          <span className={tabSwitchCount > 0 ? 'text-[#FF4D6D]' : 'text-[#1A1035]/40'}>
            Violations: {tabSwitchCount}/3
          </span>
          {/* Timer */}
          <span className={`font-mono text-sm border-2 border-[#1A1035] px-2 py-0.5 rounded shadow-[2px_2px_0px_#1A1035] ${
            timeLeft <= 10 ? 'bg-[#FF4D6D] text-white animate-pulse' : timeLeft <= 20 ? 'bg-[#FFB347] text-[#1A1035]' : 'bg-[#1A1035] text-[#00C9A7]'
          }`}>
            ⏱ {formatTime(timeLeft)}
          </span>
        </div>

        {/* Camera feed */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-24 h-[36px] rounded object-cover border-2 shadow-[2px_2px_0px_#1A1035] ${cameraActive ? 'border-[#00C9A7]' : 'border-[#1A1035]'}`}
        />
      </div>

      {/* Warning toast */}
      {warning && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#FF4D6D] border-4 border-[#1A1035] rounded-xl px-6 py-3 text-sm text-white font-black uppercase tracking-widest shadow-[6px_6px_0px_#1A1035] animate-fade-in whitespace-nowrap">
          {warning}
        </div>
      )}

      {/* Content — push down to make room for proctor bar */}
      <div className="pt-10">{children}</div>
    </div>
  );
}
