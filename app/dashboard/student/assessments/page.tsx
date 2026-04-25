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
  { key: 'aptitude' as QuestionCategory, label: 'Aptitude', icon: '🧮', color: 'text-[#00C9A7]', scoreKey: 'aptitude' },
  { key: 'coding' as QuestionCategory, label: 'Coding', icon: '💻', color: 'text-[#6C47FF]', scoreKey: 'coding' },
  { key: 'core_subjects' as QuestionCategory, label: 'Core Subjects', icon: '📚', color: 'text-[#00C9A7]', scoreKey: 'core_subjects' },
  { key: 'soft_skills' as QuestionCategory, label: 'Soft Skills', icon: '🗣️', color: 'text-[#FFB347]', scoreKey: 'soft_skills' },
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
          <h1 className="text-3xl font-black text-[#1A1035] uppercase tracking-tight">Assessments 📝</h1>
          <p className="text-sm font-bold text-[#1A1035]/60 mt-1">Real questions, real scores — your PRS updates with every attempt.</p>
        </div>

        {/* Current scores banner */}
        <div className="bg-[#1A1035] text-white border-4 border-[#1A1035] p-6 rounded-2xl shadow-[6px_6px_0px_#00C9A7] flex flex-wrap gap-6 justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00C9A7] rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
          {[
            { label: 'Aptitude', score: currentScores.aptitude, color: '#00C9A7' },
            { label: 'Coding', score: currentScores.coding, color: '#6C47FF' },
            { label: 'Core', score: currentScores.core_subjects, color: '#00C9A7' },
            { label: 'Soft Skills', score: currentScores.soft_skills, color: '#FFB347' },
            { label: 'PRS', score: Math.round(prs.score), color: '#00C9A7', isPrs: true },
          ].map((s, i) => (
            <div key={i} className={`flex-1 min-w-[90px] text-center ${s.isPrs ? 'bg-white text-[#1A1035] p-3 rounded-xl border-4 border-[#1A1035] shadow-[4px_4px_0px_#00C9A7] transform -rotate-2' : ''}`}>
              <div className="text-2xl font-black" style={{ color: s.isPrs ? '#1A1035' : s.color }}>{s.score}</div>
              <div className={`text-[10px] font-black uppercase tracking-widest mt-1 ${s.isPrs ? 'text-[#1A1035]/60' : 'text-white/60'}`}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Phase: Select */}
        {phase === 'select' && (
          <div>
            <h2 className="text-sm font-black text-[#1A1035] uppercase tracking-wider mb-6 border-b-4 border-[#1A1035]/10 pb-4">Choose Assessment</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {CATEGORIES.map(cat => (
                <button key={cat.key} onClick={() => startCategory(cat.key)}
                  className="bg-white border-4 border-[#1A1035] p-6 rounded-2xl shadow-[6px_6px_0px_#1A1035] hover:shadow-[8px_8px_0px_#1A1035] hover:-translate-y-1 transition-all text-left group">
                  <div className="text-4xl mb-4 bg-[#F8F7FF] w-16 h-16 flex items-center justify-center rounded-xl border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] group-hover:-rotate-6 transition-transform">{cat.icon}</div>
                  <h3 className={`text-lg font-black ${cat.color} mb-2`}>{cat.label}</h3>
                  <p className="text-xs font-bold text-[#1A1035]/60 mb-6">10 questions · 30 sec each</p>
                  <span className="bg-[#1A1035] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] group-hover:bg-[#6C47FF] transition-colors">Start →</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Phase: Quiz — proctored */}
        {phase === 'quiz' && q && terminated && (
          <div className="bg-white border-4 border-[#1A1035] p-8 text-center max-w-lg mx-auto rounded-2xl shadow-[8px_8px_0px_#FF4D6D] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#FF4D6D] border-b-4 border-[#1A1035]"></div>
            <div className="text-6xl mb-6">🚫</div>
            <h2 className="text-2xl font-black text-[#FF4D6D] uppercase tracking-tight mb-4">Exam Terminated</h2>
            <p className="text-sm font-bold text-[#1A1035]/60 mb-8 leading-relaxed">Your exam was terminated due to integrity violations. Your session has been recorded.</p>
            <button onClick={resetToSelect} className="bg-white text-[#1A1035] font-black uppercase tracking-wider py-3 px-8 rounded-xl border-4 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1 transition-all">← Back to Assessments</button>
          </div>
        )}
        {phase === 'quiz' && q && !terminated && (
          <ExamProctor
            examType={category || 'unknown'}
            timeLeft={timeLeft}
            onTerminate={(reason) => { setTerminated(true); toast.error(reason); }}
          >
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black text-[#1A1035] uppercase tracking-widest bg-white border-2 border-[#1A1035] px-3 py-1 rounded shadow-[2px_2px_0px_#1A1035]">Q {currentQ + 1} / {questions.length}</span>
                <span className={`text-sm font-black px-3 py-1 rounded border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] ${timeLeft <= 10 ? 'bg-[#FF4D6D] text-white' : 'bg-[#00C9A7] text-[#1A1035]'}`}>{timeLeft}s</span>
              </div>
              <div className="w-full h-3 bg-white border-2 border-[#1A1035] rounded-full mb-8 overflow-hidden">
                <div className="h-full bg-[#6C47FF] transition-all" style={{ width: `${(currentQ / questions.length) * 100}%` }} />
              </div>
              <div className="bg-white border-4 border-[#1A1035] p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_#1A1035] space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-[#00C9A7] border-r-4 border-[#1A1035]"></div>
                <div className="pl-4">
                  <span className="bg-[#1A1035] text-white px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border-2 border-[#1A1035] mb-4 inline-block">{CATEGORIES.find(c => c.key === category)?.label}</span>
                  <h2 className="text-xl font-black text-[#1A1035] whitespace-pre-line leading-relaxed">{q.question}</h2>
                </div>
                <div className="space-y-4 pl-4">
                  {q.options.map((opt, idx) => {
                    let cls = 'w-full text-left p-4 rounded-xl border-4 transition-all text-sm font-bold flex items-center ';
                    if (selectedOption === null) {
                      cls += 'border-[#1A1035] bg-[#F8F7FF] text-[#1A1035] hover:bg-white hover:shadow-[4px_4px_0px_#1A1035] hover:-translate-y-1 cursor-pointer';
                    } else if (idx === q.correct) {
                      cls += 'border-[#1A1035] bg-[#00C9A7] text-[#1A1035] shadow-[4px_4px_0px_#1A1035]';
                    } else if (idx === selectedOption && idx !== q.correct) {
                      cls += 'border-[#1A1035] bg-[#FF4D6D] text-white shadow-[4px_4px_0px_#1A1035]';
                    } else {
                      cls += 'border-[#1A1035]/20 bg-[#F8F7FF]/50 text-[#1A1035]/40 cursor-not-allowed';
                    }
                    return (
                      <button key={idx} className={cls} onClick={() => handleOptionClick(idx)} disabled={selectedOption !== null}>
                        <span className={`w-8 h-8 rounded flex items-center justify-center mr-4 border-2 font-black ${selectedOption === null ? 'border-[#1A1035] bg-white text-[#1A1035]' : (idx === q.correct ? 'border-[#1A1035] bg-white text-[#1A1035]' : (idx === selectedOption ? 'border-white bg-[#1A1035] text-white' : 'border-[#1A1035]/20 bg-transparent text-[#1A1035]/40'))}`}>{String.fromCharCode(65 + idx)}</span>{opt}
                      </button>
                    );
                  })}
                </div>
                {showExplanation && (
                  <div className="p-4 bg-[#F8F7FF] border-2 border-[#1A1035] rounded-xl ml-4 relative">
                    <div className="absolute -left-2 top-4 w-4 h-4 bg-[#F8F7FF] border-l-2 border-b-2 border-[#1A1035] transform rotate-45"></div>
                    <p className="text-xs font-black text-[#1A1035] uppercase tracking-widest mb-2 flex items-center gap-2"><span className="text-xl">💡</span> Explanation</p>
                    <p className="text-sm font-bold text-[#1A1035]/70 leading-relaxed">{q.explanation}</p>
                  </div>
                )}
                {selectedOption !== null && (
                  <div className="pl-4 pt-4 border-t-4 border-[#1A1035]/10">
                    <button onClick={() => advanceQuestion()} className="bg-[#1A1035] text-white font-black uppercase tracking-wider py-4 px-8 rounded-xl border-4 border-[#1A1035] shadow-[4px_4px_0px_#00C9A7] hover:shadow-[6px_6px_0px_#00C9A7] hover:-translate-y-1 transition-all w-full text-lg">
                      {currentQ + 1 >= questions.length ? '🏁 See Results' : 'Next Question →'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </ExamProctor>
        )}

        {/* Phase: Result */}
        {phase === 'result' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-white border-4 border-[#1A1035] p-8 sm:p-12 text-center rounded-2xl shadow-[8px_8px_0px_#00C9A7] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00C9A7] rounded-full blur-3xl -mr-16 -mt-16 opacity-30"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#6C47FF] rounded-full blur-3xl -ml-16 -mb-16 opacity-30"></div>
              <div className="text-6xl mb-6 relative z-10 animate-bounce">🎉</div>
              <h2 className="text-3xl font-black text-[#1A1035] uppercase tracking-tight mb-2 relative z-10">Assessment Complete!</h2>
              <div className="inline-block bg-[#1A1035] text-[#00C9A7] text-7xl font-black px-8 py-4 rounded-2xl border-4 border-[#1A1035] shadow-[6px_6px_0px_#00C9A7] my-8 transform rotate-2 relative z-10">
                {scorePercent}<span className="text-4xl text-white/50">%</span>
              </div>
              <p className="text-[#1A1035]/60 font-bold text-lg mb-2 relative z-10">You scored <span className="text-[#1A1035] font-black bg-[#F8F7FF] px-2 py-1 rounded border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035]">{score} / {questions.length}</span> correct</p>
              <p className="text-xs font-black text-[#1A1035]/50 uppercase tracking-widest mb-8 relative z-10">
                This updates your <span className="text-[#6C47FF] bg-white px-2 py-0.5 rounded border border-[#1A1035]">{CATEGORIES.find(c => c.key === category)?.label}</span> score
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                <button onClick={handleSaveScore} disabled={saving} className="bg-[#1A1035] text-white font-black uppercase tracking-wider py-4 px-8 rounded-xl border-4 border-[#1A1035] shadow-[4px_4px_0px_#00C9A7] hover:shadow-[6px_6px_0px_#00C9A7] hover:-translate-y-1 transition-all disabled:opacity-50 text-sm">
                  {saving ? '💾 Saving...' : '💾 Save Score'}
                </button>
                <div className="flex gap-4 w-full sm:w-auto">
                  <button onClick={() => { if (category) startCategory(category); }} className="flex-1 bg-white text-[#1A1035] font-black uppercase tracking-wider py-4 px-6 rounded-xl border-4 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1 transition-all text-xs">
                    🔄 Retry
                  </button>
                  <button onClick={resetToSelect} className="flex-1 bg-white text-[#1A1035] font-black uppercase tracking-wider py-4 px-6 rounded-xl border-4 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1 transition-all text-xs">
                    ← Categories
                  </button>
                </div>
              </div>
            </div>

            {/* Review answers */}
            <div className="bg-white border-4 border-[#1A1035] p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_#1A1035]">
              <h3 className="text-sm font-black text-[#1A1035] uppercase tracking-wider mb-6 border-b-4 border-[#1A1035]/10 pb-4">Review Answers</h3>
              <div className="space-y-4">
                {questions.map((q2, i) => {
                  const yours = answers[i];
                  const correct = q2.correct;
                  const wasCorrect = yours === correct;
                  return (
                    <div key={i} className={`p-4 rounded-xl border-4 ${wasCorrect ? 'border-[#1A1035] bg-[#00C9A7]/10' : 'border-[#1A1035] bg-[#FF4D6D]/10'}`}>
                      <div className="flex items-start gap-3 mb-2">
                        <span className={`text-sm mt-0.5 w-6 h-6 flex items-center justify-center rounded border-2 border-[#1A1035] font-black ${wasCorrect ? 'bg-[#00C9A7] text-[#1A1035]' : 'bg-[#FF4D6D] text-white'}`}>{wasCorrect ? '✓' : '✕'}</span>
                        <p className="text-[#1A1035] font-bold text-sm leading-relaxed">{q2.question}</p>
                      </div>
                      {!wasCorrect && (
                        <div className="ml-9 mt-3 p-3 bg-white border-2 border-[#1A1035] rounded-xl text-xs font-bold shadow-[2px_2px_0px_#1A1035]">
                          <p className="text-[#1A1035] mb-1">Correct: <span className="text-[#00C9A7] bg-[#F8F7FF] px-1.5 py-0.5 rounded border border-[#1A1035]">{q2.options[correct]}</span></p>
                          {yours >= 0 && <p className="text-[#1A1035]/60 mt-2 pt-2 border-t border-[#1A1035]/10">Your answer: <span className="text-[#FF4D6D] line-through">{q2.options[yours]}</span></p>}
                        </div>
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
