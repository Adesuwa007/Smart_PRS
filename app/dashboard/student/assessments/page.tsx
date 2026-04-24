'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { getRandomQuestions, type QuestionCategory, type Question } from '@/lib/question-bank';
import { analyzeStudent } from '@/lib/ai-engine';
import { STUDENT_SCORES } from '@/lib/mock-data';
import ExamProctor from '@/components/proctoring/ExamProctor';
import toast, { Toaster } from 'react-hot-toast';

const CATEGORIES = [
  { key: 'aptitude' as QuestionCategory, label: 'Aptitude', icon: '🧮', color: 'text-brand-cyan', scoreKey: 'aptitude' },
  { key: 'coding' as QuestionCategory, label: 'Coding', icon: '💻', color: 'text-brand-purple', scoreKey: 'coding' },
  { key: 'core_subjects' as QuestionCategory, label: 'Core Subjects', icon: '📚', color: 'text-emerald-400', scoreKey: 'core_subjects' },
  { key: 'soft_skills' as QuestionCategory, label: 'Soft Skills', icon: '🗣️', color: 'text-yellow-400', scoreKey: 'soft_skills' },
];

export default function AssessmentsPage() {
  const { user } = useAuth();

  const [phase, setPhase] = useState<'select' | 'quiz' | 'result'>('select');
  const [category, setCategory] = useState<QuestionCategory | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [saving, setSaving] = useState(false);
  const [currentScores, setCurrentScores] = useState(STUDENT_SCORES[0]);
  const [terminated, setTerminated] = useState(false);

  const score = answers.filter((a, i) => a === questions[i]?.correct).length;
  const scorePercent = Math.round((score / questions.length) * 100);

  // Fetch real scores for non-demo users
  useEffect(() => {
    if (user && !user.isDemo) {
      supabase.from('student_scores').select('*').eq('student_id', user.id).single()
        .then(({ data }) => { if (data) setCurrentScores(data); });
    }
  }, [user]);

  const advanceQuestion = useCallback((forcedAnswer?: number) => {
    const answer = forcedAnswer !== undefined ? forcedAnswer : selectedOption ?? -1;
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentQ + 1 >= questions.length) {
      setPhase('result');
    } else {
      setCurrentQ(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
      setTimeLeft(30);
    }
  }, [answers, currentQ, questions.length, selectedOption]);

  // Timer
  useEffect(() => {
    if (phase !== 'quiz') return;
    if (timeLeft === 0) { advanceQuestion(-1); return; }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [phase, timeLeft, advanceQuestion]);

  const startCategory = (cat: QuestionCategory) => {
    setCategory(cat);
    setQuestions(getRandomQuestions(cat, 10));
    setCurrentQ(0);
    setSelectedOption(null);
    setAnswers([]);
    setShowExplanation(false);
    setTimeLeft(30);
    setPhase('quiz');
  };

  const handleOptionClick = (idx: number) => {
    if (selectedOption !== null) return; // already answered
    setSelectedOption(idx);
    setShowExplanation(true);
  };

  const handleSaveScore = async () => {
    if (!category || !user) return;
    setSaving(true);
    const catInfo = CATEGORIES.find(c => c.key === category);
    if (!catInfo) { setSaving(false); return; }

    if (user.isDemo) {
      toast.success('Score saved! (Demo mode — not persisted to DB)');
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('student_scores')
      .update({ [catInfo.scoreKey]: scorePercent })
      .eq('student_id', user.id);

    if (error) {
      toast.error('Failed to save: ' + error.message);
    } else {
      toast.success(`${catInfo.label} score updated to ${scorePercent}! PRS recalculated.`);
    }
    setSaving(false);
  };

  const resetToSelect = () => {
    setPhase('select');
    setCategory(null);
    setQuestions([]);
    setAnswers([]);
    setCurrentQ(0);
    setSelectedOption(null);
  };

  const q = questions[currentQ];
  const prs = analyzeStudent(currentScores);

  return (
    <DashboardLayout role="student" userName={user?.name || 'Student'}>
      <Toaster position="top-center" />
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white">Assessments 📝</h1>
          <p className="text-sm text-gray-400 mt-1">Real questions, real scores — your PRS updates with every attempt.</p>
        </div>

        {/* Current scores banner */}
        <div className="glass-card p-5 flex flex-wrap gap-4">
          {[
            { label: 'Aptitude', score: currentScores.aptitude, color: '#06B6D4' },
            { label: 'Coding', score: currentScores.coding, color: '#8B5CF6' },
            { label: 'Core', score: currentScores.core_subjects, color: '#10B981' },
            { label: 'Soft Skills', score: currentScores.soft_skills, color: '#F59E0B' },
            { label: 'PRS', score: Math.round(prs.score), color: '#06B6D4' },
          ].map((s, i) => (
            <div key={i} className="flex-1 min-w-[90px] text-center">
              <div className="text-xl font-bold" style={{ color: s.color }}>{s.score}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Phase: Select */}
        {phase === 'select' && (
          <div>
            <h2 className="text-base font-semibold text-white mb-4">Choose Assessment</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {CATEGORIES.map(cat => (
                <button key={cat.key} onClick={() => startCategory(cat.key)}
                  className="glass-card p-6 text-left hover:border-brand-cyan/40 transition-all group cursor-pointer">
                  <div className="text-3xl mb-3">{cat.icon}</div>
                  <h3 className={`text-base font-semibold ${cat.color} mb-1 group-hover:text-white transition`}>{cat.label}</h3>
                  <p className="text-xs text-gray-500 mb-4">10 questions · 30 sec each</p>
                  <span className="btn-secondary py-1.5 px-4 text-xs">Start →</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Phase: Quiz — proctored */}
        {phase === 'quiz' && q && terminated && (
          <div className="glass-card p-8 text-center max-w-lg mx-auto border-red-500/20">
            <div className="text-4xl mb-4">🚫</div>
            <h2 className="text-xl font-bold text-red-400 mb-2">Exam Terminated</h2>
            <p className="text-sm text-gray-400 mb-6">Your exam was terminated due to integrity violations. Your session has been recorded.</p>
            <button onClick={resetToSelect} className="btn-secondary py-2.5 px-6">← Back to Assessments</button>
          </div>
        )}
        {phase === 'quiz' && q && !terminated && (
          <ExamProctor
            examType={category || 'unknown'}
            timeLeft={timeLeft}
            onTerminate={(reason) => { setTerminated(true); toast.error(reason); }}
          >
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Question {currentQ + 1} / {questions.length}</span>
                <span className={`text-sm font-mono font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-brand-cyan'}`}>{timeLeft}s</span>
              </div>
              <div className="w-full h-1.5 bg-brand-border rounded-full mb-6">
                <div className="h-full bg-brand-cyan rounded-full transition-all" style={{ width: `${(currentQ / questions.length) * 100}%` }} />
              </div>
              <div className="glass-card p-6 space-y-5">
                <div>
                  <span className="badge badge-cyan text-[10px] mb-3 inline-block">{CATEGORIES.find(c => c.key === category)?.label}</span>
                  <h2 className="text-lg font-semibold text-white whitespace-pre-line">{q.question}</h2>
                </div>
                <div className="space-y-3">
                  {q.options.map((opt, idx) => {
                    let cls = 'w-full text-left p-4 rounded-xl border transition-all text-sm font-medium ';
                    if (selectedOption === null) {
                      cls += 'border-brand-border hover:border-brand-cyan/40 hover:bg-brand-surface text-gray-300 cursor-pointer';
                    } else if (idx === q.correct) {
                      cls += 'border-emerald-500 bg-emerald-500/10 text-emerald-400';
                    } else if (idx === selectedOption && idx !== q.correct) {
                      cls += 'border-red-500 bg-red-500/10 text-red-400';
                    } else {
                      cls += 'border-brand-border/30 text-gray-500 cursor-default';
                    }
                    return (
                      <button key={idx} className={cls} onClick={() => handleOptionClick(idx)}>
                        <span className="mr-3 text-gray-600">{String.fromCharCode(65 + idx)}.</span>{opt}
                      </button>
                    );
                  })}
                </div>
                {showExplanation && (
                  <div className="p-3 bg-brand-cyan/5 border border-brand-cyan/20 rounded-xl">
                    <p className="text-xs text-brand-cyan font-semibold mb-1">💡 Explanation</p>
                    <p className="text-xs text-gray-300">{q.explanation}</p>
                  </div>
                )}
                {selectedOption !== null && (
                  <button onClick={() => advanceQuestion()} className="btn-primary w-full py-3">
                    {currentQ + 1 >= questions.length ? '🏁 See Results' : 'Next Question →'}
                  </button>
                )}
              </div>
            </div>
          </ExamProctor>
        )}

        {/* Phase: Result */}
        {phase === 'result' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="glass-card p-8 text-center border-emerald-500/20 ring-1 ring-emerald-500/10">
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-xl font-bold text-white mb-2">Assessment Complete!</h2>
              <div className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-purple my-4">
                {scorePercent}
              </div>
              <p className="text-gray-400 text-sm mb-2">You scored <span className="text-white font-bold">{score} / {questions.length}</span> correct</p>
              <p className="text-xs text-gray-500 mb-6">
                This updates your <span className="text-brand-cyan">{CATEGORIES.find(c => c.key === category)?.label}</span> score
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <button onClick={handleSaveScore} disabled={saving} className="btn-primary py-2.5 px-8 disabled:opacity-50">
                  {saving ? '💾 Saving...' : '💾 Save Score'}
                </button>
                <button onClick={() => { if (category) startCategory(category); }} className="btn-secondary py-2.5 px-6">
                  🔄 Try Again
                </button>
                <button onClick={resetToSelect} className="btn-secondary py-2.5 px-6">
                  ← Choose Category
                </button>
              </div>
            </div>

            {/* Review answers */}
            <div className="glass-card p-6">
              <h3 className="text-base font-semibold text-white mb-4">Review Answers</h3>
              <div className="space-y-3">
                {questions.map((q2, i) => {
                  const yours = answers[i];
                  const correct = q2.correct;
                  const wasCorrect = yours === correct;
                  return (
                    <div key={i} className={`p-3 rounded-xl border text-sm ${wasCorrect ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                      <div className="flex items-start gap-2 mb-1">
                        <span>{wasCorrect ? '✅' : '❌'}</span>
                        <p className="text-white font-medium text-xs">{q2.question}</p>
                      </div>
                      {!wasCorrect && (
                        <p className="text-xs text-gray-400 ml-5">
                          Correct: <span className="text-emerald-400">{q2.options[correct]}</span>
                          {yours >= 0 && <span className="text-red-400"> · Your answer: {q2.options[yours]}</span>}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
