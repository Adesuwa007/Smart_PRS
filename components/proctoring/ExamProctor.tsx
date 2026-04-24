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

  const logViolation = useCallback((type: string, message: string) => {
    try {
      supabase.from('exam_violations').insert({
        student_id: user?.id || 'unknown',
        student_name: user?.name || 'Unknown',
        exam_type: examType,
        violation_type: type,
        message,
        occurred_at: new Date().toISOString(),
      });
    } catch { /* non-critical */ }
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
        logViolation('camera_denied', 'Camera permission was denied or unavailable');
      });
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, [examBlocked, logViolation]);

  // ── 3. Right-click blocked IMMEDIATELY (not gated on examStarted) ────────
  useEffect(() => {
    const block = (e: Event) => {
      e.preventDefault();
      showWarning('⚠️ Right-click is disabled during the exam.');
      logViolation('right_click', 'Right-click attempted');
    };
    document.addEventListener('contextmenu', block);
    setRightClickBlocked(true);
    return () => document.removeEventListener('contextmenu', block);
  }, [showWarning, logViolation]);

  // ── 4. Keyboard shortcuts blocked IMMEDIATELY ───────────────────────────
  useEffect(() => {
    const blockKeys = (e: KeyboardEvent) => {
      const blocked =
        (e.ctrlKey && ['c', 'v', 'u', 'a', 's'].includes(e.key.toLowerCase())) ||
        (e.altKey && e.key === 'Tab') ||
        e.key === 'F12' ||
        e.key === 'PrintScreen';
      if (blocked) {
        e.preventDefault();
        showWarning(`⚠️ Keyboard shortcut blocked: ${e.key.toUpperCase()}`);
        logViolation('keyboard_shortcut', `Blocked key: ${e.key}`);
      }
    };
    document.addEventListener('keydown', blockKeys);
    setKeyboardBlocked(true);
    return () => document.removeEventListener('keydown', blockKeys);
  }, [showWarning, logViolation]);

  // ── 5. Tab switch detection (only after exam starts) ────────────────────
  useEffect(() => {
    if (!examStarted) return;
    const handleVisibility = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          logViolation('tab_switch', `Tab switched — violation ${newCount}/3`);
          if (newCount === 1) showWarning('⚠️ Warning 1/3: Do not switch tabs during the exam!');
          else if (newCount === 2) showWarning('⚠️ Warning 2/3: One more violation will terminate the exam!');
          else if (newCount >= 3) onTerminate('Exam terminated: 3 tab-switch violations recorded.');
          return newCount;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [examStarted, logViolation, showWarning, onTerminate]);

  // ── 6. Window/app focus loss (only after exam starts) ───────────────────
  useEffect(() => {
    if (!examStarted) return;
    const handleBlur = () => {
      logViolation('window_blur', 'Browser window lost focus to another application');
      showWarning('⚠️ Browser focus lost! Return to the exam immediately.');
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [examStarted, logViolation, showWarning]);

  // ── Blocked screen ───────────────────────────────────────────────────────
  if (examBlocked) {
    return (
      <div className="fixed inset-0 bg-red-950/95 flex items-center justify-center z-50 p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-red-400 mb-2">Exam Access Blocked</h1>
          <p className="text-gray-300 mb-6">{blockReason}</p>
          <div className="bg-red-900/50 rounded-xl p-4 text-sm text-red-300 text-left space-y-2 mb-6">
            <p>✓ Use a laptop or desktop computer</p>
            <p>✓ Allow camera access when prompted</p>
            <p>✓ Ensure stable internet connection</p>
            <p>✓ Close all other browser tabs first</p>
          </div>
          <button onClick={() => window.location.reload()} className="btn-primary py-3 px-8">Try Again</button>
        </div>
      </div>
    );
  }

  // ── Pre-exam checklist ───────────────────────────────────────────────────
  if (showChecklist) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="glass-card p-8 max-w-md w-full animate-fade-in">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🎓</div>
            <h2 className="text-xl font-bold text-white">Before You Begin</h2>
            <p className="text-sm text-gray-400 mt-1">Proctored Assessment</p>
          </div>

          <div className="space-y-3 mb-6">
            {[
              { done: cameraActive, warn: cameraError, label: cameraActive ? 'Camera active ✓' : cameraError ? 'Camera unavailable (you may still proceed)' : 'Waiting for camera...' },
              { done: rightClickBlocked, label: 'Right-click protection active' },
              { done: keyboardBlocked, label: 'Keyboard shortcut blocking active' },
              { done: true, label: 'Tab-switch monitoring active' },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${
                item.done
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : (item as { warn?: boolean }).warn
                    ? 'border-yellow-500/30 bg-yellow-500/5'
                    : 'border-gray-700 bg-gray-800/30'
              }`}>
                <span>{item.done ? '✅' : (item as { warn?: boolean }).warn ? '⚠️' : '⏳'}</span>
                <span className={`text-sm ${
                  item.done ? 'text-emerald-400' : (item as { warn?: boolean }).warn ? 'text-yellow-400' : 'text-gray-400'
                }`}>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl mb-6">
            <p className="text-xs text-yellow-400 font-semibold mb-1">⚠️ Integrity Notice</p>
            <p className="text-xs text-gray-400">
              Switching tabs, right-clicking, or using keyboard shortcuts during the exam is monitored and recorded.
              3 tab-switch violations = automatic submission.
            </p>
          </div>

          <button
            onClick={() => { setShowChecklist(false); setExamStarted(true); }}
            className="btn-primary w-full py-3"
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
      <div className="fixed top-0 left-0 right-0 h-10 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-gray-300 font-medium">Proctored Session Active</span>
        </div>

        <div className="flex items-center gap-5 text-xs">
          {/* Camera */}
          <span className={cameraActive ? 'text-emerald-400' : 'text-yellow-400'}>
            {cameraActive ? '📷 Camera ON' : '📷 Camera OFF'}
          </span>
          {/* Right-click */}
          <span className="text-emerald-400">🖱️ RC Blocked</span>
          {/* Keyboard */}
          <span className="text-emerald-400">⌨️ Keys Blocked</span>
          {/* Violations */}
          <span className={tabSwitchCount > 0 ? 'text-yellow-400 font-bold' : 'text-gray-500'}>
            Violations: {tabSwitchCount}/3
          </span>
          {/* Timer */}
          <span className={`font-mono font-bold ${
            timeLeft <= 10 ? 'text-red-400 animate-pulse' : timeLeft <= 20 ? 'text-yellow-400' : 'text-gray-300'
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
          className={`w-20 h-[30px] rounded object-cover border ${cameraActive ? 'border-emerald-500/50' : 'border-gray-700'}`}
        />
      </div>

      {/* Warning toast */}
      {warning && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-red-950 border border-red-500/60 rounded-xl px-6 py-3 text-sm text-red-300 font-semibold shadow-2xl animate-fade-in whitespace-nowrap">
          {warning}
        </div>
      )}

      {/* Content — push down to make room for proctor bar */}
      <div className="pt-10">{children}</div>
    </div>
  );
}
