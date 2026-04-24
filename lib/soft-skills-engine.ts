// SmartPRS — Soft Skills Analysis Engine (Speech-Optimized)

export interface PerQuestionResult {
  question: string; answer: string; wordCount: number;
  fillerWordsFound: string[]; fillerCount: number;
  structure: { hasIntro: boolean; hasBody: boolean; hasConclusion: boolean };
  detectedKeywords: string[]; confidence: number; clarity: number;
}

export interface Recommendation { type: 'critical' | 'warning' | 'info' | 'success'; title: string; detail: string; }

export interface SoftSkillsReport {
  overallScore: number; avgConfidence: number; avgClarity: number;
  totalFillers: number; avgWords: number; allKeywords: string[]; allFillers: string[];
  hasIntro: boolean; hasBody: boolean; hasConclusion: boolean;
  perQuestionResults: PerQuestionResult[]; recommendations: Recommendation[];
  grade: string; whatWorked: string[]; whatToImprove: { issue: string; tip: string }[];
  topTip: string;
}

const FILLER_RE = /\b(um+|uh+|uhm+|umm+|hmm+|hm+|err+|erm|ah+|ahh+|ohh?|ouch|oops|ow|yikes|shoot|like|sort of|kind of|you know|i mean|basically|literally|okay so|right so|well so|actually|honestly|seriously|obviously|clearly|whatever|anyway|look so|i guess|i suppose|at the end of the day|to be honest|to be fair)\b/gi;

const INTRO_RE = [/\bmy name\b/i, /\bi('| a)m\b/i, /\blet me\b/i, /\bso i\b/i, /\bwell i\b/i,
  /\bto start\b/i, /\bfirst(ly)?\b/i, /\bhi\b/i, /\bhello\b/i, /\bi think\b/i,
  /\bhonestly\b/i, /\bfor me\b/i, /\bpersonally\b/i, /\bi would say\b/i,
  /\bi have been\b/i, /\bi studied\b/i, /\bi come from\b/i, /\bcurrently\b/i];

const BODY_RE = [/\bbecause\b/i, /\bso\b/i, /\band then\b/i, /\bafter that\b/i,
  /\bwhen\b/i, /\bonce\b/i, /\bi was\b/i, /\bwe had\b/i, /\bthere was\b/i,
  /\bi had to\b/i, /\bi decided\b/i, /\bi found\b/i, /\bfor example\b/i,
  /\blike when\b/i, /\bwhat happened\b/i, /\bthe thing is\b/i,
  /\bi needed\b/i, /\bwe were\b/i, /\bmy role\b/i, /\bit was\b/i];

const CONCLUSION_RE = [/\bso that('s| is)?\b/i, /\bin the end\b/i, /\beventually\b/i,
  /\bfinally\b/i, /\boverall\b/i, /\bthis (taught|helped|showed)\b/i,
  /\bi learned\b/i, /\bthat'?s (why|how)\b/i, /\band that\b/i,
  /\blooking back\b/i, /\bgoing forward\b/i, /\bnow i\b/i, /\bthese days\b/i,
  /\bi hope\b/i, /\bi want to\b/i, /\bi see myself\b/i];

const KEYWORDS: Record<string, RegExp[]> = {
  leadership: [/\b(led|managed|organized|directed|guided|in charge|lead|took charge)\b/i],
  teamwork: [/\b(team|together|collaborated|group|helped|worked with|classmates|peers)\b/i],
  problemSolving: [/\b(solved|fixed|resolved|improved|handled|figured out|overcame|dealt with)\b/i],
  communication: [/\b(explained|presented|discussed|shared|told|spoke|talked)\b/i],
  initiative: [/\b(started|decided|proposed|volunteered|on my own|independently)\b/i],
  growth: [/\b(learned|grew|improved|developed|gained|realized|understood|experience)\b/i],
};

export function analyzeSoftSkillResponses(
  responses: { question: string; answer: string }[],
  preDetectedFillers: string[] = []   // fillers caught from interim STT results
): SoftSkillsReport {
  const results: PerQuestionResult[] = responses.map((r) => {
    const text = r.answer.trim();
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Regex scan on final transcript
    const fillerMatches = text.match(FILLER_RE) || [];
    const fromRegex = fillerMatches.map(f => f.toLowerCase());

    // Merge with pre-detected fillers (from interim results)
    const merged = Array.from(new Set([...fromRegex, ...preDetectedFillers.map(f => f.toLowerCase())]));
    const foundFillers = merged;
    // Total count = regex matches + any pre-detected that weren't in transcript
    const extraCount = preDetectedFillers.filter(f => !fromRegex.includes(f.toLowerCase())).length;
    const fillerCount = fillerMatches.length + extraCount;

    const hasIntro = INTRO_RE.some(re => re.test(text)) || wordCount >= 20;
    const hasBody = BODY_RE.some(re => re.test(text)) || wordCount >= 30;
    const hasConclusion = CONCLUSION_RE.some(re => re.test(text)) || wordCount >= 40;

    const detectedKeywords = Object.entries(KEYWORDS)
      .filter(([, patterns]) => patterns.some(re => re.test(text)))
      .map(([cat]) => cat);

    let confidence = 55;
    if (wordCount > 15) confidence += 8;
    if (wordCount > 40) confidence += 10;
    if (wordCount > 80) confidence += 7;
    if (hasIntro) confidence += 5;
    if (hasBody) confidence += 5;
    if (hasConclusion) confidence += 5;
    if (fillerCount === 0) confidence += 5;
    if (fillerCount > 4) confidence -= 10;
    if (detectedKeywords.length >= 1) confidence += 5;
    if (detectedKeywords.length >= 3) confidence += 5;
    confidence = Math.min(100, Math.max(25, confidence));

    let clarity = 55;
    if (wordCount >= 15) clarity += 8;
    if (wordCount >= 40) clarity += 10;
    if (wordCount >= 80) clarity += 7;
    if (hasBody) clarity += 5;
    if (fillerCount > 4) clarity -= 8;
    if (wordCount < 10) clarity -= 15;
    clarity = Math.min(100, Math.max(25, clarity));

    return { question: r.question, answer: r.answer, wordCount,
      fillerWordsFound: foundFillers, fillerCount,
      structure: { hasIntro, hasBody, hasConclusion },
      detectedKeywords, confidence, clarity };
  });

  const n = results.length || 1;
  const avgConfidence = Math.round(results.reduce((s, r) => s + r.confidence, 0) / n);
  const avgClarity = Math.round(results.reduce((s, r) => s + r.clarity, 0) / n);
  const totalFillers = results.reduce((s, r) => s + r.fillerCount, 0);
  const avgWords = Math.round(results.reduce((s, r) => s + r.wordCount, 0) / n);
  const allKeywords = Array.from(new Set(results.flatMap(r => r.detectedKeywords)));
  const allFillers = Array.from(new Set(results.flatMap(r => r.fillerWordsFound)));
  const overallScore = Math.round(avgConfidence * 0.4 + avgClarity * 0.6);
  const hasIntro = results.some(r => r.structure.hasIntro);
  const hasBody = results.some(r => r.structure.hasBody);
  const hasConclusion = results.some(r => r.structure.hasConclusion);

  const whatWorked: string[] = [];
  const whatToImprove: { issue: string; tip: string }[] = [];

  if (hasIntro) whatWorked.push('Good introduction detected');
  if (hasBody) whatWorked.push('Used examples/reasoning');
  if (hasConclusion) whatWorked.push('Clear conclusion');
  if (totalFillers === 0) whatWorked.push('No filler words — great speech control!');
  if (allKeywords.length > 0) whatWorked.push(`Power keywords: ${allKeywords.join(', ')}`);
  if (avgWords >= 40) whatWorked.push('Good answer length');

  if (!hasIntro) whatToImprove.push({ issue: 'No clear introduction', tip: 'Start with "I am..." or "So basically..."' });
  if (!hasBody) whatToImprove.push({ issue: 'Missing examples/stories', tip: 'Try "For example, one time..." or "What happened was..."' });
  if (!hasConclusion) whatToImprove.push({ issue: 'No clear wrap-up', tip: 'End with "So that\'s why..." or "I learned that..."' });
  if (avgWords < 15) whatToImprove.push({ issue: `Only ${avgWords} words — too short`, tip: 'Aim for at least 40 words per answer' });
  else if (avgWords < 40) whatToImprove.push({ issue: `${avgWords} words — could be longer`, tip: 'Try to speak for at least 20 seconds' });
  if (totalFillers > 3) whatToImprove.push({ issue: `${totalFillers} filler words (${allFillers.slice(0, 3).join(', ')})`, tip: 'Pause briefly instead of saying "um" or "like"' });

  const recommendations: Recommendation[] = [];
  if (whatWorked.length > 0) recommendations.push({ type: 'success', title: 'What You Did Well', detail: whatWorked.join('. ') + '.' });
  whatToImprove.forEach(w => recommendations.push({ type: avgWords < 15 ? 'critical' : 'warning', title: w.issue, detail: w.tip }));

  let topTip = 'Practice speaking for at least 20 seconds per question.';
  if (avgWords < 15) topTip = 'Your biggest priority: speak more! Aim for 40+ words per answer. Even simple stories count.';
  else if (totalFillers > 3) topTip = 'Focus on reducing filler words. Try pausing for a breath instead of saying "um" — it sounds more confident.';
  else if (!hasBody) topTip = 'Add a real example or story. "One time at college..." makes your answer 10x more memorable.';
  else if (overallScore >= 75) topTip = 'You\'re doing great! Keep practicing and try to be slightly more concise.';

  const grade = overallScore >= 80 ? 'Excellent' : overallScore >= 65 ? 'Good' : overallScore >= 50 ? 'Average' : 'Needs Work';

  return { overallScore, avgConfidence, avgClarity, totalFillers, avgWords,
    allKeywords, allFillers, hasIntro, hasBody, hasConclusion,
    perQuestionResults: results, recommendations, grade,
    whatWorked, whatToImprove, topTip };
}

export function generateReportText(report: SoftSkillsReport, studentName: string): string {
  return `SMARTPRS — SOFT SKILLS REPORT
Student: ${studentName} | Date: ${new Date().toLocaleDateString()}
${'═'.repeat(40)}
SCORE: ${report.overallScore}/100 | GRADE: ${report.grade}

Confidence: ${report.avgConfidence}/100
Clarity: ${report.avgClarity}/100
Avg Words: ${report.avgWords}
Filler Words: ${report.totalFillers}

WHAT WORKED:
${report.whatWorked.length ? report.whatWorked.map(w => `  ✅ ${w}`).join('\n') : '  (none detected)'}

WHAT TO IMPROVE:
${report.whatToImprove.length ? report.whatToImprove.map(w => `  ❌ ${w.issue}\n     → ${w.tip}`).join('\n') : '  (nothing — great job!)'}

TOP TIP: ${report.topTip}
${'═'.repeat(40)}
Generated by SmartPRS`;
}
